/**
 * FakeHostAdapter — Implementación de IHostAdapter que lanza fake-host.js
 * 
 * Esta clase:
 * 1. Spawna el proceso fake-host.js
 * 2. Escucha los mensajes JSON en stdout
 * 3. Escribe mensajes en stdin
 * 4. Emite eventos cuando llegan mensajes, errores, o el proceso termina
 */

import { IHostAdapter } from './IHostAdapter';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';

export class FakeHostAdapter implements IHostAdapter {
  private processes: Map<string, ChildProcess> = new Map();
  private messageCallbacks: ((sessionId: string, message: any) => void)[] = [];
  private errorCallbacks: ((sessionId: string, error: Error) => void)[] = [];
  private exitCallbacks: ((sessionId: string, code: number) => void)[] = [];

  async start(sessionId: string): Promise<void> {
    // Si ya hay un proceso para esta sesión, terminar antes
    if (this.processes.has(sessionId)) {
      await this.stop(sessionId);
    }

    // Ruta del script fake-host.js
    const hostScript = path.join(__dirname, '..', '..', 'processes', 'fake-host.js');

    // Spawn el proceso
    const proc = spawn('node', [hostScript], {
      stdio: ['pipe', 'pipe', 'pipe'],
      detached: false,
    });

    this.processes.set(sessionId, proc);

    console.log(`[ADAPTER] proceso lanzado — pid: ${proc.pid}`);

    // Resolver externo para el Promise de startup — permite que el data handler
    // llame a resolve() directamente cuando recibe 'ready', evitando la condición
    // de carrera donde el 'return' bloqueaba la llamada a messageCallbacks.
    let readyResolver: (() => void) | null = null;
    let readyRejecter: ((err: Error) => void) | null = null;

    const startupPromise = new Promise<void>((resolve, reject) => {
      readyResolver = resolve;
      readyRejecter = reject;
    });

    // Leer stdout del proceso (JSON line-delimited)
    proc.stdout?.on('data', (data: Buffer) => {
      const lines = data.toString().trim().split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const message = JSON.parse(line);
          console.log(`[ADAPTER → BACKEND] raw: ${line}`);

          // 'ready' llega sin sessionId — enviar init y resolver el Promise de startup.
          // NOTA: usamos readyResolver() aquí en lugar de pasar el mensaje a messageCallbacks,
          // porque el ready NO es un mensaje de sesión — es la señal de arranque del proceso.
          if (message.type === 'ready' && !message.sessionId) {
            console.log(`[BACKEND → ADAPTER] enviando init: {"type":"init","sessionId":"${sessionId}"}`);
            proc.stdin?.write(JSON.stringify({ type: 'init', sessionId }) + '\n');
            // Resolver el Promise de startup
            if (readyResolver) {
              readyResolver();
              readyResolver = null;
              readyRejecter = null;
            }
            continue; // siguiente línea, no emitir a callbacks
          }

          // El resto de mensajes sí tienen sessionId y se emiten
          this.messageCallbacks.forEach(cb => cb(sessionId, message));
        } catch (err) {
          console.error(`[ADAPTER] Error parsing JSON: ${line}`);
          this.errorCallbacks.forEach(cb => cb(sessionId, new Error(`Invalid JSON from process: ${line}`)));
        }
      }
    });

    // Leer stderr del proceso
    proc.stderr?.on('data', (data: Buffer) => {
      const error = new Error(`Process error: ${data.toString()}`);
      console.error(`[ADAPTER] stderr: ${data}`);
      this.errorCallbacks.forEach(cb => cb(sessionId, error));
    });

    // Cuando el proceso termina
    proc.on('exit', (code: number | null) => {
      console.log(`[ADAPTER] proceso terminó — code: ${code}`);
      this.processes.delete(sessionId);
      this.exitCallbacks.forEach(cb => cb(sessionId, code || 0));
    });

    // Cuando hay un error al spawnar
    proc.on('error', (err: Error) => {
      console.error(`[ADAPTER] Error spawning process: ${err.message}`);
      // También rechazar el Promise de startup si el proceso no pudo iniciar
      if (readyRejecter) {
        readyRejecter(err);
        readyResolver = null;
        readyRejecter = null;
      }
      this.errorCallbacks.forEach(cb => cb(sessionId, err));
    });

    // Timeout de arranque — si el proceso no emite 'ready' en 5 segundos, rechazar.
    const timeout = setTimeout(() => {
      if (readyRejecter) {
        readyRejecter(new Error('Adapter startup timeout: el proceso no emitio ready en 5s'));
        readyResolver = null;
        readyRejecter = null;
      }
    }, 5000);

    // Limpiar el timeout si el proceso resuelve antes
    startupPromise.then(() => clearTimeout(timeout)).catch(() => clearTimeout(timeout));

    return startupPromise;
  }

  async send(sessionId: string, message: string): Promise<void> {
    const proc = this.processes.get(sessionId);
    if (!proc) {
      throw new Error(`No process for session ${sessionId}`);
    }

    const json = { type: 'message', text: message };
    const jsonStr = JSON.stringify(json);
    console.log(`[BACKEND → ADAPTER] enviando mensaje: ${jsonStr}`);
    
    proc.stdin?.write(jsonStr + '\n');
  }

  async stop(sessionId: string): Promise<void> {
    const proc = this.processes.get(sessionId);
    if (!proc) return;

    proc.kill();
    this.processes.delete(sessionId);
  }

  onMessage(callback: (sessionId: string, message: any) => void): void {
    this.messageCallbacks.push(callback);
  }

  onError(callback: (sessionId: string, error: Error) => void): void {
    this.errorCallbacks.push(callback);
  }

  onExit(callback: (sessionId: string, code: number) => void): void {
    this.exitCallbacks.push(callback);
  }

  getPID(sessionId: string): number | null {
    const proc = this.processes.get(sessionId);
    return proc?.pid ?? null;
  }
}
