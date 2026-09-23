/**
 * AutoHostAdapter — Wrapper de IHostAdapter que resuelve de forma perezosa,
 * en el primer start()/send(), cual adapter concreto usar (Codex o Claude)
 * consultando host-detect.js. No modifica CodexHostAdapter ni ClaudeHostAdapter:
 * los instancia y delega.
 *
 * La resolucion es perezosa (no en el constructor) para no requerir tocar
 * index.ts, que hoy instancia todo de forma sincrona.
 */

import { IHostAdapter } from './IHostAdapter';
import { CodexHostAdapter } from './CodexHostAdapter';
import { ClaudeHostAdapter } from './ClaudeHostAdapter';
import { DEFAULT_ADAPTER_HEALTH_URLS, resolveHealthyAdapter, parseAdapterPreference } from '../host-runtimes/HostRuntimeDetector';

const DEFAULT_PREFERENCE = ['claude-code', 'codex'];
const DEFAULT_FALLBACK = 'codex';

function buildDelegate(name: string): IHostAdapter {
  switch (name) {
    case 'claude-code':
      return new ClaudeHostAdapter();
    case 'codex':
    default:
      return new CodexHostAdapter();
  }
}

export class AutoHostAdapter implements IHostAdapter {
  private delegate: IHostAdapter | null = null;
  private resolving: Promise<IHostAdapter> | null = null;
  private readonly messageCallbacks: ((sessionId: string, message: any) => void)[] = [];
  private readonly errorCallbacks: ((sessionId: string, error: Error) => void)[] = [];
  private readonly exitCallbacks: ((sessionId: string, code: number) => void)[] = [];

  private resolveDelegate(): Promise<IHostAdapter> {
    if (this.delegate) return Promise.resolve(this.delegate);
    if (!this.resolving) {
      this.resolving = (async () => {
        const timeoutMs = Number(process.env.HOST_DETECT_TIMEOUT_MS || 2000);
        const fallback = process.env.HOST_ADAPTER_FALLBACK || DEFAULT_FALLBACK;
        const preference = parseAdapterPreference(process.env.HOST_ADAPTER_PREFERENCE, DEFAULT_PREFERENCE);

        const resolvedName = await resolveHealthyAdapter(preference, DEFAULT_ADAPTER_HEALTH_URLS, fallback, timeoutMs);

        console.log(`[AUTO HOST ADAPTER] preference=[${preference.join(',')}] fallback=${fallback} seleccionado=${resolvedName}`);

        const delegate = buildDelegate(resolvedName);
        delegate.onMessage((sessionId, message) => this.messageCallbacks.forEach(cb => cb(sessionId, message)));
        delegate.onError((sessionId, error) => this.errorCallbacks.forEach(cb => cb(sessionId, error)));
        delegate.onExit((sessionId, code) => this.exitCallbacks.forEach(cb => cb(sessionId, code)));

        this.delegate = delegate;
        return delegate;
      })();
    }
    return this.resolving;
  }

  async start(sessionId: string): Promise<void> {
    const delegate = await this.resolveDelegate();
    await delegate.start(sessionId);
  }

  async send(sessionId: string, message: string, options?: { markers?: { start: string; end: string } }): Promise<void> {
    const delegate = await this.resolveDelegate();
    await delegate.send(sessionId, message, options);
  }

  async stop(sessionId: string): Promise<void> {
    const delegate = await this.resolveDelegate();
    await delegate.stop(sessionId);
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
    return this.delegate ? this.delegate.getPID(sessionId) : null;
  }
}
