export function clientSafeHostError(error: Error | string): string {
  const message = error instanceof Error ? error.message : String(error);
  if (
    /fetch failed|ECONNREFUSED|Bridge HTTP|timeout|codex|bridge|socket|pid|cwd/i.test(message)
  ) {
    return 'No pudimos conectar en este momento. Intenta nuevamente en unos segundos.';
  }
  return message.slice(0, 300);
}
