// rateLimitDetect.js — deteccion compartida de "limite de uso/sesion" en la
// salida de un CLI de host (Claude Code o Codex). Usado por claude-bridge.js
// y codex-bridge.js; NO depende de ninguno de los dos.
//
// Por que se resuelve la hora ACA y no en el backend: este archivo corre
// dentro del bridge, en Windows, en la misma zona horaria en la que el CLI
// imprime el mensaje ("resets 3am" es hora local del proceso que lo genera).
// El backend puede correr en un container Docker con otro TZ (verificado:
// el host esta en UTC-3 y una imagen node:18-alpine por defecto esta en UTC).
// Por eso esta funcion devuelve resetAt ya como ISO/UTC absoluto — el
// backend nunca debe intentar interpretar texto de hora por su cuenta.

const LIMIT_PATTERN = /you.?ve hit your (?:session|usage) limit/i;
const RESET_TIME_PATTERN = /resets?\s+(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*([ap]\.?m\.?)?/i;

function resolveResetIso(match, now) {
  if (!match) return null;
  let hour = parseInt(match[1], 10);
  const minute = match[2] ? parseInt(match[2], 10) : 0;
  const meridiem = match[3] ? match[3].toLowerCase().replace(/\./g, '') : null;
  if (Number.isNaN(hour)) return null;
  if (meridiem === 'pm' && hour < 12) hour += 12;
  if (meridiem === 'am' && hour === 12) hour = 0;

  const candidate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
  if (candidate.getTime() <= now.getTime()) {
    candidate.setDate(candidate.getDate() + 1);
  }
  return candidate.toISOString();
}

// Revisa un texto (stdout o stderr crudo del CLI) en busca del banner de
// limite. Devuelve null si no matchea, o { isLimited:true, resetAt, raw }.
// resetAt puede ser null si el mensaje no trajo una hora reconocible — en
// ese caso quien llama debe aplicar su propio fallback (ver
// SESSION_WINDOW_FALLBACK_HOURS en el backend).
function detectRateLimit(text) {
  if (!text) return null;
  const trimmed = String(text).trim();
  if (!trimmed || !LIMIT_PATTERN.test(trimmed)) return null;
  const match = trimmed.match(RESET_TIME_PATTERN);
  return {
    isLimited: true,
    resetAt: resolveResetIso(match, new Date()),
    raw: trimmed.slice(0, 500)
  };
}

module.exports = { detectRateLimit };
