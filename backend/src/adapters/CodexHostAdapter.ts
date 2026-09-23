/**
 * CodexHostAdapter - Adapter that delegates Codex CLI execution to a local
 * Windows bridge outside Docker.
 */

import { IHostAdapter } from './IHostAdapter';
import * as path from 'path';
import * as fs from 'fs';
import { extractMarkedResponse, hasEditQueueReadySignal, hasExtensionQueueReadySignal } from '../utils/contracts';
import { GENERIC_HOST_ERROR_MESSAGE } from '../config/env';

const LOG_DIR = path.join(__dirname, '..', '..', '..', 'logs');
const SESSION_LOG = path.join(LOG_DIR, 'codex-session.log');
const CODEX_CONFIG_PATH = path.join(__dirname, '..', '..', 'hosts', 'codex.json');

type CodexBridgeConfig = {
  name: string;
  type: 'http-bridge';
  bridgeUrl: string;
  command: string;
  args?: string[];
  cwd: string;
  mode: 'spawn-per-message' | 'session-resume';
  timeoutMs?: number;
};

function ts(): string {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function slog(line: string): void {
  const entry = `[${ts()}] ${line}\n`;
  process.stdout.write(entry);
  try {
    if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
    fs.appendFileSync(SESSION_LOG, entry, 'utf8');
  } catch {
    // Logging must never block the chat flow.
  }
}

function loadCodexBridgeConfig(): CodexBridgeConfig {
  const raw = fs.readFileSync(CODEX_CONFIG_PATH, 'utf8');
  const config = JSON.parse(raw) as CodexBridgeConfig;
  const bridgeUrl = process.env.CODEX_BRIDGE_URL || config.bridgeUrl;
  const cwd = process.env.CODEX_CWD || config.cwd;
  const command = process.env.CODEX_COMMAND || config.command;

  if (config.type !== 'http-bridge') {
    throw new Error(`[CODEX HOST] codex.json debe usar type="http-bridge"`);
  }
  if (!bridgeUrl) {
    throw new Error(`[CODEX HOST] campo obligatorio faltante: "bridgeUrl"`);
  }
  if (!cwd) {
    throw new Error(`[CODEX HOST] campo obligatorio faltante: "cwd"`);
  }

  return { ...config, bridgeUrl, cwd, command };
}

export class CodexHostAdapter implements IHostAdapter {
  private config: CodexBridgeConfig;
  private messageCallbacks: ((sessionId: string, message: any) => void)[] = [];
  private errorCallbacks: ((sessionId: string, error: Error) => void)[] = [];
  private exitCallbacks: ((sessionId: string, code: number) => void)[] = [];
  private lastPid: number | null = null;
  private activeSessions: Set<string> = new Set();
  private stoppingSessions: Set<string> = new Set();

  constructor() {
    this.config = loadCodexBridgeConfig();
    console.log(`[CODEX HOST] CodexHostAdapter inicializado`);
    console.log(`[CODEX HOST] bridge configurado: ${this.config.bridgeUrl}`);
    console.log(`[CODEX HOST] cwd configurado: ${this.config.cwd}`);
  }

  async start(sessionId: string): Promise<void> {
    this.lastPid = null;
    this.activeSessions.add(sessionId);
    console.log(`[CODEX HOST] sesion iniciada: ${sessionId}`);
  }

  async send(sessionId: string, message: string, options?: { markers?: { start: string; end: string } }): Promise<void> {
    if (!this.activeSessions.has(sessionId)) {
      throw new Error(`[CODEX HOST] sesion no activa: ${sessionId}`);
    }

    slog(`[CODEX HOST] mensaje recibido desde chat: ${message}`);

    try {
      const response = await this.callBridge(sessionId, message);
      let responseText = response.text;
      this.lastPid = response.pid;
      if (!this.activeSessions.has(sessionId) || this.stoppingSessions.has(sessionId)) {
        slog(`[CODEX HOST] respuesta ignorada para sesion detenida: ${sessionId}`);
        return;
      }
      slog(`PRUEBA5 PARSED=${responseText ? `"${responseText.slice(0, 200)}"` : 'null'}`);

      if (!responseText) {
        const errMsg = 'Bridge respondio sin texto parseable';
        const errorMessage = { sessionId, type: 'error', text: GENERIC_HOST_ERROR_MESSAGE };
        slog(`PRUEBA6 socket.emit('error') payload=${JSON.stringify(errorMessage).slice(0, 200)}`);
        this.errorCallbacks.forEach(cb => cb(sessionId, new Error(errMsg)));
        this.messageCallbacks.forEach(cb => cb(sessionId, errorMessage));
        return;
      }

      let editQueueReady = false;
      let extensionQueueReady = false;
      if (options?.markers) {
        editQueueReady = hasEditQueueReadySignal(responseText);
        extensionQueueReady = hasExtensionQueueReadySignal(responseText);
        const extracted = extractMarkedResponse(responseText, options.markers.start, options.markers.end);
        if (!extracted) {
          const errMsg = 'Respuesta sin el formato esperado';
          slog(`[CODEX HOST] ${errMsg}: ${responseText.slice(0, 200)}`);
          const errorMessage = { sessionId, type: 'error', text: GENERIC_HOST_ERROR_MESSAGE };
          this.errorCallbacks.forEach(cb => cb(sessionId, new Error(errMsg)));
          this.messageCallbacks.forEach(cb => cb(sessionId, errorMessage));
          return;
        }
        responseText = extracted;
      }

      const responseMessage: Record<string, unknown> = { sessionId, type: 'question', id: 'codex-response', text: responseText };
      if (editQueueReady) responseMessage.editQueueReady = true;
      if (extensionQueueReady) responseMessage.extensionQueueReady = true;
      slog(`PRUEBA6 messageCallbacks.length=${this.messageCallbacks.length}`);
      slog(`PRUEBA6 calling messageCallbacks with payload type=question text="${responseText.slice(0, 200)}"`);
      console.log(`[BACKEND -> FRONTEND] respuesta enviada: ${JSON.stringify(responseMessage).slice(0, 300)}`);
      this.messageCallbacks.forEach(cb => cb(sessionId, responseMessage));
      slog(`PRUEBA6 DONE - messageCallbacks called`);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      if (!this.activeSessions.has(sessionId) || this.stoppingSessions.has(sessionId)) {
        slog(`[CODEX HOST] error ignorado para sesion detenida: ${sessionId}: ${error.message.slice(0, 200)}`);
        return;
      }
      slog(`ERROR bridge: ${error.message}`);
      this.errorCallbacks.forEach(cb => cb(sessionId, error));
      this.messageCallbacks.forEach(cb => cb(sessionId, {
        sessionId,
        type: 'error',
        text: GENERIC_HOST_ERROR_MESSAGE
      }));
    }
  }

  async stop(sessionId: string): Promise<void> {
    this.stoppingSessions.add(sessionId);
    slog(`[CODEX HOST] stopping sessionId=${sessionId}`);

    try {
      const stopUrl = this.getStopUrl();
      const res = await fetch(stopUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });
      const bodyText = await res.text();
      const statusLabel = res.ok ? 'cancelled' : (res.status === 404 ? 'not_found' : 'stop_error');
      slog(`[CODEX HOST] ${statusLabel} sessionId=${sessionId} stopStatus=${res.status} body=${bodyText.slice(0, 300)}`);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      slog(`[CODEX HOST] stop_error sessionId=${sessionId}: ${error.message.slice(0, 300)}`);
    } finally {
      this.activeSessions.delete(sessionId);
      this.stoppingSessions.delete(sessionId);
      console.log(`[CODEX HOST] sesion detenida: ${sessionId}`);
      this.exitCallbacks.forEach(cb => cb(sessionId, 0));
    }
  }

  private getStopUrl(): string {
    const url = new URL(this.config.bridgeUrl);
    url.pathname = '/stop';
    url.search = '';
    return url.toString();
  }

  private async callBridge(sessionId: string, prompt: string): Promise<{ text: string | null; pid: number | null }> {
    const controller = new AbortController();
    const timeoutMs = Math.max(this.config.timeoutMs || 600000, 600000);
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      slog(`[CODEX HOST] bridgeUrl: ${this.config.bridgeUrl}`);
      slog(`[CODEX HOST] cwd host: ${this.config.cwd}`);

      const res = await fetch(this.config.bridgeUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: prompt,
          cwd: this.config.cwd,
          command: this.config.command,
          args: this.config.args || [],
          timeoutMs
        }),
        signal: controller.signal
      });

      const bodyText = await res.text();
      slog(`[CODEX HOST] bridge status=${res.status} body=${bodyText.slice(0, 500)}`);

      if (!res.ok) {
        throw new Error(`Bridge HTTP ${res.status}: ${bodyText.slice(0, 300)}`);
      }

      const body = JSON.parse(bodyText) as {
        text?: string;
        response?: string;
        pid?: number | null;
        error?: string;
      };
      return {
        text: (body.text || body.response || '').trim() || null,
        pid: body.pid ?? null
      };
    } finally {
      clearTimeout(timeout);
    }
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

  getPID(_sessionId: string): number | null {
    return this.lastPid;
  }
}
