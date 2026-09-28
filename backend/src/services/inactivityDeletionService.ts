import type { DbShape, StoredProject } from '../types/domain';

const DAY_MS = 24 * 60 * 60 * 1000;

// Al quedar conforme con la web entregada se recomienda borrar el proyecto
// por seguridad (contenedores + carpeta corriendo indefinidamente son una
// superficie de ataque). Si el cliente no vuelve, BaweStudio avisa a los 7
// dias de inactividad y borra solo a los 14 (7 mas desde el aviso).
const WARN_AFTER_MS = Number(process.env.INACTIVITY_WARN_AFTER_MS || 7 * DAY_MS);
const DELETE_AFTER_WARN_MS = Number(process.env.INACTIVITY_DELETE_AFTER_WARN_MS || 7 * DAY_MS);
const CHECK_INTERVAL_MS = Number(process.env.INACTIVITY_CHECK_INTERVAL_MS || 60 * 60 * 1000);

type HostTurnEvent = {
  projectId?: string | null;
  userId?: string | null;
  sessionId?: string | null;
  eventType: string;
  payload?: any;
};

type InactivityDeletionDeps = {
  readDb: () => DbShape;
  updateProject: (projectId: string, userId: string, patch: Partial<StoredProject>) => StoredProject | null;
  deleteProjectRecord: (projectId: string, userId: string) => void;
  sendMotorDeleteCommand: (project: StoredProject) => Promise<string>;
  getExecutionState: (projectId: string) => string;
  recordHostTurnEvent: (event: HostTurnEvent) => void;
  notifyInactivityWarning: (project: StoredProject) => void;
  notifyInactivityDeleted: (project: StoredProject) => void;
};

// last_activity_at puede no existir en proyectos 'ready' creados antes de
// esta feature -- se toma updated_at (fecha del ultimo escritura real, que
// incluye el momento de la entrega) como piso razonable en vez de tratar el
// campo vacio como "inactivo desde siempre" y borrarlos en la primera pasada.
function lastKnownActivityMs(project: StoredProject): number {
  const raw = project.lastActivityAt || project.updatedAt || project.updated_at;
  const ms = raw ? new Date(raw).getTime() : Date.now();
  return Number.isFinite(ms) ? ms : Date.now();
}

export function createInactivityDeletionService(deps: InactivityDeletionDeps) {
  async function reviewProject(project: StoredProject, now: number) {
    if (project.status !== 'ready') return;
    if (['RUNNING', 'STOPPING'].includes(deps.getExecutionState(project.id))) return;

    const inactiveMs = now - lastKnownActivityMs(project);

    if (!project.inactivityWarnedAt) {
      if (inactiveMs < WARN_AFTER_MS) return;
      const updated = deps.updateProject(project.id, project.userId, { inactivityWarnedAt: new Date(now).toISOString() });
      deps.recordHostTurnEvent({
        projectId: project.id,
        userId: project.userId,
        sessionId: null,
        eventType: 'inactivity.warned',
        payload: { inactiveDays: Math.floor(inactiveMs / DAY_MS) }
      });
      if (updated) deps.notifyInactivityWarning(updated);
      return;
    }

    const warnedMs = new Date(project.inactivityWarnedAt).getTime();
    if (now - warnedMs < DELETE_AFTER_WARN_MS) return;

    try {
      await deps.sendMotorDeleteCommand(project);
      deps.deleteProjectRecord(project.id, project.userId);
      deps.recordHostTurnEvent({
        projectId: project.id,
        userId: project.userId,
        sessionId: null,
        eventType: 'inactivity.auto_deleted',
        payload: { inactiveDays: Math.floor(inactiveMs / DAY_MS) }
      });
      deps.notifyInactivityDeleted(project);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      deps.recordHostTurnEvent({
        projectId: project.id,
        userId: project.userId,
        sessionId: null,
        eventType: 'inactivity.auto_delete_failed',
        payload: { error: message }
      });
    }
  }

  async function runSweep() {
    const now = Date.now();
    const projects = deps.readDb().projects.filter(p => p.status === 'ready');
    for (const project of projects) {
      await reviewProject(project, now).catch(() => {});
    }
  }

  function startInactivityDeletionSupervisor(intervalMs: number = CHECK_INTERVAL_MS) {
    return setInterval(() => {
      runSweep().catch(() => {});
    }, intervalMs);
  }

  return {
    runSweep,
    startInactivityDeletionSupervisor
  };
}
