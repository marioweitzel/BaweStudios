/**
 * HostManager — Gestor de la sesión activa del huésped.
 * 
 * Mantiene UNA sola sesión activa por ahora (MVP).
 * Delega toda la comunicación al adaptador configurado (FakeHostAdapter para ahora).
 * Emite eventos que escucha el SocketHandler para retransmitir al frontend.
 */

import { IHostAdapter, HostSendOptions } from '../adapters/IHostAdapter';
import { createAdapter } from '../adapters/HostAdapterFactory';
import { EventEmitter } from 'events';

// Nombres validos para forzar un adapter puntual por sesion (selector de CLI
// del sidebar) -- no incluye 'auto'/'fake': esos siguen siendo solo el
// comportamiento por defecto de HOST_ADAPTER, nunca algo que un proyecto
// pida explicitamente.
const SELECTABLE_ADAPTERS = new Set(['claude-code', 'codex', 'opencode']);

export class HostManager extends EventEmitter {
  private adapter: IHostAdapter;
  private activeSessionId: string | null = null;
  private activeAdapterName: string | null = null;

  constructor() {
    super();
    // El adaptador activo por defecto se selecciona via HOST_ADAPTER en .env.
    // Cambiar HOST_ADAPTER=fake → HOST_ADAPTER=codex sin tocar este archivo.
    this.adapter = createAdapter();
    this.wireAdapterEvents(this.adapter);
  }

  private wireAdapterEvents(adapter: IHostAdapter) {
    adapter.onMessage((sessionId, message) => {
      this.emit('message', { sessionId, message });
    });

    adapter.onError((sessionId, error) => {
      this.emit('error', { sessionId, error });
    });

    adapter.onExit((sessionId, code) => {
      if (this.activeSessionId === sessionId) {
        this.activeSessionId = null;
      }
      this.emit('exit', { sessionId, code });
    });
  }

  /**
   * Inicia una nueva sesión.
   * @param sessionId — ID único generado por quien llama (BaweStudio)
   * @param adapterPreference — CLI elegida por el usuario para este proyecto
   *   (selector del sidebar), ej. "claude-code"/"codex"/"opencode". Si falta
   *   o no es un nombre valido, se usa el adapter por defecto (HOST_ADAPTER)
   *   sin tocar nada — mismo comportamiento de siempre.
   */
  async start(sessionId: string, adapterPreference?: string | null): Promise<void> {
    if (this.activeSessionId && this.activeSessionId !== sessionId) {
      console.warn(`[HostManager] Ya hay una sesión activa: ${this.activeSessionId}. Deteniendo...`);
      await this.stop(this.activeSessionId);
    }

    const wantsExplicitAdapter = !!adapterPreference && SELECTABLE_ADAPTERS.has(adapterPreference);
    if (wantsExplicitAdapter && adapterPreference !== this.activeAdapterName) {
      // Proyecto con CLI elegida explicitamente -- fuerza ese adapter para
      // esta sesion.
      console.log(`[HostManager] Adapter solicitado para esta sesion: ${adapterPreference}`);
      this.adapter = createAdapter(adapterPreference as string);
      this.wireAdapterEvents(this.adapter);
      this.activeAdapterName = adapterPreference as string;
    } else if (!wantsExplicitAdapter && this.activeAdapterName) {
      // Sesion sin preferencia explicita, pero la anterior habia forzado un
      // adapter puntual -- volver al default (HOST_ADAPTER) en vez de
      // arrastrar la eleccion de un proyecto distinto.
      console.log(`[HostManager] Sin CLI explicita para esta sesion, volviendo al adapter por defecto`);
      this.adapter = createAdapter();
      this.wireAdapterEvents(this.adapter);
      this.activeAdapterName = null;
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
  async send(sessionId: string, message: string, options?: HostSendOptions): Promise<void> {
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
