import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Cargar .env desde la raiz del proyecto.
dotenv.config({ path: path.join(__dirname, '..', '..', '..', '.env') });

// Docker/Swarm secrets se montan como archivo (ej. /run/secrets/db_password),
// no como variable de entorno directa -- por convencion, <VAR>_FILE apunta al
// archivo. Si esta seteada, gana sobre <VAR> (que puede no existir en ese caso).
function readSecretOrEnv(varName: string, fallback = ''): string {
  const filePath = process.env[`${varName}_FILE`];
  if (filePath) {
    try {
      return fs.readFileSync(filePath, 'utf-8').trim();
    } catch (err) {
      throw new Error(`[ENV] no se pudo leer el secret de ${varName} en ${filePath}: ${(err as Error).message}`);
    }
  }
  return process.env[varName] || fallback;
}

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error('JWT_SECRET environment variable is required to start BaweStudio backend.');
}

export const env = {
  port: process.env.BACKEND_PORT || 3000,
  jwtSecret,
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:10040',
  projectsRoot: process.env.BAWE_PROJECTS_ROOT || path.join(__dirname, '..', '..', '..', 'root', 'bawestudios'),
  // Ruta de root/bawestudios vista desde EL HOST (fuera de Docker), no desde
  // adentro del contenedor del backend -- el backend no tiene ni el CLI de
  // Docker ni el socket para bajar contenedores el mismo (ver
  // projectDeletionService.ts), asi que le delega esa parte a
  // docker-teardown-adapter.js, un proceso host-side (mismo molde que los
  // bridges) al que solo le puede pasar rutas que existen de verdad en SU
  // filesystem, no el de adentro del contenedor.
  dockerTeardown: {
    url: process.env.DOCKER_TEARDOWN_URL || 'http://host.docker.internal:5011/teardown',
    hostProjectsRoot: process.env.BAWE_HOST_PROJECTS_ROOT || ''
  },
  // Aviso por correo "tu proyecto/edicion finalizo" (solo VPS). Postfix corre
  // en el host, fuera de Docker (mismo molde que los bridges). Sin
  // BAWE_APP_URL no se manda. Es distinta de BAWE_PUBLIC_BASE_URL a proposito:
  // esa la lee el motor para armar previews (en la VPS es http://<ip>), y el
  // cliente necesita la direccion HTTPS real de la aplicacion.
  mail: {
    host: process.env.SMTP_HOST || 'host.docker.internal',
    port: Number(process.env.SMTP_PORT || 25),
    fromName: process.env.MAIL_FROM_NAME || 'BaweStudio',
    fromAddress: process.env.MAIL_FROM_ADDRESS || 'no-reply@bawestudio.com.ar',
    appUrl: (process.env.BAWE_APP_URL || '').trim()
  },
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    name: process.env.DB_NAME || 'bawestudio',
    user: process.env.DB_USER || 'bawestudio',
    pass: readSecretOrEnv('DB_PASS')
  },
  hostBackgroundMaxAttempts: Number(process.env.HOST_BACKGROUND_MAX_ATTEMPTS || process.env.CODEX_BACKGROUND_MAX_ATTEMPTS || 80)
};

// Secreto compartido con los bridges y el adaptador de teardown (procesos
// host-side que escuchan en 0.0.0.0). Cada uno rechaza con 401 todo pedido que
// no traiga este valor en "Authorization: Bearer <secreto>" (excepto /health).
export function bridgeHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const secret = process.env.BRIDGE_SHARED_SECRET || '';
  return secret ? { ...extra, authorization: `Bearer ${secret}` } : { ...extra };
}

export const PARTIAL_CONTRACT_TEXT = 'Parcial completado. Espero "continuar" para proseguir.';
export const FINAL_CONTRACT_TEXT = 'Finalizado.';
export const INVALID_COMMAND_TEXT = 'Comando inv\u00e1lido';
export const RESUME_CONTINUE_NOTICE = 'Escribi "continuar" para seguir este proyecto.';
export const INTERVIEW_COMPLETE_NOTICE = 'Listo! Ya tenemos la informacion necesaria para comenzar a crear tu proyecto. Cuando este terminado, te avisaremos y te daremos un enlace para descargarlo y otro para verlo funcionando. Gracias por tu paciencia.';
export const DELIVERY_WARNING = 'Este archivo contiene la estructura y el codigo original del proyecto. No compartas la contrasena con personas no autorizadas.';

