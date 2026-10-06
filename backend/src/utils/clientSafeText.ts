// Lo unico que el cliente debe recibir del LLM es la pregunta con sus opciones,
// el aviso generico o el contrato "Intento de hack" (que BS convierte en un
// modal). Nada interno de BaweStudio llega al frontend: ni nombres de archivo,
// ni codigos de pregunta, ni el modo del entorno. Acordado con Motor 6/10/2026.

export const HACK_ATTEMPT_TEXT = 'Intento de hack';

// Texto unico compartido con el motor: se pide disculpas y que reintente, sin
// nombrar el problema.
export const CLIENT_GENERIC_NOTICE = 'Disculpá, tuvimos un inconveniente. Por favor, intentá de nuevo en unos minutos.';

function normalizeLine(text: string) {
  return text
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^[¡¿"'`*_]+/, '')
    .replace(/[.!?"'`*_]+$/, '')
    .toLocaleLowerCase('es');
}

// El contrato cuenta si la ULTIMA linea es exactamente la frase; cualquier
// texto anterior se descarta (igual criterio que isInvalidCommandResponse).
export function isHackAttemptResponse(text: string | null | undefined) {
  const raw = String(text || '').trim();
  if (!raw) return false;
  const lastLine = raw.split(/\r?\n/).map(line => line.trim()).filter(Boolean).pop() || '';
  return normalizeLine(lastLine) === normalizeLine(HACK_ATTEMPT_TEXT);
}

export function isGenericNoticeResponse(text: string | null | undefined) {
  return normalizeLine(String(text || '')) === normalizeLine(CLIENT_GENERIC_NOTICE);
}

// Patrones conservadores: solo cosas que un cliente no tecnico nunca deberia
// leer. Evitan palabras comunes que pueden aparecer en un producto real
// ("workspace", "motor", "A4").
const INTERNAL_PATTERNS: RegExp[] = [
  /\b[\w.-]+\.(?:md|json|jsonl|toml|ya?ml)\b/i,
  /(?:^|[\s`'"(\/\\])\.(?:agents|bawe)(?:[\/\\]|\b)/i,
  /\b(?:log-preguntas|task-log|project-context|component-queue|skill-dispatcher|app-structure)\b/i,
  /\[\[\/?BAWE_[A-Z_]*\]\]/,
  /\bBaWe\b/,
  /\bread-only\b/i,
  /\b(?:entorno|modo)\b[^.\n]{0,40}\b(?:sandbox|lectura|escritura)\b/i,
  /\b(?:pregunta|respuesta|paso|etapa|fase)\s+(?:v[aá]lida\s+)?(?:de\s+)?[AB]\d{1,2}[a-z]?(?:-\d+)?\b/i,
  /\b[AB]_[A-Z]{2,}\b/,
  /\bpersist(?:ir|o|í)\s+(?:la\s+)?(?:respuesta|A\d)/i
];

export function containsInternalDetails(text: string | null | undefined) {
  const value = String(text || '');
  return INTERNAL_PATTERNS.some(pattern => pattern.test(value));
}
