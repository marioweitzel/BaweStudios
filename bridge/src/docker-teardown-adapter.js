// docker-teardown-adapter.js — Servicio HTTP standalone en el host que baja
// (docker compose down) los contenedores de un proyecto entregado, cuando
// BaweStudio pide "eliminar". Existe porque el backend de BaweStudio corre
// dentro de Docker y no tiene ni el CLI de Docker ni el socket para hacerlo
// el mismo (ver backend/src/services/projectDeletionService.ts). No hace
// nada por su cuenta: solo actua cuando recibe la peticion HTTP puntual, y
// valida que la ruta que le llega caiga adentro de root/bawestudios antes de
// tocar Docker -- mismo espiritu que el scope de [PROJECT_ROOT] del skill
// "eliminar" del motor.
//
// Puerto: 5011.

const http = require('http');
const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

const PORT = Number(process.env.DOCKER_TEARDOWN_PORT || 5011);
const PROJECTS_ROOT = process.env.DOCKER_TEARDOWN_PROJECTS_ROOT
  || path.join(__dirname, '..', '..', 'root', 'bawestudios');
const RESOLVED_PROJECTS_ROOT = fs.realpathSync(PROJECTS_ROOT);

// docker-compose-preview.yml reemplaza a docker-compose-local.yml cuando el
// proyecto corre en topologia remote-hosted -- se prueba primero.
// docker-compose.yml queda como ultimo fallback para instalaciones viejas.
const COMPOSE_FILE_CANDIDATES = ['docker-compose-preview.yml', 'docker-compose-local.yml', 'docker-compose.yml'];

function findComposeFile(projectPath) {
  for (const name of COMPOSE_FILE_CANDIDATES) {
    if (fs.existsSync(path.join(projectPath, name))) return name;
  }
  return null;
}

async function listComposeContainerIds(projectPath, composeFile) {
  const { stdout } = await execFileAsync('docker', ['compose', '-f', composeFile, 'ps', '-q'], { cwd: projectPath });
  return stdout.split('\n').map(line => line.trim()).filter(Boolean);
}

function isInsideProjectsRoot(candidatePath) {
  const rel = path.relative(RESOLVED_PROJECTS_ROOT, path.resolve(candidatePath));
  return rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel);
}

async function teardown(projectPath) {
  if (!isInsideProjectsRoot(projectPath)) {
    return { ok: false, error: `projectPath fuera de ${RESOLVED_PROJECTS_ROOT}, rechazado` };
  }
  if (!fs.existsSync(projectPath)) {
    return { ok: false, error: `projectPath no existe en este host: ${projectPath}` };
  }
  const composeFile = findComposeFile(projectPath);
  if (!composeFile) {
    return { ok: true, skipped: true, reason: 'no_compose_file' };
  }
  await execFileAsync('docker', ['compose', '-f', composeFile, 'down'], { cwd: projectPath });
  const stillRunning = await listComposeContainerIds(projectPath, composeFile);
  if (stillRunning.length > 0) {
    return {
      ok: false,
      error: `Quedaron ${stillRunning.length} contenedor(es) corriendo tras 'docker compose down' (${composeFile}).`,
      composeFile,
      remaining: stillRunning
    };
  }
  return { ok: true, composeFile };
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, { 'content-type': 'application/json', 'content-length': Buffer.byteLength(body) });
  res.end(body);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => { raw += chunk; });
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}); } catch (err) { reject(err); }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    sendJson(res, 200, { status: 'ok', service: 'docker-teardown-adapter' });
    return;
  }

  if (req.method === 'POST' && req.url === '/teardown') {
    try {
      const body = await readJsonBody(req);
      const projectPath = body && body.projectPath;
      if (!projectPath || typeof projectPath !== 'string') {
        sendJson(res, 400, { ok: false, error: 'falta "projectPath" en el body' });
        return;
      }
      const result = await teardown(projectPath);
      sendJson(res, result.ok ? 200 : 422, result);
    } catch (err) {
      sendJson(res, 500, { ok: false, error: err instanceof Error ? err.message : String(err) });
    }
    return;
  }

  sendJson(res, 404, { ok: false, error: 'not found' });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[docker-teardown-adapter] listening on http://localhost:${PORT}`);
  console.log(`[docker-teardown-adapter] projects root: ${RESOLVED_PROJECTS_ROOT}`);
});
