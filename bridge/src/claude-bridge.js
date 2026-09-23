// claude-bridge.js — Bridge HTTP para Claude Code, hermano paralelo de
// codex-bridge.js. NO modifica ni depende de codex-bridge.js: mismo contrato
// HTTP (health/status/stop) pero ejecuta el CLI de Claude Code en vez de Codex.
//
// Puerto por defecto: 5001 (ver tabla de puertos en host-detect.js).

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn, execFileSync } = require('child_process');
const { detectRateLimit } = require('./rateLimitDetect');

const PORT = Number(process.env.CLAUDE_BRIDGE_PORT || 5001);
// Variante Linux: sin instalacion fija, se autoubica igual que BRIDGE_LOG_PATH
// unas lineas mas abajo (mismo patron, ya validado en el codebase).
const DEFAULT_CWD = process.env.CLAUDE_CWD || path.join(__dirname, '..', '..', 'root', 'bawestudios');
const BRIDGE_LOG_PATH = path.join(__dirname, '..', '..', 'logs', 'claude-bridge.log');
// En Linux 'claude' resuelve por PATH sin problema con spawn/shell:false (no
// existe el shim .cmd que fuerza a Windows a resolver el binario por path
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
const claudeSessions = new Map();
const completedProcesses = new Map();
// ISO/UTC absoluto de cuando se levanta el limite de uso/sesion detectado la
// ultima vez, o null si no se detecto ninguno (o ya paso). Corta camino en
// /claude para no spawnear un proceso de Claude condenado a fallar mientras
// se sabe que se esta limitado.
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
    threadId: run.claudeSessionId || null,
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

function extractClaudeOutput(stdout) {
  const trimmed = stdout.trim();
  if (!trimmed) return { text: null, sessionId: null };

  try {
    const body = JSON.parse(trimmed);
    const text = typeof body.result === 'string' ? body.result
      : (typeof body.text === 'string' ? body.text : null);
    const sessionId = typeof body.session_id === 'string' ? body.session_id : null;
    return { text: text ? text.trim() : null, sessionId, isError: Boolean(body.is_error) };
  } catch {
    // Claude Code no devolvio JSON valido (--output-format json). Usar texto crudo.
    return { text: trimmed, sessionId: null, isError: false };
  }
}

function buildClaudeArgs(message, claudeSessionId) {
  // --dangerously-skip-permissions: el bridge lanza Claude con stdin
  // cerrado (stdio: ['ignore', ...]), asi que no hay forma de aprobar un
  // prompt de permisos interactivo. Sin este flag, cualquier accion que
  // toque el filesystem (crear el workspace, escribir archivos del
  // proyecto) devuelve "necesito tu permiso" en vez de ejecutar. Codex ya
  // corre full-auto por default en su modo exec; esto iguala el
  // comportamiento para Claude. Alcance: solo estas invocaciones del
  // bridge, no toca settings.json ni la config personal del operador.
  //
  // --disallowed-tools Agent: saca la herramienta de sub-agentes del
  // contexto de Claude. Sin esto, Claude puede delegar trabajo a un
  // sub-agente en segundo plano dentro de esta misma llamada -p (un solo
  // disparo, sin proceso vivo despues); si el sub-agente no termina antes
  // del wait ceiling interno de Claude Code (10 min por defecto), lo mata a
  // la fuerza y el texto final ("lo delegue, aviso cuando termine") no
  // matchea ningun contrato reconocido -> el job de background queda
  // marcado failed sin haber hecho el trabajo real. Con la herramienta
  // deshabilitada, Claude hace el trabajo el mismo, de forma sincrona,
  // dentro del timeout del bridge (600000ms) en vez del wait ceiling propio
  // de Claude Code. Ademas alinea con la regla ya existente del motor
  // (autonomous-product-development/SKILL.md, "Prohibited Behavior": "Do
  // not delegate development outside the single LLM vertical development
  // flow.") -- esto la hace cumplir tecnicamente en vez de depender de que
  // el modelo la respete solo.
  const args = ['-p', message, '--output-format', 'json', '--dangerously-skip-permissions', '--disallowed-tools', 'Agent'];
  if (claudeSessionId) {
    args.push('--resume', claudeSessionId);
  }
  return args;
}

