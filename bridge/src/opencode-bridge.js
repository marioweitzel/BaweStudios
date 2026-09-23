// opencode-bridge.js — Bridge HTTP para OpenCode, hermano paralelo de
// codex-bridge.js/claude-bridge.js. NO modifica ni depende de ninguno de los
// dos: mismo contrato HTTP (health/status/stop) pero ejecuta el CLI de
// OpenCode en vez de Codex o Claude Code.
//
// Puerto por defecto: 5002 (ver tabla de puertos en README.md — era el
// siguiente slot libre reservado a propósito para el próximo huésped).
//
// Diferencia real con los otros dos bridges: `opencode run --format json`
// no imprime un solo JSON al final (como `claude -p --output-format json` o
// `codex exec --json`) — imprime un evento JSON por línea (NDJSON) a medida
// que van pasando cosas (step_start, tool_use, text, step_finish, error).
// El texto final de la respuesta es el de los eventos "text" antes del
// último "step_finish" con reason:"stop"; cualquier evento "error" en el
// stream se trata como fallo.

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn, execFileSync } = require('child_process');
const { detectRateLimit } = require('./rateLimitDetect');

const PORT = Number(process.env.OPENCODE_BRIDGE_PORT || 5002);
// Variante Linux: se autoubica igual que BRIDGE_LOG_PATH unas lineas mas
// abajo, en vez de asumir una instalacion fija.
const DEFAULT_CWD = process.env.OPENCODE_CWD || path.join(__dirname, '..', '..', 'root', 'bawestudios');
const BRIDGE_LOG_PATH = path.join(__dirname, '..', '..', 'logs', 'opencode-bridge.log');
// En Linux 'opencode' resuelve por PATH sin problema con spawn/shell:false
// (no existe el shim que en Windows fuerza a resolver el binario por path
// directo) -- el chequeo de instalacion tampoco puede depender de un path de
// npm hardcodeado (varia segun apt/NodeSource/nvm), asi que se usa `which`.
function isCliInstalled(command) {
  try {
    execFileSync('which', [command], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}
const activeProcesses = new Map();
const opencodeSessions = new Map();
const completedProcesses = new Map();
let rateLimitedUntil = null;

function truncateText(text, maxLength = 1000) {
  const value = String(text || '');
  return value.length > maxLength ? value.slice(0, maxLength) : value;
}

function safeProcessAlive(proc) {
  return Boolean(proc && proc.exitCode === null && proc.signalCode === null && !proc.killed);
}

function publicRunState(sessionId, run) {
  if (!run) return null;
  return {
    ok: true,
    sessionId,
    status: run.status,
    pid: run.pid || null,
    startedAt: run.startedAtIso,
    updatedAt: run.updatedAtIso,
    timedOut: Boolean(run.timedOut),
    alive: run.proc ? safeProcessAlive(run.proc) : false,
    threadId: run.opencodeSessionId || null,
    code: typeof run.code === 'number' ? run.code : null,
    text: run.text || null,
    stderr: truncateText(run.stderr || '', 1000)
  };
}

function writeBridgeLog(event) {
  try {
    fs.mkdirSync(path.dirname(BRIDGE_LOG_PATH), { recursive: true });
    fs.appendFileSync(
      BRIDGE_LOG_PATH,
      JSON.stringify({ timestamp: new Date().toISOString(), ...event }) + '\n',
      'utf8'
    );
  } catch {
    // Logging must not affect bridge behavior.
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 1024 * 1024) {
        reject(new Error('Request body too large'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'content-type': 'application/json',
    'content-length': Buffer.byteLength(body)
  });
  res.end(body);
}

// Parsea el stream NDJSON de `opencode run --format json`: una linea = un
// evento. Junta el texto de todos los eventos "text" en orden (una
// respuesta puede llegar en mas de un evento) y reporta el primer "error"
// que aparezca. sessionID sale de cualquier evento, todos lo llevan.
function extractOpencodeOutput(stdout) {
  const trimmed = stdout.trim();
  if (!trimmed) return { text: null, sessionId: null, isError: false };

  let sessionId = null;
  let text = '';
  let errorMessage = null;

  for (const line of trimmed.split('\n')) {
    const raw = line.trim();
    if (!raw) continue;
    let event;
    try {
      event = JSON.parse(raw);
    } catch {
      continue; // linea no-JSON suelta: ignorar, no romper el resto del parseo
    }
    if (event.sessionID && !sessionId) sessionId = event.sessionID;
    if (event.type === 'text' && typeof event.part?.text === 'string') {
      text += event.part.text;
    }
    if (event.type === 'error' && !errorMessage) {
      errorMessage = event.error?.data?.message || event.error?.message || 'OpenCode devolvio un error sin mensaje';
    }
  }

  if (errorMessage) return { text: null, sessionId, isError: true, errorMessage };
  return { text: text.trim() || null, sessionId, isError: false };
}

function buildOpencodeArgs(message, opencodeSessionId) {
  const args = ['run', message, '--format', 'json', '--auto'];
  if (opencodeSessionId) {
    args.push('--session', opencodeSessionId);
  }
  return args;
}

function runOpencode({ sessionId, message, cwd, command, timeoutMs, rememberSession }) {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const startedAtIso = new Date(startedAt).toISOString();
    const workingDir = cwd || DEFAULT_CWD;
    const shouldRememberSession = rememberSession !== false;
    if (sessionId && !shouldRememberSession) {
      opencodeSessions.delete(sessionId);
    }
    const storedSession = sessionId && shouldRememberSession ? opencodeSessions.get(sessionId) : null;
    const opencodeSessionId = storedSession?.opencodeSessionId || null;
    const executable = command || 'opencode';
    const finalArgs = buildOpencodeArgs(message, opencodeSessionId);
    const effectiveTimeoutMs = Number(timeoutMs || 120000);

    if (!fs.existsSync(workingDir)) {
      const err = new Error(`cwd no existe en host: ${workingDir}`);
      writeBridgeLog({
        event: 'opencode.error',
        sessionId: sessionId || null,
        error: err.message,
        durationMs: Date.now() - startedAt
      });
      reject(err);
      return;
    }

    writeBridgeLog({
      event: 'opencode.spawn',
      sessionId: sessionId || null,
      executable,
      cwd: workingDir,
      pid: null,
      mode: opencodeSessionId ? 'resume' : 'new',
      opencodeSessionId: opencodeSessionId || null,
      rememberSession: shouldRememberSession
    });

    const proc = spawn(executable, finalArgs, {
      cwd: workingDir,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false
    });

    writeBridgeLog({
      event: 'opencode.spawned',
      sessionId: sessionId || null,
      pid: proc.pid || null,
      executable,
      cwd: workingDir,
      mode: opencodeSessionId ? 'resume' : 'new',
      opencodeSessionId: opencodeSessionId || null,
      rememberSession: shouldRememberSession
    });

    let stdout = '';
    let stderr = '';
    let settled = false;
    const runState = {
      proc,
      pid: proc.pid || null,
      status: 'running',
      startedAtIso,
      updatedAtIso: startedAtIso,
      timedOut: false,
      opencodeSessionId: opencodeSessionId || null,
      code: null,
      text: null,
      stderr: ''
    };
    function clearActiveProcess() {
      if (sessionId && activeProcesses.get(sessionId) === runState) {
        activeProcesses.delete(sessionId);
      }
    }

    if (sessionId) {
      activeProcesses.set(sessionId, runState);
    }

    const timer = setTimeout(() => {
      runState.timedOut = true;
      runState.status = 'running_timeout';
      runState.updatedAtIso = new Date().toISOString();
      writeBridgeLog({
        event: 'opencode.timeout.review',
        sessionId: sessionId || null,
        pid: proc.pid || null,
        message: `OpenCode sigue activo despues de ${effectiveTimeoutMs}ms; no se mata el proceso`,
        durationMs: Date.now() - startedAt,
        activeProcesses: activeProcesses.size
      });
      if (!settled) {
        settled = true;
        resolve({
          ok: true,
          status: 'running',
          timedOut: true,
          pid: proc.pid || null,
          sessionId: sessionId || null,
          message: `OpenCode sigue activo despues de ${effectiveTimeoutMs}ms`,
          threadId: runState.opencodeSessionId || null
        });
      }
    }, effectiveTimeoutMs);

    proc.stdout.on('data', chunk => {
      stdout += chunk.toString();
      runState.updatedAtIso = new Date().toISOString();
    });
    proc.stderr.on('data', chunk => {
      stderr += chunk.toString();
      runState.updatedAtIso = new Date().toISOString();
    });
    proc.on('error', err => {
      clearTimeout(timer);
      clearActiveProcess();
      runState.status = 'failed';
      runState.stderr = err.message;
      runState.updatedAtIso = new Date().toISOString();
      if (sessionId) completedProcesses.set(sessionId, publicRunState(sessionId, runState));
      writeBridgeLog({
        event: 'opencode.error',
        sessionId: sessionId || null,
        error: err.message,
        durationMs: Date.now() - startedAt
      });
      if (!settled) {
        settled = true;
        reject(err);
      }
    });
    proc.on('exit', code => {
      clearTimeout(timer);
      clearActiveProcess();

      const limitInfo = detectRateLimit(stdout) || detectRateLimit(stderr);
      if (limitInfo) {
        rateLimitedUntil = limitInfo.resetAt;
        runState.status = 'rate_limited';
        runState.code = code;
        runState.text = null;
        runState.stderr = stderr;
        runState.updatedAtIso = new Date().toISOString();
        if (sessionId) completedProcesses.set(sessionId, publicRunState(sessionId, runState));
        writeBridgeLog({
          event: 'opencode.rate_limited',
          sessionId: sessionId || null,
          pid: proc.pid || null,
          resetAt: limitInfo.resetAt,
          raw: limitInfo.raw,
          durationMs: Date.now() - startedAt
        });
        if (!settled) {
          settled = true;
          resolve({
            ok: false,
            status: 'rate_limited',
            resetAt: limitInfo.resetAt,
            pid: proc.pid || null,
            sessionId: sessionId || null
          });
        }
        return;
      }

      const { text, sessionId: outputSessionId, isError, errorMessage } = extractOpencodeOutput(stdout);
      const effectiveOpencodeSessionId = outputSessionId || opencodeSessionId;
      runState.status = text && code === 0 && !isError ? 'completed' : 'failed';
      runState.code = code;
      runState.text = text || null;
      runState.opencodeSessionId = effectiveOpencodeSessionId || null;
      runState.stderr = stderr;
      runState.updatedAtIso = new Date().toISOString();
      if (sessionId && effectiveOpencodeSessionId && code === 0 && shouldRememberSession) {
        opencodeSessions.set(sessionId, {
          opencodeSessionId: effectiveOpencodeSessionId,
          cwd: workingDir,
          updatedAt: new Date().toISOString(),
          lastPid: proc.pid || null
        });
      } else if (sessionId && !shouldRememberSession) {
        opencodeSessions.delete(sessionId);
      }
      if (sessionId) completedProcesses.set(sessionId, publicRunState(sessionId, runState));
      const durationMs = Date.now() - startedAt;
      writeBridgeLog({
        event: 'opencode.exit',
        sessionId: sessionId || null,
        pid: proc.pid || null,
        code,
        durationMs,
        parsedText: Boolean(text),
        opencodeSessionId: effectiveOpencodeSessionId || null,
        rememberSession: shouldRememberSession,
        stderr: truncateText(stderr, 1000)
      });

      if (!text || isError) {
        const err = new Error(errorMessage || stderr.trim() || `OpenCode exit ${code} sin respuesta parseada`);
        writeBridgeLog({
          event: 'opencode.error',
          sessionId: sessionId || null,
          error: err.message,
          durationMs
        });
        if (!settled) {
          settled = true;
          reject(err);
        }
        return;
      }

      if (!settled) {
        settled = true;
        resolve({
          ok: true,
          status: 'completed',
          pid: proc.pid || null,
          code,
          text,
          threadId: effectiveOpencodeSessionId || null,
          mode: opencodeSessionId ? 'resume' : 'new',
          stderr: truncateText(stderr, 1000)
        });
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url === '/health') {
      sendJson(res, 200, {
        status: 'ok',
        service: 'opencode-bridge',
        cwd: DEFAULT_CWD,
        activeProcesses: activeProcesses.size,
        activeSessions: opencodeSessions.size,
        rateLimitedUntil: rateLimitedUntil && Date.now() < Date.parse(rateLimitedUntil) ? rateLimitedUntil : null
      });
      return;
    }

    if (req.method === 'GET' && req.url.startsWith('/opencode/status')) {
      const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const sessionId = (requestUrl.searchParams.get('sessionId') || '').trim();
      if (!sessionId) {
        sendJson(res, 400, { ok: false, error: 'sessionId requerido' });
        return;
      }
      const active = activeProcesses.get(sessionId);
      if (active) {
        sendJson(res, 200, publicRunState(sessionId, active));
        return;
      }
      const completed = completedProcesses.get(sessionId);
      if (completed) {
        sendJson(res, 200, completed);
        return;
      }
      const stored = opencodeSessions.get(sessionId);
      sendJson(res, 200, {
        ok: true,
        sessionId,
        status: stored ? 'session_known' : 'not_found',
        alive: false,
        threadId: stored?.opencodeSessionId || null,
        updatedAt: stored?.updatedAt || null
      });
      return;
    }

    if (req.method === 'POST' && req.url === '/opencode') {
      const rawBody = await readBody(req);
      const payload = rawBody ? JSON.parse(rawBody) : {};

      if (!payload.message || typeof payload.message !== 'string') {
        sendJson(res, 400, { ok: false, error: 'message requerido' });
        return;
      }

      if (rateLimitedUntil && Date.now() < Date.parse(rateLimitedUntil)) {
        writeBridgeLog({
          event: 'opencode.rate_limit.short_circuit',
          sessionId: payload.sessionId || null,
          resetAt: rateLimitedUntil
        });
        sendJson(res, 200, { ok: false, status: 'rate_limited', resetAt: rateLimitedUntil });
        return;
      }

      writeBridgeLog({
        event: 'opencode.request',
        sessionId: payload.sessionId || null,
        cwd: payload.cwd || DEFAULT_CWD,
        command: payload.command || 'opencode',
        timeoutMs: Number(payload.timeoutMs || 120000),
        mode: payload.rememberSession !== false && payload.sessionId && opencodeSessions.has(payload.sessionId) ? 'resume' : 'new',
        opencodeSessionId: payload.rememberSession !== false && payload.sessionId && opencodeSessions.has(payload.sessionId)
          ? opencodeSessions.get(payload.sessionId).opencodeSessionId
          : null,
        rememberSession: payload.rememberSession !== false
      });

      const result = await runOpencode(payload);
      sendJson(res, 200, result);
      return;
    }

    if (req.method === 'POST' && req.url === '/stop') {
      const rawBody = await readBody(req);
      const payload = rawBody ? JSON.parse(rawBody) : {};
      const sessionId = typeof payload.sessionId === 'string' ? payload.sessionId.trim() : '';

      if (!sessionId) {
        sendJson(res, 400, { ok: false, error: 'sessionId requerido' });
        return;
      }

      const run = activeProcesses.get(sessionId);
      if (!run) {
        opencodeSessions.delete(sessionId);
        writeBridgeLog({
          event: 'opencode.stop.not_found',
          sessionId,
          activeProcesses: activeProcesses.size
        });
        sendJson(res, 404, { ok: false, error: 'proceso no encontrado' });
        return;
      }

      activeProcesses.delete(sessionId);
      opencodeSessions.delete(sessionId);
      run.proc.kill();
      writeBridgeLog({
        event: 'opencode.stop.cancelled',
        sessionId,
        pid: run.pid || null,
        activeProcesses: activeProcesses.size
      });
      sendJson(res, 200, { ok: true, sessionId, status: 'cancelled' });
      return;
    }

    sendJson(res, 404, { ok: false, error: 'not found' });
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    sendJson(res, 500, { ok: false, error });
  }
});

if (!isCliInstalled('opencode')) {
  console.error('[opencode-bridge] OpenCode CLI no encontrado por PATH (which opencode) -- no se levanta el servidor.');
  process.exit(1);
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[opencode-bridge] listening on http://localhost:${PORT}`);
  console.log(`[opencode-bridge] default cwd: ${DEFAULT_CWD}`);
});

// Mismo motivo que claude-bridge.js: el bridge corre en una ventana sin
// supervisor y sin captura de stdout/stderr propia — estos handlers dejan
// el stack trace en opencode-bridge.log antes de dejar morir al proceso.
process.on('uncaughtException', err => {
  writeBridgeLog({
    event: 'bridge.uncaughtException',
    error: err && err.message,
    stack: err && err.stack,
    activeProcesses: activeProcesses.size,
    completedProcesses: completedProcesses.size,
    activeSessions: opencodeSessions.size,
    rss: process.memoryUsage().rss,
    heapUsed: process.memoryUsage().heapUsed
  });
  process.exit(1);
});

process.on('unhandledRejection', reason => {
  const err = reason instanceof Error ? reason : new Error(String(reason));
  writeBridgeLog({
    event: 'bridge.unhandledRejection',
    error: err.message,
    stack: err.stack,
    activeProcesses: activeProcesses.size,
    completedProcesses: completedProcesses.size,
    activeSessions: opencodeSessions.size,
    rss: process.memoryUsage().rss,
    heapUsed: process.memoryUsage().heapUsed
  });
});

setInterval(() => {
  writeBridgeLog({
    event: 'bridge.memory_sample',
    activeProcesses: activeProcesses.size,
    completedProcesses: completedProcesses.size,
    activeSessions: opencodeSessions.size,
    rss: process.memoryUsage().rss,
    heapUsed: process.memoryUsage().heapUsed
  });
}, 15 * 60 * 1000).unref();
