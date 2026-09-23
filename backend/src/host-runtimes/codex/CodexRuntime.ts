import fs from 'fs';
import path from 'path';
import {
  HostRuntime,
  HostRuntimeCommandResult,
  HostRuntimeDeleteResult,
  HostRuntimeOptions,
  HostRuntimeProject,
  HostRuntimeRateLimitedError,
  HostRuntimeStatus,
  HostRuntimeStillRunningError
} from '../HostRuntime';

type CodexBridgeConfig = {
  bridgeUrl?: string;
  cwd?: string;
};

export class CodexRuntime implements HostRuntime {
  readonly hostKind = 'codex';
  readonly pollIntervalMs: number;
  private readonly projectsRoot: string;
  private readonly bridgeUrl: string;
  private readonly cwd: string | null;

  constructor(options: HostRuntimeOptions) {
    this.projectsRoot = options.projectsRoot;
    this.pollIntervalMs = Number(options.pollIntervalMs || process.env.HOST_BACKGROUND_POLL_INTERVAL_MS || process.env.CODEX_BRIDGE_POLL_INTERVAL_MS || 30000);
    this.bridgeUrl = process.env.HOST_BRIDGE_URL || process.env.CODEX_BRIDGE_URL || this.readHostConfig().bridgeUrl || 'http://host.docker.internal:5000/codex';
    this.cwd = this.resolveHostCwd();
  }

  async getStatus(sessionId: string): Promise<HostRuntimeStatus | null> {
    if (!sessionId) return null;
    try {
      const res = await fetch(`${this.bridgeBaseUrl()}/codex/status?sessionId=${encodeURIComponent(sessionId)}`);
      const bodyText = await res.text();
      if (!res.ok) return null;
      return this.normalizeStatus(JSON.parse(bodyText));
    } catch {
      return null;
    }
  }

  isStatusActive(status: HostRuntimeStatus | null | undefined) {
    return Boolean(status && status.alive && (status.status === 'running' || status.status === 'running_timeout'));
  }

  async sendCommand(project: HostRuntimeProject, sessionId: string, message: string, timeoutMs = 600000): Promise<HostRuntimeCommandResult> {
    const res = await fetch(this.bridgeUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        message,
        ...(this.cwd ? { cwd: this.cwd } : {}),
        timeoutMs,
        rememberSession: false
      })
    });
    const bodyText = await res.text();
    if (!res.ok) throw new Error(`Bridge HTTP ${res.status}: ${bodyText.slice(0, 300)}`);

    let body: { text?: string; response?: string; status?: string; timedOut?: boolean; resetAt?: string | null };
    try {
      body = JSON.parse(bodyText) as { text?: string; response?: string; status?: string; timedOut?: boolean; resetAt?: string | null };
    } catch {
      return { text: bodyText.trim(), rawBody: bodyText, statusCode: res.status };
    }
    if (body.status === 'rate_limited') {
      throw new HostRuntimeRateLimitedError('Host alcanzo el limite de uso/sesion', body.resetAt || null);
    }
    if (body.status === 'running' || body.timedOut) {
      throw new HostRuntimeStillRunningError('Host sigue activo en bridge', this.normalizeStatus(body));
    }
    return { text: (body.text || body.response || '').trim(), rawBody: bodyText, statusCode: res.status };
  }

  async deleteProject(project: HostRuntimeProject, sessionId: string, workspaceUserId: string, projectName: string, timeoutMs = 600000): Promise<HostRuntimeDeleteResult> {
    const message = `eliminar ${workspaceUserId} ${projectName}`;
    const res = await fetch(this.bridgeUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        message,
        ...(this.cwd ? { cwd: this.cwd } : {}),
        timeoutMs,
        rememberSession: false
      })
    });
    const bodyText = await res.text();
    if (!res.ok) throw new Error(`Bridge HTTP ${res.status}: ${bodyText.slice(0, 300)}`);
    return { bodyText, statusCode: res.status };
  }

  private normalizeStatus(raw: any): HostRuntimeStatus {
    return {
      ok: raw?.ok,
      hostKind: this.hostKind,
      adapter: this.hostKind,
      sessionId: raw?.sessionId,
      status: raw?.status,
      alive: raw?.alive,
      timedOut: raw?.timedOut,
      pid: raw?.pid ?? null,
      nativeSessionId: raw?.codexSessionId ?? null,
      nativeThreadId: raw?.threadId ?? null,
      threadId: raw?.threadId ?? null,
      text: raw?.text ?? null,
      error: raw?.error,
      primaryEvidenceType: raw?.rolloutPath ? 'codex_rollout' : null,
      primaryEvidencePath: raw?.rolloutPath || null,
      raw
    };
  }

  // Variante Linux: cuando el bridge corre host-side y no hay un cwd
  // explicito (env var o hosts/codex.json), no se manda ningun override --
  // se devuelve null y codex-bridge.js se autoubica solo con su propio
  // __dirname (ver DEFAULT_CWD ahi). Mandar un path calculado desde adentro
  // del contenedor (ej. projectsRoot, que es un mount interno tipo
  // /workspace/bawestudios) no serviria: el bridge corre fuera de Docker y
  // ese path no existe en el filesystem del host.
  private resolveHostCwd(): string | null {
    const configuredCwd = process.env.HOST_CWD || process.env.CODEX_CWD;
    const hostConfigCwd = this.readHostConfig().cwd;

    if (configuredCwd && fs.existsSync(path.resolve(configuredCwd))) {
      return path.resolve(configuredCwd);
    }

    if (this.isHostSideBridgeUrl(this.bridgeUrl)) {
      if (hostConfigCwd && configuredCwd && configuredCwd !== hostConfigCwd) {
        console.warn(`[CODEX RUNTIME] cwd configurado no es valido para bridge host-side: ${configuredCwd}. Usando ${hostConfigCwd}`);
      }
      return hostConfigCwd || null;
    }

    const candidates = [configuredCwd, this.projectsRoot]
      .filter((value): value is string => Boolean(value && value.trim()));
    for (const candidate of candidates) {
      const resolved = path.resolve(candidate);
      if (fs.existsSync(resolved)) return resolved;
    }
    return this.projectsRoot;
  }

  private bridgeBaseUrl() {
    const url = new URL(this.bridgeUrl);
    url.pathname = url.pathname.replace(/\/codex\/?$/, '');
    url.search = '';
    url.hash = '';
    return url.toString().replace(/\/$/, '');
  }

  private isHostSideBridgeUrl(value: string) {
    try {
      const hostname = new URL(value).hostname.toLowerCase();
      return hostname === 'host.docker.internal' || hostname === 'localhost' || hostname === '127.0.0.1';
    } catch {
      return false;
    }
  }

  private readHostConfig(): CodexBridgeConfig {
    try {
      const configPath = path.join(__dirname, '..', '..', '..', 'hosts', 'codex.json');
      if (!fs.existsSync(configPath)) return {};
      return JSON.parse(fs.readFileSync(configPath, 'utf-8')) as CodexBridgeConfig;
    } catch (err) {
      console.warn(`[CODEX RUNTIME] No se pudo leer backend/hosts/codex.json: ${err instanceof Error ? err.message : String(err)}`);
      return {};
    }
  }
}