function runClaude({ sessionId, message, cwd, command, timeoutMs, rememberSession }) {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const startedAtIso = new Date(startedAt).toISOString();
    const workingDir = cwd || DEFAULT_CWD;
    const shouldRememberSession = rememberSession !== false;
    if (sessionId && !shouldRememberSession) {
      claudeSessions.delete(sessionId);
    }
    const storedSession = sessionId && shouldRememberSession ? claudeSessions.get(sessionId) : null;
    const claudeSessionId = storedSession?.claudeSessionId || null;
    const executable = command || 'claude';
    const finalArgs = buildClaudeArgs(message, claudeSessionId);
    const effectiveTimeoutMs = Number(timeoutMs || 120000);

    if (!fs.existsSync(workingDir)) {
      const err = new Error(`cwd no existe en host: ${workingDir}`);
      writeBridgeLog({
        event: 'claude.error',
        sessionId: sessionId || null,
        error: err.message,
        durationMs: Date.now() - startedAt
      });
      reject(err);
      return;
    }

    writeBridgeLog({
      event: 'claude.spawn',
      sessionId: sessionId || null,
      executable,
      cwd: workingDir,
      pid: null,
      mode: claudeSessionId ? 'resume' : 'new',
      claudeSessionId: claudeSessionId || null,
      rememberSession: shouldRememberSession
    });

    const proc = spawn(executable, finalArgs, {
      cwd: workingDir,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false
    });

    writeBridgeLog({
      event: 'claude.spawned',
      sessionId: sessionId || null,
      pid: proc.pid || null,
      executable,
      cwd: workingDir,
      mode: claudeSessionId ? 'resume' : 'new',
      claudeSessionId: claudeSessionId || null,
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
      claudeSessionId: claudeSessionId || null,
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
        event: 'claude.timeout.review',
        sessionId: sessionId || null,
        pid: proc.pid || null,
        message: `Claude sigue activo despues de ${effectiveTimeoutMs}ms; no se mata el proceso`,
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
          message: `Claude sigue activo despues de ${effectiveTimeoutMs}ms`,
          threadId: runState.claudeSessionId || null
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
        event: 'claude.error',
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
          event: 'claude.rate_limited',
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

      const { text, sessionId: outputSessionId, isError } = extractClaudeOutput(stdout);
      const effectiveClaudeSessionId = outputSessionId || claudeSessionId;
      runState.status = text && code === 0 && !isError ? 'completed' : 'failed';
      runState.code = code;
      runState.text = text || null;
      runState.claudeSessionId = effectiveClaudeSessionId || null;
      runState.stderr = stderr;
      runState.updatedAtIso = new Date().toISOString();
      if (sessionId && effectiveClaudeSessionId && code === 0 && shouldRememberSession) {
        claudeSessions.set(sessionId, {
          claudeSessionId: effectiveClaudeSessionId,
          cwd: workingDir,
          updatedAt: new Date().toISOString(),
          lastPid: proc.pid || null
        });
      } else if (sessionId && !shouldRememberSession) {
        claudeSessions.delete(sessionId);
      }
      if (sessionId) completedProcesses.set(sessionId, publicRunState(sessionId, runState));
      const durationMs = Date.now() - startedAt;
      writeBridgeLog({
        event: 'claude.exit',
        sessionId: sessionId || null,
        pid: proc.pid || null,
        code,
        durationMs,
        parsedText: Boolean(text),
        claudeSessionId: effectiveClaudeSessionId || null,
        rememberSession: shouldRememberSession,
        stderr: truncateText(stderr, 1000)
      });

      if (!text || isError) {
        const err = new Error(stderr.trim() || `Claude exit ${code} sin respuesta parseada`);
        writeBridgeLog({
          event: 'claude.error',
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
          threadId: effectiveClaudeSessionId || null,
          mode: claudeSessionId ? 'resume' : 'new',
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
        service: 'claude-bridge',
        cwd: DEFAULT_CWD,
        activeProcesses: activeProcesses.size,
        activeSessions: claudeSessions.size,
        rateLimitedUntil: rateLimitedUntil && Date.now() < Date.parse(rateLimitedUntil) ? rateLimitedUntil : null
      });
      return;
    }

    if (req.method === 'GET' && req.url.startsWith('/claude/status')) {
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
      const stored = claudeSessions.get(sessionId);
      sendJson(res, 200, {
        ok: true,
        sessionId,
        status: stored ? 'session_known' : 'not_found',
        alive: false,
        threadId: stored?.claudeSessionId || null,
        updatedAt: stored?.updatedAt || null
      });
      return;
    }

    if (req.method === 'POST' && req.url === '/claude') {
      const rawBody = await readBody(req);
      const payload = rawBody ? JSON.parse(rawBody) : {};

      if (!payload.message || typeof payload.message !== 'string') {
        sendJson(res, 400, { ok: false, error: 'message requerido' });
        return;
      }

      if (rateLimitedUntil && Date.now() < Date.parse(rateLimitedUntil)) {
        writeBridgeLog({
          event: 'claude.rate_limit.short_circuit',
          sessionId: payload.sessionId || null,
          resetAt: rateLimitedUntil
        });
        sendJson(res, 200, { ok: false, status: 'rate_limited', resetAt: rateLimitedUntil });
        return;
      }

      writeBridgeLog({
        event: 'claude.request',
        sessionId: payload.sessionId || null,
        cwd: payload.cwd || DEFAULT_CWD,
        command: payload.command || 'claude',
        timeoutMs: Number(payload.timeoutMs || 120000),
        mode: payload.rememberSession !== false && payload.sessionId && claudeSessions.has(payload.sessionId) ? 'resume' : 'new',
        claudeSessionId: payload.rememberSession !== false && payload.sessionId && claudeSessions.has(payload.sessionId)
          ? claudeSessions.get(payload.sessionId).claudeSessionId
          : null,
        rememberSession: payload.rememberSession !== false
      });

      const result = await runClaude(payload);
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
        claudeSessions.delete(sessionId);
        writeBridgeLog({
          event: 'claude.stop.not_found',
          sessionId,
          activeProcesses: activeProcesses.size
        });
        sendJson(res, 404, { ok: false, error: 'proceso no encontrado' });
        return;
      }

      activeProcesses.delete(sessionId);
      claudeSessions.delete(sessionId);
      run.proc.kill();
      writeBridgeLog({
        event: 'claude.stop.cancelled',
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

if (!isCliInstalled('claude')) {
  console.error('[claude-bridge] Claude Code CLI no encontrado por PATH (which claude) -- no se levanta el servidor.');
  process.exit(1);
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[claude-bridge] listening on http://localhost:${PORT}`);
  console.log(`[claude-bridge] default cwd: ${DEFAULT_CWD}`);
});

// El bridge corre sin supervisor y sin captura de stdout/stderr propia -- si
// el proceso moria por una excepcion no manejada, el motivo se perdia. Estos
// dos handlers dejan el stack trace en claude-bridge.log (via writeBridgeLog,
// que ya usa appendFileSync) antes de dejar morir al proceso, para poder
// auditar la proxima caida en vez de tener que inferirla.
process.on('uncaughtException', err => {
  writeBridgeLog({
    event: 'bridge.uncaughtException',
    error: err && err.message,
    stack: err && err.stack,
    activeProcesses: activeProcesses.size,
    completedProcesses: completedProcesses.size,
    activeSessions: claudeSessions.size,
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
    activeSessions: claudeSessions.size,
    rss: process.memoryUsage().rss,
    heapUsed: process.memoryUsage().heapUsed
  });
});

// Muestra de memoria cada 15 min — sin esto, si el proceso muere sin pasar por
// uncaughtException (ej: lo mata el SO por falta de memoria, o se cierra la
// ventana), no queda ningun rastro de como venia creciendo la memoria antes de
// la caida. Con esto al menos queda una linea de tiempo hasta el ultimo tick
// antes de que se corte el log.
setInterval(() => {
  writeBridgeLog({
    event: 'bridge.memory_sample',
    activeProcesses: activeProcesses.size,
    completedProcesses: completedProcesses.size,
    activeSessions: claudeSessions.size,
    rss: process.memoryUsage().rss,
    heapUsed: process.memoryUsage().heapUsed
  });
}, 15 * 60 * 1000).unref();