// Mensaje generico para cualquier falla tecnica del huesped (bridge caido,
// respuesta sin texto parseable, respuesta sin el contrato de marcadores
// esperado, excepcion no controlada) que deba mostrarse en el chat. Nunca
// debe llegar al cliente el texto interno real (nombres de adaptador, HTTP,
// nombres de contrato) — eso solo queda logueado server-side.
export const GENERIC_HOST_ERROR_MESSAGE = 'Por favor, reinicia la pagina e intenta nuevamente. Desde ya te pedimos disculpas por el inconveniente.';

// Marcadores que envuelven el texto real para el cliente en respuestas
// client-facing del motor (soporte, cambios); todo lo que el modelo narre
// fuera de estos marcadores se descarta, nunca se muestra "por las dudas".
export const SUPPORT_RESPONSE_START = '[[BAWE_SOPORTE_RESPUESTA_INICIO]]';
export const SUPPORT_RESPONSE_END = '[[BAWE_SOPORTE_RESPUESTA_FIN]]';
export const EDIT_RESPONSE_START = '[[BAWE_CAMBIOS_RESPUESTA_INICIO]]';
export const EDIT_RESPONSE_END = '[[BAWE_CAMBIOS_RESPUESTA_FIN]]';

// Se\u00f1al fuera de banda (fuera de los marcadores de arriba) que edit-intake
// emite cuando escribio .bawe/edit-queue.json: le indica a BaweStudio que
// dispare un "cambios" de seguimiento por su cuenta, sin esperar al cliente.
export const EDIT_QUEUE_READY_SIGNAL = '[[BAWE_CAMBIOS_COLA_LISTA]]';

// Equivalente a EDIT_QUEUE_READY_SIGNAL para la rama Extensión: edit-intake la
// emite al hacer el hand-off a extension-context-detector, en vez de
// encadenarlo en el mismo turno interactivo (que bloqueaba el socket sin
// reintento/backoff). Dispara el mismo runEditJob en background que ya usa
// Ajuste, vía startEditJob.
export const EXTENSION_QUEUE_READY_SIGNAL = '[[BAWE_CAMBIOS_EXTENSION_LISTA]]';

// Marcadores de edit-product-development/extension-product-development (no
// client-facing). A diferencia de EDIT_RESPONSE_START/END, estos no delimitan
// un bloque de texto para extraer \u2014 el skill puede escribir libremente un
// resumen alrededor; BaweStudio solo busca el marcador en cualquier parte del
// texto crudo (.includes()), nunca compara el texto completo. Reemplaza el
// primer intento (comparacion exacta contra una frase fija), que fallaba en
// cuanto el modelo envolvia la frase en una oracion o markdown. Deliberadamente
// distintos de PARTIAL_CONTRACT_TEXT/FINAL_CONTRACT_TEXT del pipeline original:
// BaweStudio necesita distinguir las dos cadenas, y el comando de reanudacion
// es distinto ("cambios" aca, "continuar" en el pipeline original).
export const EDIT_PARTIAL_MARKER = '[[BAWE_CAMBIOS_EDICION_PARCIAL]]';
export const EDIT_FINISHED_MARKER = '[[BAWE_CAMBIOS_EDICION_FINALIZADA]]';

// Bloque fuera de banda que el motor emite despues de una pregunta con
// opciones dinamicas (acordado con Motor 24/9/2026), para que el frontend
// pueda ofrecerlas como clickeables ademas del texto libre de siempre. Nunca
// se muestra al cliente tal cual -- se extrae y se descarta del texto humano.
export const OPTIONS_BLOCK_START = '[[BAWE_OPCIONES]]';
export const OPTIONS_BLOCK_END = '[[/BAWE_OPCIONES]]';
