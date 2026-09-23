/**
 * IHostAdapter — Contrato que todo adaptador de huésped debe cumplir.
 * 
 * Define la interfaz que permite al backend comunicarse con cualquier proceso externo
 * (fake-host.js, Claude Code, Codex, Ollama, etc.) sin necesidad de modificar
 * el backend ni el frontend.
 * 
 * La comunicación es siempre mediante JSON estructurado por línea.
 */

export interface IHostAdapter {
  /**
   * start(sessionId) — Inicia el proceso huésped.
   * 
   * @param sessionId — Identificador de sesión único, generado por BaweStudio.
   *                   El proceso NUNCA genera el sessionId — solo lo recibe y usa.
   * @throws si el proceso no puede lanzarse
   */
  start(sessionId: string): Promise<void>;

  /**
   * send(sessionId, message, options) — Envía un mensaje al proceso huésped via stdin.
   *
   * @param sessionId — ID de la sesión activa
   * @param message — Texto a enviar al proceso (será serializado a JSON)
   * @param options — options.markers: par {start,end} de marcadores fijos que
   *   la skill activa usa para envolver su respuesta real al cliente (ej. los
   *   de soporte o los de cambios); el adaptador debe extraer solo ese
   *   contenido y tratar su ausencia como error, nunca mostrar el texto
   *   crudo. No afecta sesiones normales (options ausente u omitido). El
   *   mensaje emitido via onMessage lleva ademas `editQueueReady:true` si el
   *   texto crudo (fuera de los marcadores) contenia la señal
   *   [[BAWE_CAMBIOS_COLA_LISTA]], o `extensionQueueReady:true` si contenia
   *   [[BAWE_CAMBIOS_EXTENSION_LISTA]] — ambas irrelevantes fuera del flujo
   *   de cambios.
   * @throws si la sesión no existe o el proceso está muerto
   */
  send(sessionId: string, message: string, options?: { markers?: { start: string; end: string } }): Promise<void>;

  /**
   * stop(sessionId) — Termina el proceso huésped.
   * 
   * @param sessionId — ID de la sesión a terminar
   */
  stop(sessionId: string): Promise<void>;

  /**
   * onMessage(callback) — Registra un callback para mensajes del proceso.
   * 
   * Cada vez que el proceso emite un mensaje JSON en stdout, se dispara
   * este callback con el objeto parseado.
   * 
   * @param callback — función (sessionId, mensaje) => void
   */
  onMessage(callback: (sessionId: string, message: any) => void): void;

  /**
   * onError(callback) — Registra un callback para errores del proceso.
   * 
   * @param callback — función (sessionId, error) => void
   */
  onError(callback: (sessionId: string, error: Error) => void): void;

  /**
   * onExit(callback) — Registra un callback cuando el proceso termina.
   * 
   * @param callback — función (sessionId, code) => void
   */
  onExit(callback: (sessionId: string, code: number) => void): void;

  /**
   * getPID(sessionId) - Devuelve el PID real del proceso lanzado, o null si no existe.
   */
  getPID(sessionId: string): number | null;
}
