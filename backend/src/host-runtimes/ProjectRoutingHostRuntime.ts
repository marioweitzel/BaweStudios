/**
 * ProjectRoutingHostRuntime — elige el runtime concreto (Codex, Claude, OpenCode)
 * segun el CLI que el cliente eligio para el proyecto (preferredHostAdapter).
 * Sin eleccion, usa el runtime por defecto (HOST_ADAPTER). No modifica los
 * runtimes concretos: los instancia y delega.
 */

import {
  HostRuntime,
  HostRuntimeCommandResult,
  HostRuntimeDeleteResult,
  HostRuntimeProject,
  HostRuntimeStatus
} from './HostRuntime';

const ROUTABLE_ADAPTERS = new Set(['claude-code', 'codex', 'opencode']);

export class ProjectRoutingHostRuntime implements HostRuntime {
  readonly hostKind = 'project-routing';
  readonly pollIntervalMs: number;
  private readonly delegates = new Map<string, HostRuntime>();
  private readonly delegatesByHostKind = new Map<string, HostRuntime>();

  constructor(
    private readonly defaultRuntime: HostRuntime,
    private readonly build: (adapter: string) => HostRuntime
  ) {
    this.pollIntervalMs = defaultRuntime.pollIntervalMs;
    this.delegatesByHostKind.set(defaultRuntime.hostKind, defaultRuntime);
  }

  private pick(project?: Pick<HostRuntimeProject, 'preferredHostAdapter'> | null): HostRuntime {
    const adapter = project?.preferredHostAdapter;
    if (!adapter || !ROUTABLE_ADAPTERS.has(adapter)) return this.defaultRuntime;
    let delegate = this.delegates.get(adapter);
    if (!delegate) {
      delegate = this.build(adapter);
      this.delegates.set(adapter, delegate);
      this.delegatesByHostKind.set(delegate.hostKind, delegate);
    }
    return delegate;
  }

  getStatus(sessionId: string, project?: HostRuntimeProject | null): Promise<HostRuntimeStatus | null> {
    return this.pick(project).getStatus(sessionId);
  }

  // El estado trae el hostKind del runtime que lo produjo; asi no hace falta el proyecto.
  isStatusActive(status: HostRuntimeStatus | null | undefined): boolean {
    const delegate = (status && this.delegatesByHostKind.get(status.hostKind)) || this.defaultRuntime;
    return delegate.isStatusActive(status);
  }

  sendCommand(project: HostRuntimeProject, sessionId: string, message: string, timeoutMs?: number): Promise<HostRuntimeCommandResult> {
    return this.pick(project).sendCommand(project, sessionId, message, timeoutMs);
  }

  deleteProject(project: HostRuntimeProject, sessionId: string, workspaceUserId: string, projectName: string, timeoutMs?: number): Promise<HostRuntimeDeleteResult> {
    return this.pick(project).deleteProject(project, sessionId, workspaceUserId, projectName, timeoutMs);
  }
}
