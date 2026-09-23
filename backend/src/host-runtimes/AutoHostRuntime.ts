/**
 * AutoHostRuntime — Wrapper de HostRuntime que resuelve de forma perezosa,
 * en la primera llamada, cual runtime concreto usar (Codex o Claude)
 * consultando host-detect.js. No modifica CodexRuntime ni ClaudeRuntime:
 * los instancia y delega.
 */

import {
  HostRuntime,
  HostRuntimeCommandResult,
  HostRuntimeDeleteResult,
  HostRuntimeOptions,
  HostRuntimeProject,
  HostRuntimeStatus
} from './HostRuntime';
import { CodexRuntime } from './codex/CodexRuntime';
import { ClaudeRuntime } from './claude/ClaudeRuntime';
import { DEFAULT_ADAPTER_HEALTH_URLS, resolveHealthyAdapter, parseAdapterPreference } from './HostRuntimeDetector';

const DEFAULT_PREFERENCE = ['claude-code', 'codex'];
const DEFAULT_FALLBACK = 'codex';

function buildDelegate(name: string, options: HostRuntimeOptions): HostRuntime {
  switch (name) {
    case 'claude-code':
      return new ClaudeRuntime(options);
    case 'codex':
    default:
      return new CodexRuntime(options);
  }
}

export class AutoHostRuntime implements HostRuntime {
  readonly hostKind = 'auto';
  readonly pollIntervalMs: number;
  private readonly options: HostRuntimeOptions;
  private delegate: HostRuntime | null = null;
  private resolving: Promise<HostRuntime> | null = null;

  constructor(options: HostRuntimeOptions) {
    this.options = options;
    this.pollIntervalMs = Number(options.pollIntervalMs || process.env.HOST_BACKGROUND_POLL_INTERVAL_MS || 30000);
  }

  private resolveDelegate(): Promise<HostRuntime> {
    if (this.delegate) return Promise.resolve(this.delegate);
    if (!this.resolving) {
      this.resolving = (async () => {
        const timeoutMs = Number(process.env.HOST_DETECT_TIMEOUT_MS || 2000);
        const fallback = process.env.HOST_ADAPTER_FALLBACK || DEFAULT_FALLBACK;
        const preference = parseAdapterPreference(process.env.HOST_ADAPTER_PREFERENCE, DEFAULT_PREFERENCE);

        const resolvedName = await resolveHealthyAdapter(preference, DEFAULT_ADAPTER_HEALTH_URLS, fallback, timeoutMs);

        console.log(`[AUTO HOST RUNTIME] preference=[${preference.join(',')}] fallback=${fallback} seleccionado=${resolvedName}`);

        this.delegate = buildDelegate(resolvedName, this.options);
        return this.delegate;
      })();
    }
    return this.resolving;
  }

  async getStatus(sessionId: string): Promise<HostRuntimeStatus | null> {
    const delegate = await this.resolveDelegate();
    return delegate.getStatus(sessionId);
  }

  isStatusActive(status: HostRuntimeStatus | null | undefined): boolean {
    if (this.delegate) return this.delegate.isStatusActive(status);
    return Boolean(status && status.alive && (status.status === 'running' || status.status === 'running_timeout'));
  }

  async sendCommand(project: HostRuntimeProject, sessionId: string, message: string, timeoutMs?: number): Promise<HostRuntimeCommandResult> {
    const delegate = await this.resolveDelegate();
    return delegate.sendCommand(project, sessionId, message, timeoutMs);
  }

  async deleteProject(project: HostRuntimeProject, sessionId: string, workspaceUserId: string, projectName: string, timeoutMs?: number): Promise<HostRuntimeDeleteResult> {
    const delegate = await this.resolveDelegate();
    return delegate.deleteProject(project, sessionId, workspaceUserId, projectName, timeoutMs);
  }
}
