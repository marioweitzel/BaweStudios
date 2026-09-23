import type { HostRuntime, HostRuntimeStatus } from '../host-runtimes/HostRuntime';
import { HostRuntimeRateLimitedError, HostRuntimeStillRunningError } from '../host-runtimes/HostRuntime';
import type { HostJobStatus, HostWaitResult, StoredProject } from '../types/domain';
import { isEditFinishedContract, isEditPartialContract, isPartialContract } from '../utils/contracts';

// Hermano paralelo de developmentJobService.ts: mismo patron de polling en
// background contra el bridge (host_jobs, HostRuntime), pero para el track
// de "cambios" post-entrega. Deliberadamente clonado, no generalizado a
// partir del original — asi el pipeline de construccion (ya validado) queda
// intacto y este archivo puede evolucionar sin riesgo cruzado.
//
// Reusa la misma tabla host_jobs (una fila por project_id) con un prefijo de
// status distinto ("edit_*") en vez de una tabla nueva: un proyecto nunca
// tiene un job de construccion y uno de edicion activos a la vez (la edicion
// solo es posible con el proyecto ya entregado), asi que no hace falta
// distinguir mas que por el string de status.

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

type EditJobDeps = {
  buildEditCommand: (project: StoredProject) => string;
  getActiveEditJobs: () => Promise<Array<{ project_id: string; user_id: string; status: string; resume_at: string | null }>>;
  getHostJob: (projectId: string) => Promise<any>;
  hostBackgroundMaxAttempts: number;
  hostRuntime: HostRuntime;
  notifyEditFinished: (args: { project: StoredProject; userId: string; sessionId?: string | null }) => Promise<void>;
  readDb: () => { projects: StoredProject[] };
  recordHostTurnEvent: (event: HostTurnEvent) => void;
  upsertHostJob: (args: UpsertHostJobArgs) => Promise<any>;
};

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function estimateSessionResumeAt(chainStartedAtIso: string): string {
  const resumeAt = new Date(chainStartedAtIso);
  resumeAt.setHours(resumeAt.getHours() + SESSION_WINDOW_FALLBACK_HOURS);
  return resumeAt.toISOString();
}

