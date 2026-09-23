export type HostRuntimeProject = {
  id: string;
  userId: string;
  name?: string;
  project_name?: string;
  project_path?: string;
};

export type HostRuntimeStatus = {
  ok?: boolean;
  hostKind: string;
  adapter: string;
  sessionId?: string;
  status?: string;
  alive?: boolean;
  timedOut?: boolean;
  pid?: number | null;
  nativeSessionId?: string | null;
  nativeThreadId?: string | null;
  threadId?: string | null;
  text?: string | null;
  error?: string;
  primaryEvidenceType?: string | null;
  primaryEvidencePath?: string | null;
  raw?: any;
};

export type HostRuntimeCommandResult = {
  text: string;
  rawBody: string;
  statusCode: number;
};

export type HostRuntimeDeleteResult = {
  bodyText: string;
  statusCode: number;
};

export type HostRuntimeOptions = {
  projectsRoot: string;
  pollIntervalMs?: number;
};

export interface HostRuntime {
  readonly hostKind: string;
  readonly pollIntervalMs: number;
  getStatus(sessionId: string): Promise<HostRuntimeStatus | null>;
  isStatusActive(status: HostRuntimeStatus | null | undefined): boolean;
  sendCommand(project: HostRuntimeProject, sessionId: string, message: string, timeoutMs?: number): Promise<HostRuntimeCommandResult>;
  deleteProject(project: HostRuntimeProject, sessionId: string, workspaceUserId: string, projectName: string, timeoutMs?: number): Promise<HostRuntimeDeleteResult>;
}

export class HostRuntimeStillRunningError extends Error {
  hostStatus?: HostRuntimeStatus;

  constructor(message: string, hostStatus?: HostRuntimeStatus) {
    super(message);
    this.name = 'HostRuntimeStillRunningError';
    this.hostStatus = hostStatus;
  }
}

// Lanzado cuando el bridge (Claude o Codex, cualquier adaptador) informa que
// el CLI del huesped alcanzo su limite de uso/sesion. resetAt viene resuelto
// por el bridge como ISO/UTC absoluto (el bridge corre en Windows, en la TZ
// real del CLI; el backend puede correr en un container con otra TZ, asi que
// nunca debe intentar parsear la hora textual del mensaje por su cuenta).
export class HostRuntimeRateLimitedError extends Error {
  resetAt: string | null;

  constructor(message: string, resetAt: string | null) {
    super(message);
    this.name = 'HostRuntimeRateLimitedError';
    this.resetAt = resetAt;
  }
}
