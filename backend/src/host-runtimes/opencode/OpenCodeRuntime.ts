import fs from 'fs';
import path from 'path';
import {
  HostRuntime,
  HostRuntimeCommandResult,
  HostRuntimeDeleteResult,
  HostRuntimeOptions,
  HostRuntimeProject,
  HostRuntimeStatus,
  HostRuntimeStillRunningError
} from '../HostRuntime';

type OpenCodeBridgeConfig = {
  bridgeUrl?: string;
  cwd?: string;
};

export class OpenCodeRuntime implements HostRuntime {
  readonly hostKind = 'opencode';
  readonly pollIntervalMs: number;
  private readonly projectsRoot: string;
  private readonly bridgeUrl: string;
  private readonly cwd: string | null;

  constructor(options: HostRuntimeOptions) {
    this.projectsRoot = options.projectsRoot;
    this.pollIntervalMs = Number(options.pollIntervalMs || process.env.HOST_BACKGROUND_POLL_INTERVAL_MS || process.env.OPENCODE_BRIDGE_POLL_INTERVAL_MS || 30000);
    this.bridgeUrl = process.env.HOST_BRIDGE_URL || process.env.OPENCODE_BRIDGE_URL || this.readHostConfig().bridgeUrl || 'http://host.docker.internal:5002/opencode';
    this.cwd = this.resolveHostCwd();
  }

  async getStatus(sessionId: string): Promise<HostRuntimeStatus | null> {
    if (!sessionId) return null;
    try {
      const res = await fetch(`${this.bridgeBaseUrl()}/opencode/status?sessionId=${encodeURIComponent(sessionId)}`);
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

  // Diferencia deliberada respecto a CodexRuntime/ClaudeRuntime: no hay rama
  // para status==='rate_limited'. opencode-bridge.js nunca emite ese status
  // para el free tier de OpenCode Zen (su unico mensaje real, "Rate limit
  // exceeded. Please try again later.", no matchea el patron compartido de
  // rateLimitDetect.js, y el proceso se autorrecupera solo sin que el bridge
  // necesite detectar nada) -- ver docs/opencode-bridge-integracion.md. Con
  // running/timedOut alcanza: BS sigue reconsultando indefinidamente, igual
  // que con cualquier tarea larga, sin distinguir "esta pensando" de "esta
  // esperando el reset del free tier".
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

    let body: { text?: string; response?: string; status?: string; timedOut?: boolean };
    try {
      body = JSON.parse(bodyText) as { text?: string; response?: string; status?: string; timedOut?: boolean };
    } catch {
      return { text: bodyText.trim(), rawBody: bodyText, statusCode: res.status };
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
      // opencode-bridge.js solo expone `threadId` (no un campo separado tipo
      // codexSessionId/claudeSessionId), asi que aca coincide con threadId.
      nativeSessionId: raw?.threadId ?? null,
      nativeThreadId: raw?.threadId ?? null,
      threadId: raw?.threadId ?? null,
      text: raw?.text ?? null,
      error: raw?.error,
      primaryEvidenceType: null,
      primaryEvidencePath: null,
      raw
    };
  }

  // Variante Linux: cuando el bridge corre host-side y no hay un cwd
  // explicito (env var o hosts/opencode.json), no se manda ningun override --
  // se devuelve null y opencode-bridge.js se autoubica solo con su propio
  // __dirname (ver DEFAULT_CWD ahi). Mandar un path calculado desde adentro
  // del contenedor (ej. projectsRoot, que es un mount interno tipo
  // /workspace/bawestudios) no serviria: el bridge corre fuera de Docker y
  // ese path no existe en el filesystem del host.
  private resolveHostCwd(): string | null {
    const configuredCwd = process.env.HOST_CWD || process.env.OPENCODE_CWD;
    const hostConfigCwd = this.readHostConfig().cwd;

    if (configuredCwd && fs.existsSync(path.resolve(configuredCwd))) {
      return path.resolve(configuredCwd);
    }

    if (this.isHostSideBridgeUrl(this.bridgeUrl)) {
      if (hostConfigCwd && configuredCwd && configuredCwd !== hostConfigCwd) {
        console.warn(`[OPENCODE RUNTIME] cwd configurado no es valido para bridge host-side: ${configuredCwd}. Usando ${hostConfigCwd}`);
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
    url.pathname = url.pathname.replace(/\/opencode\/?$/, '');
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

  private readHostConfig(): OpenCodeBridgeConfig {
    try {
      const configPath = path.join(__dirname, '..', '..', '..', 'hosts', 'opencode.json');
      if (!fs.existsSync(configPath)) return {};
      return JSON.parse(fs.readFileSync(configPath, 'utf-8')) as OpenCodeBridgeConfig;
    } catch (err) {
      console.warn(`[OPENCODE RUNTIME] No se pudo leer backend/hosts/opencode.json: ${err instanceof Error ? err.message : String(err)}`);
      return {};
    }
  }
}