export function createEditJobService(deps: EditJobDeps) {
  const editJobs = new Map<string, Promise<void>>();

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
      eventType: 'edit_background.host.response',
      payload: { status: result.statusCode, response: result.rawBody.slice(0, 1000) }
    });
    return result.text;
  }

  function startEditJob(projectId: string, userId: string, reason: string) {
    if (editJobs.has(projectId)) return;
    const job = runEditJob(projectId, userId, reason)
      .catch(err => {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error(`[EditBackgroundJob] ${projectId}: ${error.message}`);
        deps.recordHostTurnEvent({
          projectId,
          userId,
          sessionId: null,
          eventType: 'edit_background.job.unhandled_error',
          payload: { error: error.message }
        });
      })
      .finally(() => {
        editJobs.delete(projectId);
      });
    editJobs.set(projectId, job);
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
          status: 'edit_running_waiting',
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
            eventType: 'edit_background.job.host_poll_active',
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
          eventType: 'edit_background.job.host_poll_completed',
          payload: { attempt, status: hostStatus.status }
        });
        return { text: hostStatus.text, retry: false };
      }

      deps.recordHostTurnEvent({
        projectId,
        userId,
        sessionId,
        eventType: 'edit_background.job.host_poll_unavailable',
        payload: { attempt, hostStatus }
      });
      return { text: null, retry: hostStatus?.status === 'failed' || hostStatus?.status === 'not_found' };
    }
  }

  async function processEditResponse(args: {
    project: StoredProject;
    projectId: string;
    userId: string;
    sessionId: string;
    command: string;
    attempt: number;
    responseText: string;
  }): Promise<'continue' | 'done'> {
    const { project, projectId, userId, sessionId, command, attempt, responseText } = args;

    // isPartialContract detecta el "Parcial completado. Espero 'continuar'..."
    // que usa la sub-cadena de intake de Extensión (extension-context-detector
    // .. extension-queue-generator) — clon literal del contrato de resume del
    // pipeline de build, nunca emitido por Ajuste. Una vez que esa sub-cadena
    // entrega a extension-product-development, esa skill ya habla el mismo
    // EDIT_PARTIAL_MARKER/EDIT_FINISHED_MARKER que edit-product-development,
    // asi que no hace falta distinguir mas alla de este check.
    if (isEditPartialContract(responseText) || isPartialContract(responseText)) {
      await deps.upsertHostJob({ projectId, userId, sessionId, status: 'edit_partial_completed', command, response: responseText, attempts: attempt });
      deps.recordHostTurnEvent({
        projectId,
        userId,
        sessionId,
        eventType: 'edit_background.contract.partial',
        payload: { attempt, contract: isEditPartialContract(responseText) ? 'edit_marker' : 'extension_intake_text' }
      });
      return 'continue';
    }

    if (isEditFinishedContract(responseText)) {
      await deps.upsertHostJob({ projectId, userId, sessionId, status: 'edit_final_received', command, response: responseText, attempts: attempt, finished: true });
      await deps.notifyEditFinished({ project, userId, sessionId });
      await deps.upsertHostJob({
        projectId,
        userId,
        sessionId,
        status: 'edit_done',
        command,
        response: responseText,
        attempts: attempt,
        finished: true
      });
      deps.recordHostTurnEvent({ projectId, userId, sessionId, eventType: 'edit_background.contract.final', payload: { attempt } });
      return 'done';
    }

    await deps.upsertHostJob({
      projectId,
      userId,
      sessionId,
      status: 'edit_failed',
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
      eventType: 'edit_background.contract.unexpected',
      payload: { attempt, response: responseText.slice(0, 1000) }
    });
    return 'done';
  }

  async function runEditJob(projectId: string, userId: string, reason: string) {
    const maxAttempts = deps.hostBackgroundMaxAttempts;
    const chainStartedAtIso = new Date().toISOString();
    deps.recordHostTurnEvent({
      projectId,
      userId,
      sessionId: null,
      eventType: 'edit_background.job.started',
      payload: { reason, maxAttempts }
    });

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const project = deps.readDb().projects.find(p => p.id === projectId && p.userId === userId);
      if (!project) {
        deps.recordHostTurnEvent({ projectId, userId, sessionId: null, eventType: 'edit_background.job.project_missing' });
        return;
      }

      const existingJob = await deps.getHostJob(projectId);
      if (
        existingJob?.bs_session_id &&
        (existingJob.status === 'edit_running' || existingJob.status === 'edit_running_waiting')
      ) {
        const hostStatus = await getHostRuntimeStatus(existingJob.bs_session_id);
        if (isHostStatusActive(hostStatus)) {
          await deps.upsertHostJob({
            projectId,
            userId,
            sessionId: existingJob.bs_session_id,
            status: 'edit_running_waiting',
            command: existingJob.command,
            attempts: Number(existingJob.attempts || attempt),
            error: null
          });
          deps.recordHostTurnEvent({
            projectId,
            userId,
            sessionId: existingJob.bs_session_id,
            eventType: 'edit_background.job.active_host_session',
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
            const result = await processEditResponse({
              project,
              projectId,
              userId,
              sessionId: existingJob.bs_session_id,
              command: existingJob.command || deps.buildEditCommand(project),
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
          const result = await processEditResponse({
            project,
            projectId,
            userId,
            sessionId: existingJob.bs_session_id,
            command: existingJob.command || deps.buildEditCommand(project),
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

      const sessionId = `edit_${project.id}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const command = deps.buildEditCommand(project);
      await deps.upsertHostJob({ projectId, userId, sessionId, status: 'edit_running', command, attempts: attempt });
      deps.recordHostTurnEvent({
        projectId,
        userId,
        sessionId,
        eventType: 'edit_background.host.send',
        payload: { command, attempt }
      });

      try {
        const responseText = await sendHostRuntimeCommand(project, sessionId, command);
        const result = await processEditResponse({ project, projectId, userId, sessionId, command, attempt, responseText });
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
            status: 'edit_rate_limited',
            command,
            error: error.message,
            attempts: attempt,
            resumeAt
          });
          deps.recordHostTurnEvent({
            projectId,
            userId,
            sessionId,
            eventType: 'edit_background.job.rate_limited',
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
            status: 'edit_running_waiting',
            command,
            error: null,
            attempts: attempt
          });
          deps.recordHostTurnEvent({
            projectId,
            userId,
            sessionId,
            eventType: 'edit_background.job.host_still_running',
            payload: { attempt, hostStatus: error.hostStatus || null }
          });
          const hostResponse = await waitForHostSessionResult({ projectId, userId, sessionId, command, attempt });
          if (hostResponse.text) {
            const result = await processEditResponse({ project, projectId, userId, sessionId, command, attempt, responseText: hostResponse.text });
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
            status: 'edit_running_waiting',
            command,
            error: null,
            attempts: attempt
          });
          deps.recordHostTurnEvent({
            projectId,
            userId,
            sessionId,
            eventType: 'edit_background.job.error_but_host_active',
            payload: { attempt, error: error.message, hostStatus }
          });
          const hostResponse = await waitForHostSessionResult({ projectId, userId, sessionId, command, attempt });
          if (hostResponse.text) {
            const result = await processEditResponse({ project, projectId, userId, sessionId, command, attempt, responseText: hostResponse.text });
            if (result === 'continue') {
              await sleep(1000);
              continue;
            }
          }
          if (hostResponse.retry) continue;
          return;
        }
        if (hostStatus?.status === 'completed' && hostStatus.text) {
          const result = await processEditResponse({
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
            status: 'edit_running_waiting',
            command,
            error: error.message,
            attempts: attempt
          });
          deps.recordHostTurnEvent({
            projectId,
            userId,
            sessionId,
            eventType: 'edit_background.job.bridge_unreachable_retry',
            payload: { attempt, error: error.message }
          });
          await sleep(Math.min(30000, 1000 * attempt));
          continue;
        }

        await deps.upsertHostJob({ projectId, userId, sessionId, status: 'edit_failed', command, error: error.message, attempts: attempt, finished: true });
        deps.recordHostTurnEvent({
          projectId,
          userId,
          sessionId,
          eventType: 'edit_background.job.error',
          payload: { attempt, error: error.message }
        });
        return;
      }
    }

    await deps.upsertHostJob({
      projectId,
      userId,
      status: 'edit_failed',
      error: `Se alcanzo el maximo de intentos (${maxAttempts}) sin contrato final`,
      attempts: maxAttempts,
      finished: true
    });
    deps.recordHostTurnEvent({ projectId, userId, sessionId: null, eventType: 'edit_background.job.max_attempts', payload: { maxAttempts } });
  }

  function recoverEditJobsOnStartup() {
    deps.getActiveEditJobs()
      .then(activeJobs => {
        for (const job of activeJobs) {
          deps.recordHostTurnEvent({
            projectId: job.project_id,
            userId: job.user_id,
            sessionId: null,
            eventType: 'edit_background.job.recovered_on_startup',
            payload: { previousStatus: job.status }
          });

          const resumeAtMs = job.resume_at ? new Date(job.resume_at).getTime() : null;
          const stillLimited = job.status === 'edit_rate_limited' && resumeAtMs && resumeAtMs > Date.now();

          if (stillLimited && resumeAtMs) {
            const waitMs = resumeAtMs - Date.now();
            deps.recordHostTurnEvent({
              projectId: job.project_id,
              userId: job.user_id,
              sessionId: null,
              eventType: 'edit_background.job.rate_limit_recovery_deferred',
              payload: { resumeAt: job.resume_at, waitMs }
            });
            setTimeout(() => startEditJob(job.project_id, job.user_id, 'rate_limit_resume'), waitMs);
            continue;
          }

          deps.upsertHostJob({
            projectId: job.project_id,
            userId: job.user_id,
            status: 'edit_running',
            error: null,
            attempts: 0
          }).catch(() => {});
          startEditJob(job.project_id, job.user_id, 'startup_recovery');
        }
      })
      .catch(err => {
        console.error(`[EditBackgroundJob] Error recuperando jobs al bootear: ${err instanceof Error ? err.message : String(err)}`);
      });
  }

  return {
    recoverEditJobsOnStartup,
    startEditJob
  };
}
