import fs from 'fs';
import path from 'path';
import { env } from './env';

// Topologia del despliegue de BaweStudio -- le dice al motor si "localhost" en
// un preview tiene sentido (misma maquina) o si hace falta una URL publica
// real (server remoto con clientes conectandose desde afuera). Contrato
// definido del lado del motor en
// root/bawestudios/.agents/contracts/runtime-environment-contract.md
// ("Runtime Context"); este archivo solo escribe el JSON que ese contrato lee.
//
// BAWE_TOPOLOGY/BAWE_PUBLIC_BASE_URL son manuales por ahora (seteadas a mano
// en .env) -- el plan es que un futuro instalador las complete solo, via una
// pregunta al usuario mas una verificacion automatica de respaldo (ver
// docs/instalador-vm-diseno-linux.md). El sistema operativo no se persiste
// aca a proposito: el motor ya lo detecta en vivo (process.platform/uname),
// persistirlo se desactualizaria sin necesidad.
const RUNTIME_CONTEXT_PATH = path.join(env.projectsRoot, '.bawe-runtime', 'runtime-context.json');

export function writeRuntimeContext(): void {
  const topology = process.env.BAWE_TOPOLOGY === 'remote-hosted' ? 'remote-hosted' : 'local';
  const publicBaseUrl = process.env.BAWE_PUBLIC_BASE_URL || '';

  try {
    fs.mkdirSync(path.dirname(RUNTIME_CONTEXT_PATH), { recursive: true });
    fs.writeFileSync(
      RUNTIME_CONTEXT_PATH,
      JSON.stringify({ topology, public_base_url: publicBaseUrl }, null, 2),
      'utf-8'
    );
    console.log(`[RUNTIME CONTEXT] topology=${topology} public_base_url=${publicBaseUrl || '(vacio)'}`);
  } catch (err) {
    console.error(`[RUNTIME CONTEXT] no se pudo escribir ${RUNTIME_CONTEXT_PATH}: ${(err as Error).message}`);
  }
}
