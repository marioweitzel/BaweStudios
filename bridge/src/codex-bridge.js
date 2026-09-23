const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn, execFileSync } = require('child_process');
const { detectRateLimit } = require('./rateLimitDetect');

const PORT = Number(process.env.CODEX_BRIDGE_PORT || 5000);
// Variante Linux: se autoubica igual que BRIDGE_LOG_PATH unas lineas mas
// abajo, en vez de asumir una instalacion fija.
const DEFAULT_CWD = process.env.CODEX_CWD || path.join(__dirname, '..', '..', 'root', 'bawestudios');
const DEFAULT_ARGS = ['exec', '--json', '--skip-git-repo-check'];
const BRIDGE_LOG_PATH = path.join(__dirname, '..', '..', 'logs', 'codex-bridge.log');
const activeProcesses = new Map();
const codexSessions = new Map();
const completedProcesses = new Map();
// Ver claude-bridge.js: mismo mecanismo de corte corto, contrato HTTP identico
// ({ ok:false, status:'rate_limited', resetAt }) para que el backend no tenga
// que distinguir que adaptador esta activo.
//
// CAVEAT: el patron de deteccion en rateLimitDetect.js fue validado contra el
// formato de mensaje de Claude Code. El formato real que usa Codex para
// avisar su propio limite de uso (si lo hace con la misma redaccion "you've
// hit your ... limit ... resets X") todavia no se confirmo contra un caso
// real. Si Codex usa otra redaccion, esta deteccion no va a dispararse y el
// mensaje caera por el camino generico existente (contrato inesperado /
// error). Ajustar rateLimitDetect.js (o separar un patron propio para Codex)
// en cuanto se tenga un ejemplo real capturado.
let rateLimitedUntil = null;
// En Linux 'codex' resuelve por PATH sin problema con spawn/shell:false (no
// existe el shim .cmd que en Windows fuerza a invocar el .js via 'node'
// directo) -- el chequeo de instalacion tampoco puede depender de un path de
// npm hardcodeado (varia segun apt/NodeSource/nvm), asi que se usa `which`.
// BS (modo HOST_ADAPTER=auto) ya no le pregunta a host-detect.js que CLI esta
// instalado: pinguea /health de cada bridge directo. Por eso el chequeo de
// instalacion vive ACA -- si el CLI no esta, este bridge no debe abrir su
// puerto, para que /health simplemente no responda en vez de mentir "ok".
function isCliInstalled(command) {
  try {
    execFileSync('which', [command], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

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
    threadId: run.threadId || null,
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

function extractCodexOutput(stdout) {
  if (!stdout.trim()) return { text: null, threadId: null };

  const agentTexts = [];
  let threadId = null;
  for (const line of stdout.trim().split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    try {
      const event = JSON.parse(trimmed);

      if (event.type === 'thread.started' && event.thread_id) {
        threadId = event.thread_id;
      }

      if (event.type === 'item.completed' && event.item) {
        if (event.item.type === 'agent_message' && event.item.text) {
          agentTexts.push(event.item.text);
        }

        if (event.item.type === 'message' && Array.isArray(event.item.content)) {
          for (const part of event.item.content) {
            if (part.type === 'output_text' && part.text) agentTexts.push(part.text);
          }
        }
      }

      if (event.type === 'message' && event.role === 'assistant' && Array.isArray(event.content)) {
        for (const part of event.content) {
          if (part.type === 'output_text' && part.text) agentTexts.push(part.text);
        }
      }

      if (event.type === 'output_text' && event.text) {
        agentTexts.push(event.text);
      }
    } catch {
      if (
        trimmed.length > 0 &&
        !trimmed.startsWith('Reading') &&
        !trimmed.startsWith('[') &&
        !trimmed.startsWith('node')
      ) {
        agentTexts.push(trimmed);
      }
    }
  }

  const text = agentTexts.length > 0 ? agentTexts[agentTexts.length - 1].trim() : (stdout.trim() || null);
  return { text, threadId };
}

function buildCodexArgs(baseArgs, message, threadId) {
  const args = Array.isArray(baseArgs) && baseArgs.length > 0 ? baseArgs : DEFAULT_ARGS;
  const options = (args[0] === 'exec' ? args.slice(1) : args)
    .filter(arg => arg !== '--ephemeral');

  if (threadId) {
    return ['exec', 'resume', ...options, threadId, message];
  }

  return ['exec', ...options, message];
}

function runCodex({ sessionId, message, cwd, command, args, timeoutMs, rememberSession }) {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const startedAtIso = new Date(startedAt).toISOString();
    const workingDir = cwd || DEFAULT_CWD;
    const shouldRememberSession = rememberSession !== false;
    if (sessionId && !shouldRememberSession) {
      codexSessions.delete(sessionId);
    }
    const storedSession = sessionId && shouldRememberSession ? codexSessions.get(sessionId) : null;
    const codexThreadId = storedSession?.threadId || null;
    const executable = command || 'codex';
    const finalArgs = buildCodexArgs(args, message, codexThreadId);
    const effectiveTimeoutMs = Number(timeoutMs || 120000);

    if (!fs.existsSync(workingDir)) {
      const err = new Error(`cwd no existe en host: ${workingDir}`);
      writeBridgeLog({
        event: 'codex.error',
        sessionId: sessionId || null,
        error: err.message,
        durationMs: Date.now() - startedAt
      });
      reject(err);
      return;
    }

    writeBridgeLog({
      event: 'codex.spawn',
      sessionId: sessionId || null,
      executable,
      cwd: workingDir,
      pid: null,
      mode: codexThreadId ? 'resume' : 'new',
      codexThreadId: codexThreadId || null,
      rememberSession: shouldRememberSession
    });

    const proc = spawn(executable, finalArgs, {
      cwd: workingDir,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false
    });

    writeBridgeLog({
      event: 'codex.spawned',
      sessionId: sessionId || null,
      pid: proc.pid || null,
      executable,
      cwd: workingDir,
      mode: codexThreadId ? 'resume' : 'new',
      codexThreadId: codexThreadId || null,
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
      threadId: codexThreadId || null,
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
        event: 'codex.timeout.review',
        sessionId: sessionId || null,
        pid: proc.pid || null,
        message: `Codex sigue activo despues de ${effectiveTimeoutMs}ms; no se mata el proceso`,
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
          message: `Codex sigue activo despues de ${effectiveTimeoutMs}ms`,
          threadId: runState.threadId || null
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
        event: 'codex.error',
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
          event: 'codex.rate_limited',
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

      const { text, threadId } = extractCodexOutput(stdout);
      const effectiveThreadId = threadId || codexThreadId;
      runState.status = text && code === 0 ? 'completed' : 'failed';
      runState.code = code;
      runState.text = text || null;
      runState.threadId = effectiveThreadId || null;
      runState.stderr = stderr;
      runState.updatedAtIso = new Date().toISOString();
      if (sessionId && effectiveThreadId && code === 0 && shouldRememberSession) {
        codexSessions.set(sessionId, {
          threadId: effectiveThreadId,
          cwd: workingDir,
          updatedAt: new Date().toISOString(),
          lastPid: proc.pid || null
        });
      } else if (sessionId && !shouldRememberSession) {
        codexSessions.delete(sessionId);
      }
      if (sessionId) completedProcesses.set(sessionId, publicRunState(sessionId, runState));
      const durationMs = Date.now() - startedAt;
      writeBridgeLog({
        event: 'codex.exit',
        sessionId: sessionId || null,
        pid: proc.pid || null,
        code,
        durationMs,
        parsedText: Boolean(text),
        codexThreadId: effectiveThreadId || null,
        rememberSession: shouldRememberSession,
        stderr: truncateText(stderr, 1000)
      });

      if (!text) {
        const err = new Error(stderr.trim() || `Codex exit ${code} sin respuesta parseada`);
        writeBridgeLog({
          event: 'codex.error',
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
        threadId: effectiveThreadId || null,
        mode: codexThreadId ? 'resume' : 'new',
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
        service: 'codex-bridge',
        cwd: DEFAULT_CWD,
        activeProcesses: activeProcesses.size,
        activeSessions: codexSessions.size,
        rateLimitedUntil: rateLimitedUntil && Date.now() < Date.parse(rateLimitedUntil) ? rateLimitedUntil : null
      });
      return;
    }

    if (req.method === 'GET' && req.url.startsWith('/codex/status')) {
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
      const stored = codexSessions.get(sessionId);
      sendJson(res, 200, {
        ok: true,
        sessionId,
        status: stored ? 'session_known' : 'not_found',
        alive: false,
        threadId: stored?.threadId || null,
        updatedAt: stored?.updatedAt || null
      });
      return;
    }

    if (req.method === 'POST' && req.url === '/codex') {
      const rawBody = await readBody(req);
      const payload = rawBody ? JSON.parse(rawBody) : {};

      if (!payload.message || typeof payload.message !== 'string') {
        sendJson(res, 400, { ok: false, error: 'message requerido' });
        return;
      }

      if (rateLimitedUntil && Date.now() < Date.parse(rateLimitedUntil)) {
        writeBridgeLog({
          event: 'codex.rate_limit.short_circuit',
          sessionId: payload.sessionId || null,
          resetAt: rateLimitedUntil
        });
        sendJson(res, 200, { ok: false, status: 'rate_limited', resetAt: rateLimitedUntil });
        return;
      }

      writeBridgeLog({
        event: 'codex.request',
        sessionId: payload.sessionId || null,
        cwd: payload.cwd || DEFAULT_CWD,
        command: payload.command || 'codex',
        args: Array.isArray(payload.args) && payload.args.length > 0 ? payload.args : DEFAULT_ARGS,
        timeoutMs: Number(payload.timeoutMs || 120000),
        mode: payload.rememberSession !== false && payload.sessionId && codexSessions.has(payload.sessionId) ? 'resume' : 'new',
        codexThreadId: payload.rememberSession !== false && payload.sessionId && codexSessions.has(payload.sessionId)
          ? codexSessions.get(payload.sessionId).threadId
          : null,
        rememberSession: payload.rememberSession !== false
      });

      const result = await runCodex(payload);
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
        codexSessions.delete(sessionId);
        writeBridgeLog({
          event: 'codex.stop.not_found',
          sessionId,
          activeProcesses: activeProcesses.size
        });
        sendJson(res, 404, { ok: false, error: 'proceso no encontrado' });
        return;
      }

      activeProcesses.delete(sessionId);
      codexSessions.delete(sessionId);
      run.proc.kill();
      writeBridgeLog({
        event: 'codex.stop.cancelled',
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

if (!isCliInstalled('codex')) {
  console.error('[codex-bridge] Codex CLI no encontrado por PATH (which codex) -- no se levanta el servidor.');
  process.exit(1);
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[codex-bridge] listening on http://localhost:${PORT}`);
  console.log(`[codex-bridge] default cwd: ${DEFAULT_CWD}`);
});
