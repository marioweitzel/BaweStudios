// bridge-auth.js -- chequeo del secreto compartido entre BaweStudio (backend) y
// los procesos host-side (bridges, host-detect, docker-teardown-adapter).
//
// Estos procesos escuchan en 0.0.0.0 (hace falta para que el backend, dentro de
// Docker, llegue por host.docker.internal), asi que cualquier equipo con
// acceso a la red podria pegarles. El backend manda
//   Authorization: Bearer <BRIDGE_SHARED_SECRET>
// y aca se rechaza con 401 todo lo que no lo traiga. GET /health queda abierto
// (lo usa el selector de CLI y no expone nada sensible).
//
// El secreto se toma de process.env o, si falta, del .env de la raiz del repo,
// para no tener que tocar los scripts de arranque de cada bridge.
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Lee una variable de process.env o, si falta, del .env de la raiz del repo.
function readEnvVar(name) {
  if (process.env[name]) return String(process.env[name]).trim();
  try {
    const raw = fs.readFileSync(path.join(__dirname, '..', '..', '.env'), 'utf8');
    const match = raw.match(new RegExp('^\\s*' + name + '\\s*=\\s*(.*)$', 'm'));
    return match ? match[1].trim().replace(/^["']|["']$/g, '') : '';
  } catch {
    return '';
  }
}

const SECRET = readEnvVar('BRIDGE_SHARED_SECRET');

if (!SECRET) {
  console.error('[bridge-auth] BRIDGE_SHARED_SECRET no esta definido: se rechazaran con 401 todos los pedidos salvo GET /health.');
}

function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(a).digest();
  const hb = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

// Devuelve true si el pedido puede seguir. Si no, ya respondio 401.
function requireAuth(req, res) {
  if (req.method === 'GET' && (req.url === '/health' || req.url.startsWith('/health?'))) return true;
  const header = String(req.headers.authorization || '');
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (SECRET && token && safeEqual(token, SECRET)) return true;
  const body = JSON.stringify({ ok: false, error: 'unauthorized' });
  res.writeHead(401, { 'content-type': 'application/json', 'content-length': Buffer.byteLength(body) });
  res.end(body);
  return false;
}

module.exports = { requireAuth, readEnvVar };
