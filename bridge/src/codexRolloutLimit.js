// codexRolloutLimit.js — lee el limite de uso de Codex desde los rollouts
// (~/.codex/sessions/AAAA/MM/DD/rollout-*-<threadId>.jsonl) en vez de depender
// solo del texto del aviso. Usado por codex-bridge.js; complementa a
// rateLimitDetect.js (el texto sigue siendo el respaldo).
//
// Evidencia (rollout del 5/10/2026): al agotarse la cuota, el turno termina con
//   event_msg/task_complete { error: { codex_error_info: "usage_limit_exceeded", message } }
// y el token_count de ese turno trae primary/secondary en null (sin hora de
// reinicio). La hora absoluta (resets_at, epoch en segundos) esta en los
// token_count anteriores de la cuenta: primary = ventana de 5 h, secondary =
// semanal.

const fs = require('fs');
const os = require('os');
const path = require('path');

const TAIL_BYTES = 512 * 1024;
const LIMIT_ERROR_CODE = 'usage_limit_exceeded';

function sessionsDir() {
  return path.join(process.env.CODEX_HOME || path.join(os.homedir(), '.codex'), 'sessions');
}

function readTailLines(file, maxBytes = TAIL_BYTES) {
  try {
    const { size } = fs.statSync(file);
    const length = Math.min(size, maxBytes);
    const fd = fs.openSync(file, 'r');
    try {
      const buf = Buffer.alloc(length);
      fs.readSync(fd, buf, 0, length, size - length);
      const lines = buf.toString('utf8').split('\n');
      if (size > length) lines.shift(); // primera linea posiblemente cortada
      return lines.filter(Boolean);
    } finally {
      fs.closeSync(fd);
    }
  } catch {
    return [];
  }
}

function parseLine(line) {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}

function listDesc(dir) {
  try {
    return fs.readdirSync(dir).sort().reverse();
  } catch {
    return [];
  }
}

// Rollout de un hilo: el nombre termina en -<threadId>.jsonl; vive en la carpeta
// del dia en que se creo el hilo (un hilo retomado sigue en su carpeta original).
function findRolloutByThread(threadId, root = sessionsDir()) {
  if (!threadId) return null;
  const suffix = `-${threadId}.jsonl`;
  for (const year of listDesc(root)) {
    for (const month of listDesc(path.join(root, year))) {
      for (const day of listDesc(path.join(root, year, month))) {
        const dayDir = path.join(root, year, month, day);
        const hit = listDesc(dayDir).find(name => name.endsWith(suffix));
        if (hit) return path.join(dayDir, hit);
      }
    }
  }
  return null;
}

// true si el ultimo turno del rollout termino por limite de uso y ocurrio en o
// despues de sinceMs (evita contar un limite viejo de un hilo retomado).
function turnHitUsageLimit(lines, sinceMs = 0) {
  for (let i = lines.length - 1; i >= 0; i--) {
    const event = parseLine(lines[i]);
    if (!event || event.type !== 'event_msg' || event.payload?.type !== 'task_complete') continue;
    const at = Date.parse(event.timestamp || '');
    if (Number.isFinite(at) && at < sinceMs) return false;
    return event.payload?.error?.codex_error_info === LIMIT_ERROR_CODE;
  }
  return false;
}

// Ultimo rate_limits con ventanas informadas (primary/secondary no nulos) entre
// las lineas dadas. Devuelve [{ name, usedPercent, windowMinutes, resetsAtMs }].
function lastKnownWindows(lines) {
  for (let i = lines.length - 1; i >= 0; i--) {
    if (!lines[i].includes('"rate_limits"')) continue;
    const limits = parseLine(lines[i])?.payload?.rate_limits;
    if (!limits) continue;
    const windows = ['primary', 'secondary']
      .map(name => ({ name, w: limits[name] }))
      .filter(({ w }) => w && Number.isFinite(Number(w.resets_at)))
      .map(({ name, w }) => ({
        name,
        usedPercent: Number(w.used_percent),
        windowMinutes: Number(w.window_minutes),
        resetsAtMs: Number(w.resets_at) * 1000
      }));
    if (windows.length) return windows;
  }
  return [];
}

// Ventanas de la cuenta: el rate_limits informado mas reciente entre los
// rollouts modificados mas recientemente (el limite es de la cuenta, no del hilo).
function latestAccountWindows(root = sessionsDir(), maxFiles = 8) {
  const files = [];
  for (const year of listDesc(root)) {
    for (const month of listDesc(path.join(root, year))) {
      for (const day of listDesc(path.join(root, year, month))) {
        const dayDir = path.join(root, year, month, day);
        for (const name of listDesc(dayDir)) {
          if (!name.endsWith('.jsonl')) continue;
          const file = path.join(dayDir, name);
          try { files.push({ file, mtimeMs: fs.statSync(file).mtimeMs }); } catch { /* ignorar */ }
        }
        if (files.length >= maxFiles * 3) break;
      }
      if (files.length >= maxFiles * 3) break;
    }
    if (files.length >= maxFiles * 3) break;
  }
  files.sort((a, b) => b.mtimeMs - a.mtimeMs);
  for (const { file } of files.slice(0, maxFiles)) {
    const windows = lastKnownWindows(readTailLines(file));
    if (windows.length) return windows;
  }
  return [];
}

function minuteOfDay(ms) {
  const d = new Date(ms);
  return d.getHours() * 60 + d.getMinutes();
}

// Elige la hora de reinicio (ISO/UTC) entre las ventanas aun vigentes.
// - Con hora del texto ("try again at 7:15 PM"): la ventana cuya hora local
//   coincide; asi tambien se resuelve el dia correcto de un limite semanal.
// - Sin texto: la ventana mas gastada, solo si llego al 90 %.
// Devuelve null si no hay certeza (quien llama usa su respaldo).
function chooseResetAt(windows, { textResetAtIso = null, nowMs = Date.now() } = {}) {
  const live = windows.filter(w => w.resetsAtMs > nowMs);
  if (!live.length) return null;
  if (textResetAtIso && Number.isFinite(Date.parse(textResetAtIso))) {
    const wanted = minuteOfDay(Date.parse(textResetAtIso));
    const match = live.find(w => minuteOfDay(w.resetsAtMs) === wanted);
    return match ? new Date(match.resetsAtMs).toISOString() : null;
  }
  const fullest = [...live].sort((a, b) => b.usedPercent - a.usedPercent)[0];
  return fullest.usedPercent >= 90 ? new Date(fullest.resetsAtMs).toISOString() : null;
}

// Consulta completa para el bridge. Nunca lanza: ante cualquier problema
// devuelve { limited: false, resetAt: null }.
function readCodexLimit({ threadId, sinceMs = 0, textResetAtIso = null, root = sessionsDir() }) {
  try {
    const rollout = findRolloutByThread(threadId, root);
    const limited = rollout ? turnHitUsageLimit(readTailLines(rollout), sinceMs) : false;
    const resetAt = chooseResetAt(latestAccountWindows(root), { textResetAtIso });
    return { limited, resetAt, rollout };
  } catch {
    return { limited: false, resetAt: null, rollout: null };
  }
}

module.exports = {
  readCodexLimit,
  findRolloutByThread,
  turnHitUsageLimit,
  lastKnownWindows,
  latestAccountWindows,
  chooseResetAt,
  readTailLines
};
