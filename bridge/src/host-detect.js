// host-detect.js — Servicio HTTP standalone que informa qué CLIs de huésped
// están instalados en este host y en qué puerto vive su bridge.
// No modifica ni depende de codex-bridge.js. Corre en su propio puerto.
//
// Tabla de puertos (única fuente de verdad de esta capa):
//   5000  codex-bridge
//   5001  claude-bridge
//   5002  (reservado)
//   5003  gemini-bridge   (futuro, no implementado)
//   5004  otro-bridge     (futuro, no implementado)
//   5010  host-detect     (este proceso)

const http = require('http');
const { execFileSync } = require('child_process');

const PORT = Number(process.env.HOST_DETECT_PORT || 5010);

// Nombre canonico del runtime (key de este mapa) vs HOST_ADAPTER en el
// backend: son capas distintas. HostRuntimeDetector.ts en el backend es
// quien traduce HOST_ADAPTER="claude-code" -> runtimes["claude"].
//
// Variante Linux: 'command' resuelve por PATH sin problema con
// execFileSync/shell:false (no existe el shim .cmd/.exe que en Windows
// obliga a resolver el binario real por path fijo dentro de node_modules) --
// tanto la deteccion de instalado como la version se calculan corriendo el
// propio comando, sin asumir donde npm dejo los archivos.
const RUNTIME_DEFS = {
  codex: { command: 'codex', bridgeUrl: 'http://host.docker.internal:5000/codex' },
  claude: { command: 'claude', bridgeUrl: 'http://host.docker.internal:5001/claude' }
};

// Cache en memoria: la version de un CLI no cambia mientras este proceso
// esta vivo, asi que se ejecuta --version una sola vez por runtime.
const versionCache = new Map();

function runVersionCommand(command) {
  try {
    const output = execFileSync(command, ['--version'], { timeout: 5000, encoding: 'utf8', shell: false });
    return output.trim() || null;
  } catch {
    return null;
  }
}

function getVersion(name, command) {
  if (versionCache.has(name)) return versionCache.get(name);
  const version = runVersionCommand(command);
  versionCache.set(name, version);
  return version;
}

function detectRuntimes() {
  const runtimes = {};
  for (const [name, def] of Object.entries(RUNTIME_DEFS)) {
    const version = getVersion(name, def.command);
    runtimes[name] = {
      installed: version !== null,
      command: def.command,
      version,
      bridgeUrl: def.bridgeUrl
    };
  }
  return runtimes;
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'content-type': 'application/json',
    'content-length': Buffer.byteLength(body)
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    sendJson(res, 200, { status: 'ok', service: 'host-detect' });
    return;
  }

  if (req.method === 'GET' && req.url === '/detect') {
    sendJson(res, 200, {
      ok: true,
      checkedAt: new Date().toISOString(),
      host: { platform: process.platform, arch: process.arch },
      runtimes: detectRuntimes()
    });
    return;
  }

  sendJson(res, 404, { ok: false, error: 'not found' });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[host-detect] listening on http://localhost:${PORT}`);
});
