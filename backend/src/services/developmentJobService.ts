import type { HostRuntime, HostRuntimeStatus } from '../host-runtimes/HostRuntime';
import { HostRuntimeRateLimitedError, HostRuntimeStillRunningError } from '../host-runtimes/HostRuntime';
import type { HostJobStatus, HostWaitResult, StoredProject } from '../types/domain';
import { isFinalContract, isPartialContract } from '../utils/contracts';

// Ventana de fallback cuando el bridge no pudo resolver una hora exacta de reset
// del limite de uso/sesion del CLI (Claude o Codex). Solo se usa si el mensaje
// del huesped no trae un "resets X" parseable; cuando lo trae, esa hora (ya
// resuelta a ISO/UTC por el bridge) es siempre la fuente de verdad.
const SESSION_WINDOW_FALLBACK_HOURS = Number(process.env.HOST_SESSION_WINDOW_FALLBACK_HOURS || 5);

type HostTurnEvent = {
  projectId?: string | null;
  userId?: string | null;
  sessionId?: string | null;
  eventType: string;
  payload?: any;
};

type UpsertHostJobArgs = {
  projectId: string;
  userId: string;
  sessionId?: string | null;
  status: HostJobStatus;
  command?: string | null;
  response?: string | null;
  error?: string | null;
  attempts?: number;
  finished?: boolean;
  resumeAt?: string | null;
};

type DevelopmentJobDeps = {
  buildContinuationCommand: (project: StoredProject) => string;
  finalizeProjectDelivery: (args: { project: StoredProject; userId: string; sessionId?: string | null; source: string }) => Promise<StoredProject | null>;
  getHostJob: (projectId: string) => Promise<any>;
  getProjectState: (project: StoredProject) => string;
  hostBackgroundMaxAttempts: number;
  hostRuntime: HostRuntime;
  readDb: () => { projects: StoredProject[] };
  recordHostTurnEvent: (event: HostTurnEvent) => void;
  upsertHostJob: (args: UpsertHostJobArgs) => Promise<any>;
};

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Fallback cuando el bridge no informo un resetAt parseable: estima el reset
// como el inicio de la racha actual de continuaciones + una ventana fija.
// Ver SESSION_WINDOW_FALLBACK_HOURS.
function estimateSessionResumeAt(chainStartedAtIso: string): string {
  const resumeAt = new Date(chainStartedAtIso);
  resumeAt.setHours(resumeAt.getHours() + SESSION_WINDOW_FALLBACK_HOURS);
  return resumeAt.toISOString();
}

