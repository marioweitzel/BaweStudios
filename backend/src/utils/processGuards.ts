// Un rechazo sin capturar en cualquier handler (por ejemplo un corte de conexion
// con MySQL en un evento de socket) mataba el proceso entero: se caian todos los
// usuarios conectados y el chat afectado quedaba esperando para siempre. Se
// registra el error y el backend sigue en pie.
export function installProcessGuards() {
  process.on('unhandledRejection', (reason) => {
    const detail = reason instanceof Error ? (reason.stack || reason.message) : String(reason);
    console.error('[PROCESS] unhandledRejection (se ignora, el backend sigue):', detail);
  });
  process.on('uncaughtException', (err) => {
    console.error('[PROCESS] uncaughtException (se ignora, el backend sigue):', err && err.stack ? err.stack : err);
  });
}
