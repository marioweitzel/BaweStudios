import {
  EDIT_FINISHED_MARKER,
  EDIT_PARTIAL_MARKER,
  EDIT_QUEUE_READY_SIGNAL,
  EDIT_RESPONSE_END,
  EDIT_RESPONSE_START,
  EXTENSION_QUEUE_READY_SIGNAL,
  FINAL_CONTRACT_TEXT,
  INVALID_COMMAND_TEXT,
  PARTIAL_CONTRACT_TEXT,
  SUPPORT_RESPONSE_END,
  SUPPORT_RESPONSE_START
} from '../config/env';

export function normalizeContractText(text: string) {
  return text.trim().replace(/\s+/g, ' ');
}

export function isPartialContract(text: string | null | undefined) {
  return normalizeContractText(String(text || '')).endsWith(PARTIAL_CONTRACT_TEXT);
}

export function isFinalContract(text: string | null | undefined) {
  return normalizeContractText(String(text || '')).endsWith(FINAL_CONTRACT_TEXT);
}

export function isInvalidCommandResponse(text: string | null | undefined) {
  return normalizeContractText(String(text || '')).toLocaleLowerCase('es') === INVALID_COMMAND_TEXT.toLocaleLowerCase('es');
}

function stripCodeFence(text: string) {
  const match = text.trim().match(/^```[a-zA-Z]*\n([\s\S]*?)\n?```$/);
  return match ? match[1] : text;
}

export function isDeleteSuccessContract(text: string) {
  return normalizeContractText(stripCodeFence(String(text || ''))).toLowerCase() === 'eliminado.';
}

/**
 * Extrae del texto crudo del LLM solo el contenido entre un par de marcadores
 * fijos que una skill client-facing usa para envolver su respuesta real.
 * Todo lo que el modelo narre fuera de esos marcadores (ej. "Ya tengo el
 * contexto del proyecto entregado...") queda descartado en vez de mostrado.
 * Si los marcadores faltan o están mal formados, devuelve null — el llamador
 * debe tratarlo como error, nunca mostrar el texto crudo como fallback.
 */
export function extractMarkedResponse(text: string | null | undefined, startMarker: string, endMarker: string): string | null {
  const raw = String(text || '');
  const startIdx = raw.indexOf(startMarker);
  const endIdx = raw.indexOf(endMarker);
  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) return null;
  const inner = raw.slice(startIdx + startMarker.length, endIdx).trim();
  return inner || null;
}

export function extractSupportResponse(text: string | null | undefined): string | null {
  return extractMarkedResponse(text, SUPPORT_RESPONSE_START, SUPPORT_RESPONSE_END);
}

export function extractEditResponse(text: string | null | undefined): string | null {
  return extractMarkedResponse(text, EDIT_RESPONSE_START, EDIT_RESPONSE_END);
}

// Señal fuera de banda de edit-intake (fuera de los marcadores de respuesta):
// indica que .bawe/edit-queue.json tiene trabajo esperando y hay que disparar
// un "cambios" de seguimiento sin esperar al cliente. Se busca sobre el texto
// crudo completo, no sobre el contenido ya extraído entre marcadores.
export function hasEditQueueReadySignal(text: string | null | undefined) {
  return String(text || '').includes(EDIT_QUEUE_READY_SIGNAL);
}

// Misma señal fuera de banda que hasEditQueueReadySignal, para la rama
// Extensión. Ver EXTENSION_QUEUE_READY_SIGNAL en config/env.ts.
export function hasExtensionQueueReadySignal(text: string | null | undefined) {
  return String(text || '').includes(EXTENSION_QUEUE_READY_SIGNAL);
}

// edit-product-development/extension-product-development no son client-facing
// y pueden escribir libremente un resumen de lo hecho — el resultado se
// detecta buscando el marcador exacto en cualquier parte del texto crudo
// (nunca comparando el texto completo, que rompía en cuanto el modelo
// envolvía la frase en una oración o en markdown). "...PARCIAL" = todavia hay
// items PENDING, hace falta otro "cambios" para seguir. "...FINALIZADA" =
// terminado de verdad, avisar al cliente, no hace falta llamar de nuevo.
export function isEditPartialContract(text: string | null | undefined) {
  return String(text || '').includes(EDIT_PARTIAL_MARKER);
}

export function isEditFinishedContract(text: string | null | undefined) {
  return String(text || '').includes(EDIT_FINISHED_MARKER);
}
