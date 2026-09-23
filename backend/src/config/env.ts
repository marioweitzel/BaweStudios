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
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    name: process.env.DB_NAME || 'bawestudio',
    user: process.env.DB_USER || 'bawestudio',
    pass: readSecretOrEnv('DB_PASS')
  },
  hostBackgroundMaxAttempts: Number(process.env.HOST_BACKGROUND_MAX_ATTEMPTS || process.env.CODEX_BACKGROUND_MAX_ATTEMPTS || 80)
};

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
