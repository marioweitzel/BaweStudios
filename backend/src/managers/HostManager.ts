/**
 * HostManager — Gestor de la sesión activa del huésped.
 * 
 * Mantiene UNA sola sesión activa por ahora (MVP).
 * Delega toda la comunicación al adaptador configurado (FakeHostAdapter para ahora).
 * Emite eventos que escucha el SocketHandler para retransmitir al frontend.
 */

import { IHostAdapter } from '../adapters/IHostAdapter';
import { createAdapter } from '../adapters/HostAdapterFactory';
import { EventEmitter } from 'events';

export class HostManager extends EventEmitter {
  private adapter: IHostAdapter;
  private activeSessionId: string | null = null;

  constructor() {
    super();
    // El adaptador activo se selecciona via HOST_ADAPTER en .env.
    // Cambiar HOST_ADAPTER=fake → HOST_ADAPTER=codex sin tocar este archivo.
    this.adapter = createAdapter();

    // Escuchar eventos del adaptador y re-emitirlos
    this.adapter.onMessage((sessionId, message) => {
      this.emit('message', { sessionId, message });
    });

    this.adapter.onError((sessionId, error) => {
      this.emit('error', { sessionId, error });
    });

    this.adapter.onExit((sessionId, code) => {
      if (this.activeSessionId === sessionId) {
        this.activeSessionId = null;
      }
      this.emit('exit', { sessionId, code });
    });
  }

  /**
   * Inicia una nueva sesión
   * @param sessionId — ID único generado por quien llama (BaweStudio)
   */
  async start(sessionId: string): Promise<void> {
    if (this.activeSessionId && this.activeSessionId !== sessionId) {
      console.warn(`[HostManager] Ya hay una sesión activa: ${this.activeSessionId}. Deteniendo...`);
      await this.stop(this.activeSessionId);
    }

    console.log(`[HostManager] Iniciando sesión: ${sessionId}`);
    this.activeSessionId = sessionId;
    await this.adapter.start(sessionId);

    // Emitir el PID real para que el SocketHandler lo pase al debugPanel
    const pid = this.adapter.getPID(sessionId);
    console.log(`[HostManager] Sesión iniciada: ${sessionId} | PID: ${pid}`);
    this.emit('pid', { sessionId, pid });
  }

  /**
   * Envía un mensaje al huésped
   * @param sessionId — ID de la sesión
   * @param message — Texto del mensaje
   */
  async send(sessionId: string, message: string, options?: { markers?: { start: string; end: string } }): Promise<void> {
    if (!this.activeSessionId || this.activeSessionId !== sessionId) {
      throw new Error(`Session not active: ${sessionId}`);
    }
    await this.adapter.send(sessionId, message, options);
  }

  /**
   * Detiene una sesión
   * @param sessionId — ID de la sesión
   */
  async stop(sessionId: string): Promise<void> {
    if (this.activeSessionId === sessionId) {
      this.activeSessionId = null;
    }
    console.log(`[HostManager] Deteniendo sesión: ${sessionId}`);
    await this.adapter.stop(sessionId);
    console.log(`[HostManager] Sesión detenida: ${sessionId}`);
  }

  /**
   * Devuelve el ID de la sesión activa (o null si no hay)
   */
  getActiveSessionId(): string | null {
    return this.activeSessionId;
  }

  /**
   * Devuelve el PID del proceso activo, o null si no hay sesión
   */
  getPID(): number | null {
    if (!this.activeSessionId) return null;
    return this.adapter.getPID(this.activeSessionId);
  }
}
