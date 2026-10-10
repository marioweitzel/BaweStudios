import { CLIENT_GENERIC_NOTICE, containsInternalDetails } from './clientSafeText';

export function clientSafeHostError(error: Error | string): string {
  const message = error instanceof Error ? error.message : String(error);
  if (
    /fetch failed|ECONNREFUSED|Bridge HTTP|timeout|codex|bridge|socket|pid|cwd/i.test(message)
  ) {
    return 'No pudimos conectar en este momento. Intenta nuevamente en unos segundos.';
  }
  // Un error del LLM con datos internos (archivos, codigos de pregunta) no llega al cliente.
  if (containsInternalDetails(message)) return CLIENT_GENERIC_NOTICE;
  return message.slice(0, 300);
}
