import {
  EDIT_FINISHED_MARKER,
  EDIT_PARTIAL_MARKER,
  EDIT_QUEUE_READY_SIGNAL,
  EDIT_RESPONSE_END,
  EDIT_RESPONSE_START,
  EXTENSION_QUEUE_READY_SIGNAL,
  FINAL_CONTRACT_TEXT,
  INVALID_COMMAND_TEXT,
  OPTIONS_BLOCK_END,
  OPTIONS_BLOCK_START,
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

// Una respuesta corta cuya ULTIMA linea es exactamente el texto de comando
// invalido tambien cuenta: el modelo a veces antepone una frase explicativa
// (que puede nombrar reglas internas). Sin esto esa frase llegaria al cliente
// como pregunta del asistente. El tope de largo evita descartar respuestas
// largas con contenido real que casualmente terminen igual.
const INVALID_COMMAND_MAX_CHARS = 300;

export function isInvalidCommandResponse(text: string | null | undefined) {
  const invalid = INVALID_COMMAND_TEXT.toLocaleLowerCase('es');
  const raw = String(text || '').trim();
  if (normalizeContractText(raw).toLocaleLowerCase('es') === invalid) return true;
  if (raw.length > INVALID_COMMAND_MAX_CHARS) return false;
  const lastLine = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).pop() || '';
  return normalizeContractText(lastLine).toLocaleLowerCase('es') === invalid;
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

export type ParsedChatOptions = { multiple: boolean; items: string[]; exits: string[]; hasOtra: boolean };

/**
 * Extrae el bloque [[BAWE_OPCIONES]]...[[/BAWE_OPCIONES]] (formato acordado
 * con Motor 24/9/2026) de una respuesta del host, si lo trae. Nunca lanza:
 * si el bloque falta, esta mal formado o no tiene items numerados, devuelve
 * options:null y cleanText es el texto original sin tocar -- el chat sigue
 * funcionando como texto plano de siempre, la UI de opciones es un extra.
 */
export function extractChatOptions(text: string | null | undefined): { cleanText: string; options: ParsedChatOptions | null } {
  const raw = String(text || '');
  const startIdx = raw.indexOf(OPTIONS_BLOCK_START);
  const endIdx = raw.indexOf(OPTIONS_BLOCK_END);
  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
    return { cleanText: raw.trim(), options: null };
  }

  const inner = raw.slice(startIdx + OPTIONS_BLOCK_START.length, endIdx);
  const cleanText = (raw.slice(0, startIdx) + raw.slice(endIdx + OPTIONS_BLOCK_END.length)).trim();

  let multiple = false;
  const items: string[] = [];
  const exits: string[] = [];
  let hasOtra = false;
  for (const rawLine of inner.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const multipleMatch = line.match(/^multiple:\s*(true|false)/i);
    if (multipleMatch) {
      multiple = multipleMatch[1].toLowerCase() === 'true';
      continue;
    }
    // salida: X -> opcion de salida (sin numero), excluyente con todo lo demas.
    const exitMatch = line.match(/^salida:s*(.+)/i);
    if (exitMatch) {
      exits.push(exitMatch[1].trim());
      continue;
    }
    const itemMatch = line.match(/^\d+\.\s*(.+)/);
    if (itemMatch) {
      items.push(itemMatch[1].trim());
      continue;
    }
    if (/^otra$/i.test(line)) {
      hasOtra = true;
    }
  }

  if (!items.length && !exits.length) return { cleanText, options: null };
  return { cleanText, options: { multiple, items, exits, hasOtra } };
}