export function createDevelopmentJobService(deps: DevelopmentJobDeps) {
  const developmentJobs = new Map<string, Promise<void>>();

  async function getHostRuntimeStatus(sessionId: string): Promise<HostRuntimeStatus | null> {
    return deps.hostRuntime.getStatus(sessionId);
  }

  function isHostStatusActive(status: HostRuntimeStatus | null | undefined) {
    return deps.hostRuntime.isStatusActive(status);
  }

  async function sendHostRuntimeCommand(project: StoredProject, sessionId: string, message: string) {
    const result = await deps.hostRuntime.sendCommand(project, sessionId, message);
    deps.recordHostTurnEvent({
      projectId: project.id,
      userId: project.userId,
      sessionId,
      eventType: 'background.host.response',
      payload: { status: result.statusCode, response: result.rawBody.slice(0, 1000) }
    });
    return result.text;
  }

  function startDevelopmentJob(projectId: string, userId: string, reason: string) {
    if (developmentJobs.has(projectId)) return;
    const job = runDevelopmentJob(projectId, userId, reason)
      .catch(err => {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error(`[BackgroundJob] ${projectId}: ${error.message}`);
        deps.recordHostTurnEvent({
          projectId,
          userId,
          sessionId: null,
          eventType: 'background.job.unhandled_error',
          payload: { error: error.message }
        });
      })
      .finally(() => {
        developmentJobs.delete(projectId);
      });
    developmentJobs.set(projectId, job);
  }

  async function waitForHostSessionResult(args: {
    projectId: string;
    userId: string;
    sessionId: string;
    command: string | null;
    attempt: number;
  }): Promise<HostWaitResult> {
    const { projectId, userId, sessionId, command, attempt } = args;
    let lastStatus = '';
    while (true) {
      const hostStatus = await getHostRuntimeStatus(sessionId);
      if (isHostStatusActive(hostStatus)) {
        await deps.upsertHostJob({
          projectId,
          userId,
          sessionId,
          status: 'running_waiting',
          command,
          attempts: attempt,
          error: null
        });
        if (hostStatus?.status !== lastStatus) {
          lastStatus = hostStatus?.status || '';
          deps.recordHostTurnEvent({
            projectId,
            userId,
            sessionId,
            eventType: 'background.job.host_poll_active',
            payload: { attempt, hostStatus }
          });
        }
        await sleep(deps.hostRuntime.pollIntervalMs);
        continue;
      }

      if (hostStatus?.status === 'completed' && hostStatus.text) {
        deps.recordHostTurnEvent({
          projectId,
          userId,
          sessionId,
          eventType: 'background.job.host_poll_completed',
          payload: { attempt, status: hostStatus.status }
        });
        return { text: hostStatus.text, retry: false };
      }

      deps.recordHostTurnEvent({
        projectId,
        userId,
        sessionId,
        eventType: 'background.job.host_poll_unavailable',
        payload: { attempt, hostStatus }
      });
      return { text: null, retry: hostStatus?.status === 'failed' || hostStatus?.status === 'not_found' };
    }
  }

  async function processDevelopmentResponse(args: {
    project: StoredProject;
    projectId: string;
    userId: string;
    sessionId: string;
    command: string;
    attempt: number;
    responseText: string;
  }): Promise<'continue' | 'done'> {
    const { project, projectId, userId, sessionId, command, attempt, responseText } = args;

    if (isPartialContract(responseText)) {
      await deps.upsertHostJob({ projectId, userId, sessionId, status: 'partial_completed', command, response: responseText, attempts: attempt });
      deps.recordHostTurnEvent({ projectId, userId, sessionId, eventType: 'background.contract.partial', payload: { attempt } });
      return 'continue';
    }

    if (isFinalContract(responseText)) {
      await deps.upsertHostJob({ projectId, userId, sessionId, status: 'final_contract_received', command, response: responseText, attempts: attempt, finished: true });
      const finalizedProject = await deps.finalizeProjectDelivery({
        project,
        userId,
        sessionId,
        source: 'background_final_contract'
      });
      await deps.upsertHostJob({
        projectId,
        userId,
        sessionId,
        status: finalizedProject ? 'delivery_ready' : 'delivery_failed',
        command,
        response: responseText,
        attempts: attempt,
        finished: true,
        error: finalizedProject ? null : 'Validacion de entrega fallida'
      });
      deps.recordHostTurnEvent({
        projectId,
        userId,
        sessionId,
        eventType: finalizedProject ? 'background.contract.final.delivery_ready' : 'background.contract.final.delivery_failed',
        payload: { attempt }
      });
      return 'done';
    }

    await deps.upsertHostJob({
      projectId,
      userId,
      sessionId,
      status: 'failed',
      command,
      response: responseText,
      error: 'Respuesta sin contrato estable',
      attempts: attempt,
      finished: true
    });
    deps.recordHostTurnEvent({
      projectId,
      userId,
      sessionId,
      eventType: 'background.contract.unexpected',
      payload: { attempt, response: responseText.slice(0, 1000) }
    });
    return 'done';
  }

  async function runDevelopmentJob(projectId: string, userId: string, reason: string) {
    const maxAttempts = deps.hostBackgroundMaxAttempts;
    // Primer "continuar" de esta racha (se reinicia cada vez que runDevelopmentJob
    // arranca de nuevo: manual, por auto-continue de contrato parcial, o por
    // recuperacion al bootear). Sirve como fallback para estimar el reset del
    // limite de uso/sesion cuando el bridge no pudo resolver una hora exacta.
    const chainStartedAtIso = new Date().toISOString();
    deps.recordHostTurnEvent({
      projectId,
      userId,
      sessionId: null,
      eventType: 'background.job.started',
      payload: { reason, maxAttempts }
    });

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const project = deps.readDb().projects.find(p => p.id === projectId && p.userId === userId);
      if (!project) {
        deps.recordHostTurnEvent({ projectId, userId, sessionId: null, eventType: 'background.job.project_missing' });
        return;
      }

      const existingJob = await deps.getHostJob(projectId);
      if (
        existingJob?.bs_session_id &&
        (existingJob.status === 'running' || existingJob.status === 'running_waiting')
      ) {
        const hostStatus = await getHostRuntimeStatus(existingJob.bs_session_id);
        if (isHostStatusActive(hostStatus)) {
          await deps.upsertHostJob({
            projectId,
            userId,
            sessionId: existingJob.bs_session_id,
            status: 'running_waiting',
            command: existingJob.command,
            attempts: Number(existingJob.attempts || attempt),
            error: null
          });
          deps.recordHostTurnEvent({
            projectId,
            userId,
            sessionId: existingJob.bs_session_id,
            eventType: 'background.job.active_host_session',
            payload: { attempt, hostStatus }
          });
          const hostResponse = await waitForHostSessionResult({
            projectId,
            userId,
            sessionId: existingJob.bs_session_id,
            command: existingJob.command,
            attempt: Number(existingJob.attempts || attempt)
          });
          if (hostResponse.text) {
            const result = await processDevelopmentResponse({
              project,
              projectId,
              userId,
              sessionId: existingJob.bs_session_id,
              command: existingJob.command || deps.buildContinuationCommand(project),
              attempt: Number(existingJob.attempts || attempt),
              responseText: hostResponse.text
            });
            if (result === 'continue') {
              await sleep(1000);
              continue;
            }
          }
          if (hostResponse.retry) continue;
          return;
        }

        if (hostStatus?.status === 'completed' && hostStatus.text) {
          const result = await processDevelopmentResponse({
            project,
            projectId,
            userId,
            sessionId: existingJob.bs_session_id,
            command: existingJob.command || deps.buildContinuationCommand(project),
            attempt: Number(existingJob.attempts || attempt),
            responseText: hostStatus.text
          });
          if (result === 'continue') {
            await sleep(1000);
            continue;
          }
          return;
        }
      }

      const sessionId = `build_${project.id}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const command = deps.buildContinuationCommand(project);
      await deps.upsertHostJob({ projectId, userId, sessionId, status: 'running', command, attempts: attempt });
      deps.recordHostTurnEvent({
        projectId,
        userId,
        sessionId,
        eventType: 'background.host.send',
        payload: { command, attempt }
      });

      try {
        const responseText = await sendHostRuntimeCommand(project, sessionId, command);
        const result = await processDevelopmentResponse({ project, projectId, userId, sessionId, command, attempt, responseText });
        if (result === 'continue') {
          await sleep(1000);
          continue;
        }
        return;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        if (error instanceof HostRuntimeRateLimitedError) {
          const resumeAt = error.resetAt || estimateSessionResumeAt(chainStartedAtIso);
          await deps.upsertHostJob({
            projectId,
            userId,
            sessionId,
            status: 'rate_limited',
            command,
            error: error.message,
            attempts: attempt,
            resumeAt
          });
          deps.recordHostTurnEvent({
            projectId,
            userId,
            sessionId,
            eventType: 'background.job.rate_limited',
            payload: {
              attempt,
              resumeAt,
              source: error.resetAt ? 'parsed' : 'estimated',
              chainStartedAt: chainStartedAtIso
            }
          });
          const waitMs = Math.max(0, new Date(resumeAt).getTime() - Date.now());
          await sleep(waitMs);
          continue;
        }
        if (error instanceof HostRuntimeStillRunningError) {
          await deps.upsertHostJob({
            projectId,
            userId,
            sessionId,
            status: 'running_waiting',
            command,
            error: null,
            attempts: attempt
          });
          deps.recordHostTurnEvent({
            projectId,
            userId,
            sessionId,
            eventType: 'background.job.host_still_running',
            payload: { attempt, hostStatus: error.hostStatus || null }
          });
          const hostResponse = await waitForHostSessionResult({ projectId, userId, sessionId, command, attempt });
          if (hostResponse.text) {
            const result = await processDevelopmentResponse({ project, projectId, userId, sessionId, command, attempt, responseText: hostResponse.text });
            if (result === 'continue') {
              await sleep(1000);
              continue;
            }
          }
          if (hostResponse.retry) continue;
          return;
        }
        const hostStatus = await getHostRuntimeStatus(sessionId);
        if (isHostStatusActive(hostStatus)) {
          await deps.upsertHostJob({
            projectId,
            userId,
            sessionId,
            status: 'running_waiting',
            command,
            error: null,
            attempts: attempt
          });
          deps.recordHostTurnEvent({
            projectId,
            userId,
            sessionId,
            eventType: 'background.job.error_but_host_active',
            payload: { attempt, error: error.message, hostStatus }
          });
          const hostResponse = await waitForHostSessionResult({ projectId, userId, sessionId, command, attempt });
          if (hostResponse.text) {
            const result = await processDevelopmentResponse({ project, projectId, userId, sessionId, command, attempt, responseText: hostResponse.text });
            if (result === 'continue') {
              await sleep(1000);
              continue;
            }
          }
          if (hostResponse.retry) continue;
          return;
        }
        if (hostStatus?.status === 'completed' && hostStatus.text) {
          const result = await processDevelopmentResponse({
            project,
            projectId,
            userId,
            sessionId,
            command,
            attempt,
            responseText: hostStatus.text
          });
          if (result === 'continue') {
            await sleep(1000);
            continue;
          }
          return;
        }
        const isBridgeUnreachable = /fetch failed|ECONNREFUSED|ENOTFOUND|ETIMEDOUT/i.test(error.message);
        if (isBridgeUnreachable && attempt < maxAttempts) {
          await deps.upsertHostJob({
            projectId,
            userId,
            sessionId,
            status: 'running_waiting',
            command,
            error: error.message,
            attempts: attempt
          });
          deps.recordHostTurnEvent({
            projectId,
            userId,
            sessionId,
            eventType: 'background.job.bridge_unreachable_retry',
            payload: { attempt, error: error.message }
          });
          await sleep(Math.min(30000, 1000 * attempt));
          continue;
        }

        await deps.upsertHostJob({ projectId, userId, sessionId, status: 'failed', command, error: error.message, attempts: attempt, finished: true });
        deps.recordHostTurnEvent({
          projectId,
          userId,
          sessionId,
          eventType: 'background.job.error',
          payload: { attempt, error: error.message }
        });
        return;
      }
    }

    await deps.upsertHostJob({
      projectId,
      userId,
      status: 'failed',
      error: `Se alcanzo el maximo de intentos (${maxAttempts}) sin contrato final`,
      attempts: maxAttempts,
      finished: true
    });
    deps.recordHostTurnEvent({ projectId, userId, sessionId: null, eventType: 'background.job.max_attempts', payload: { maxAttempts } });
  }

  function recoverDevelopmentJobsOnStartup() {
    const projects = deps.readDb().projects.filter(project => {
      const state = deps.getProjectState(project);
      return project.status === 'building' || state === 'PROJECT_BUILDING';
    });
    for (const project of projects) {
      deps.recordHostTurnEvent({
        projectId: project.id,
        userId: project.userId,
        sessionId: null,
        eventType: 'background.job.recovered_on_startup',
        payload: { projectName: project.project_name, projectPath: project.project_path }
      });

      deps.getHostJob(project.id)
        .then(existingJob => {
          const resumeAtMs = existingJob?.resume_at ? new Date(existingJob.resume_at).getTime() : null;
          const stillLimited = existingJob?.status === 'rate_limited' && resumeAtMs && resumeAtMs > Date.now();

          if (stillLimited && resumeAtMs) {
            const waitMs = resumeAtMs - Date.now();
            deps.recordHostTurnEvent({
              projectId: project.id,
              userId: project.userId,
              sessionId: null,
              eventType: 'background.job.rate_limit_recovery_deferred',
              payload: { resumeAt: existingJob.resume_at, waitMs }
            });
            // Persistido en host_jobs.resume_at, no solo en memoria: si el
            // backend se reinicia de nuevo antes de que se cumpla, el proximo
            // boot vuelve a leer esta misma fila y recalcula cuanto falta en
            // vez de reintentar de una.
            setTimeout(() => startDevelopmentJob(project.id, project.userId, 'rate_limit_resume'), waitMs);
            return;
          }

          deps.upsertHostJob({
            projectId: project.id,
            userId: project.userId,
            status: 'running',
            error: null,
            attempts: 0
          }).catch(() => {});
          startDevelopmentJob(project.id, project.userId, 'startup_recovery');
        })
        .catch(() => {
          deps.upsertHostJob({
            projectId: project.id,
            userId: project.userId,
            status: 'running',
            error: null,
            attempts: 0
          }).catch(() => {});
          startDevelopmentJob(project.id, project.userId, 'startup_recovery');
        });
    }
  }

  return {
    recoverDevelopmentJobsOnStartup,
    startDevelopmentJob
  };
}
