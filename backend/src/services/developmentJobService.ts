import type { HostRuntime, HostRuntimeStatus } from '../host-runtimes/HostRuntime';
import { HostRuntimeRateLimitedError, HostRuntimeStillRunningError } from '../host-runtimes/HostRuntime';
import type { HostJobStatus, HostWaitResult, StoredProject } from '../types/domain';
import { isFinalContract, isPartialContract } from '../utils/contracts';

// Ventana de fallback cuando el bridge no pudo resolver una hora exacta de reset
// del limite de uso/sesion del CLI (Claude o Codex). Solo se usa si el mensaje
// del huesped no trae un "resets X" parseable; cuando lo trae, esa hora (ya
// resuelta a ISO/UTC por el bridge) es siempre la fuente de verdad.
const SESSION_WINDOW_FALLBACK_HOURS = Number(process.env.HOST_SESSION_WINDOW_FALLBACK_HOURS || 5);

// Margen que se suma a la hora de reanudacion estimada: el reset real del
// huesped puede llegar unos minutos despues de chainStart + ventana (el
// 6/10/2026 se reanudo 22 s antes del reset real y Codex rechazo 3 intentos).
const SESSION_WINDOW_MARGIN_MINUTES = Number(process.env.HOST_SESSION_WINDOW_MARGIN_MINUTES || 10);

// Margen para una hora ya parseada del mensaje del huesped ("try again at
// 5:31 AM" viene truncada al minuto).
const PARSED_RESET_MARGIN_MINUTES = 1;

// Si la hora de reanudacion calculada ya paso (estimacion vieja, o limite
// que reaparece), se espera al menos esto antes de reintentar: evita rafagas
// de reintentos instantaneos que agotan los intentos (6/10/2026: 76 en 7 min).
const RATE_LIMIT_MIN_WAIT_MINUTES = Number(process.env.HOST_RATE_LIMIT_MIN_WAIT_MINUTES || 5);

// Limites consecutivos sin ningun turno completado antes de dar el job por
// fallido. Los rechazos por limite no consumen intentos; este tope evita
// esperar para siempre si el huesped nunca se libera.
const RATE_LIMIT_MAX_WAITS = Number(process.env.HOST_RATE_LIMIT_MAX_WAITS || 6);

// Cada cuanto el supervisor revisa si hay proyectos "building" sin ningun job
// corriendo en memoria (ver startStuckJobSupervisor). Antes de esto, la unica
// red de recuperacion era un restart completo del backend -- si un job moria
// por algo que agotaba los reintentos de conexion, quedaba colgado hasta que
// alguien reiniciara a mano (nos paso dos veces la noche del 25/9/2026).
const STUCK_JOB_CHECK_INTERVAL_MS = Number(process.env.HOST_STUCK_JOB_CHECK_INTERVAL_MS || 5 * 60 * 1000);

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
  updateProject: (projectId: string, userId: string, patch: Partial<StoredProject>) => unknown;
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
  resumeAt.setMinutes(resumeAt.getMinutes() + SESSION_WINDOW_MARGIN_MINUTES);
  return resumeAt.toISOString();
}

// Racha de continuaciones de un job: su inicio (para estimar el reset) y
// cuantos limites seguidos llevamos sin completar un turno.
type RateLimitChainState = { chainStartedAtIso: string; rateLimitWaits: number };

// Hora efectiva de reanudacion: la parseada (+margen) o la estimada; nunca
// anterior a ahora + espera minima.
function resolveRateLimitResumeAt(resetAtIso: string | null | undefined, chainStartedAtIso: string): { resumeAt: string; source: string } {
  let resumeMs: number;
  let source: string;
  if (resetAtIso && Number.isFinite(Date.parse(resetAtIso))) {
    resumeMs = Date.parse(resetAtIso) + PARSED_RESET_MARGIN_MINUTES * 60 * 1000;
    source = 'parsed';
  } else {
    resumeMs = Date.parse(estimateSessionResumeAt(chainStartedAtIso));
    source = 'estimated';
  }
  const floorMs = Date.now() + RATE_LIMIT_MIN_WAIT_MINUTES * 60 * 1000;
  if (resumeMs < floorMs) {
    resumeMs = floorMs;
    source += '_floored';
  }
  return { resumeAt: new Date(resumeMs).toISOString(), source };
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

      if (hostStatus?.status === 'rate_limited') {
        deps.recordHostTurnEvent({
          projectId,
          userId,
          sessionId,
          eventType: 'background.job.host_poll_rate_limited',
          payload: { attempt, hostStatus }
        });
        return { text: null, retry: false, rateLimited: true };
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

  // Rate limit detectado mientras se hacia poll de una sesion ya activa (no en
  // la respuesta sincronica del POST inicial) -- el bridge nunca expone un
  // resetAt exacto en /status (solo en la respuesta de rate-limit del POST),
  // asi que aca siempre se estima con la misma ventana de fallback que usa el
  // otro camino de rate limit. Persistido en host_jobs.resume_at igual que el
  // otro camino, para que sobreviva a un reinicio del backend.
  async function handleBackgroundRateLimit(args: {
    projectId: string;
    userId: string;
    sessionId: string;
    command: string | null;
    attempt: number;
    state: RateLimitChainState;
    resetAt?: string | null;
    message?: string;
    origin?: string;
  }): Promise<boolean> {
    const { projectId, userId, sessionId, command, attempt, state, resetAt, message, origin = 'poll' } = args;
    state.rateLimitWaits += 1;
    if (state.rateLimitWaits > RATE_LIMIT_MAX_WAITS) {
      await deps.upsertHostJob({
        projectId,
        userId,
        sessionId,
        status: 'failed',
        command,
        error: `El host sigue en limite de uso tras ${RATE_LIMIT_MAX_WAITS} esperas consecutivas sin completar un turno`,
        attempts: attempt,
        finished: true
      });
      deps.recordHostTurnEvent({
        projectId,
        userId,
        sessionId,
        eventType: 'background.job.rate_limit_gave_up',
        payload: { attempt, waits: state.rateLimitWaits - 1, maxWaits: RATE_LIMIT_MAX_WAITS }
      });
      return false;
    }
    const { resumeAt, source } = resolveRateLimitResumeAt(resetAt, state.chainStartedAtIso);
    await deps.upsertHostJob({
      projectId,
      userId,
      sessionId,
      status: 'rate_limited',
      command,
      error: message || 'Host alcanzo el limite de uso/sesion (detectado durante poll de estado)',
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
        source: `${origin}_${source}`,
        wait: state.rateLimitWaits,
        chainStartedAt: state.chainStartedAtIso
      }
    });
    const waitMs = Math.max(0, new Date(resumeAt).getTime() - Date.now());
    await sleep(waitMs);
    // Reanuda una ventana nueva: el reloj de la racha empieza ahora, no en el
    // inicio de la racha anterior (si no, el proximo limite se estima en pasado).
    state.chainStartedAtIso = new Date().toISOString();
    return true;
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
    // Se reancla cada vez que se reanuda tras un limite (ver handleBackgroundRateLimit).
    const state: RateLimitChainState = { chainStartedAtIso: new Date().toISOString(), rateLimitWaits: 0 };
    // Un turno completado (contrato parcial) corta la racha de limites; los
    // rechazos por limite no consumen intentos (se compensa el attempt++ del for).
    const processResponse = async (a: Parameters<typeof processDevelopmentResponse>[0]) => {
      const result = await processDevelopmentResponse(a);
      if (result === 'continue') state.rateLimitWaits = 0;
      return result;
    };
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
          if (hostResponse.rateLimited) {
            if (!(await handleBackgroundRateLimit({
              projectId,
              userId,
              sessionId: existingJob.bs_session_id,
              command: existingJob.command,
              attempt: Number(existingJob.attempts || attempt),
              state
            }))) return;
            attempt--;
            continue;
          }
          if (hostResponse.text) {
            const result = await processResponse({
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
          const result = await processResponse({
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
        const result = await processResponse({ project, projectId, userId, sessionId, command, attempt, responseText });
        if (result === 'continue') {
          await sleep(1000);
          continue;
        }
        return;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        if (error instanceof HostRuntimeRateLimitedError) {
          if (!(await handleBackgroundRateLimit({
            projectId,
            userId,
            sessionId,
            command,
            attempt,
            state,
            resetAt: error.resetAt,
            message: error.message,
            origin: 'send'
          }))) return;
          attempt--;
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
          if (hostResponse.rateLimited) {
            if (!(await handleBackgroundRateLimit({ projectId, userId, sessionId, command, attempt, state }))) return;
            attempt--;
            continue;
          }
          if (hostResponse.text) {
            const result = await processResponse({ project, projectId, userId, sessionId, command, attempt, responseText: hostResponse.text });
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
          if (hostResponse.rateLimited) {
            if (!(await handleBackgroundRateLimit({ projectId, userId, sessionId, command, attempt, state }))) return;
            attempt--;
            continue;
          }
          if (hostResponse.text) {
            const result = await processResponse({ project, projectId, userId, sessionId, command, attempt, responseText: hostResponse.text });
            if (result === 'continue') {
              await sleep(1000);
              continue;
            }
          }
          if (hostResponse.retry) continue;
          return;
        }
        if (hostStatus?.status === 'completed' && hostStatus.text) {
          const result = await processResponse({
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

  // Punto unico de decision: dado un proyecto que parece "building", decide
  // si hay que reintentarlo, esperar un rate-limit ya conocido, o dejarlo
  // quieto porque en realidad ya llego a un final real. Usado tanto por la
  // recuperacion al bootear como por el supervisor periodico -- misma logica,
  // dos disparadores distintos.
  async function attemptJobRecovery(project: StoredProject, reason: string) {
    const existingJob = await deps.getHostJob(project.id).catch(() => null);

    if (existingJob?.finished_at) {
      // El job ya termino de verdad (entregado o fallado con contrato
      // estable) pero nadie actualizo project.status -- pasa hoy en el
      // camino de fallo real (ver processDevelopmentResponse/
      // finalizeProjectDelivery, ninguno de los dos toca project.status en
      // el caso de error). Sin este chequeo, cualquier supervisor reintenta
      // un proyecto muerto para siempre. Reflejar la realidad y no tocar nada mas.
      deps.recordHostTurnEvent({
        projectId: project.id,
        userId: project.userId,
        sessionId: null,
        eventType: 'background.job.recovery_skipped_terminal',
        payload: { reason, hostJobStatus: existingJob.status }
      });
      if (project.status === 'building') {
        deps.updateProject(project.id, project.userId, { status: 'failed' });
      }
      return;
    }

    const resumeAtMs = existingJob?.resume_at ? new Date(existingJob.resume_at).getTime() : null;
    const stillLimited = existingJob?.status === 'rate_limited' && resumeAtMs && resumeAtMs > Date.now();

    if (stillLimited && resumeAtMs) {
      const waitMs = resumeAtMs - Date.now();
      deps.recordHostTurnEvent({
        projectId: project.id,
        userId: project.userId,
        sessionId: null,
        eventType: 'background.job.rate_limit_recovery_deferred',
        payload: { resumeAt: existingJob.resume_at, waitMs, reason }
      });
      // Persistido en host_jobs.resume_at, no solo en memoria: si el
      // backend se reinicia de nuevo antes de que se cumpla, el proximo
      // boot (o el propio supervisor) vuelve a leer esta misma fila y
      // recalcula cuanto falta en vez de reintentar de una.
      setTimeout(() => startDevelopmentJob(project.id, project.userId, 'rate_limit_resume'), waitMs);
      return;
    }

    deps.recordHostTurnEvent({
      projectId: project.id,
      userId: project.userId,
      sessionId: null,
      eventType: 'background.job.recovery_triggered',
      payload: { reason, projectName: project.project_name, projectPath: project.project_path }
    });
    deps.upsertHostJob({
      projectId: project.id,
      userId: project.userId,
      status: 'running',
      error: null,
      attempts: 0
    }).catch(() => {});
    startDevelopmentJob(project.id, project.userId, reason);
  }

  function projectLooksLikeBuilding(project: StoredProject) {
    const state = deps.getProjectState(project);
    return project.status === 'building' || state === 'PROJECT_BUILDING';
  }

  function recoverDevelopmentJobsOnStartup() {
    const projects = deps.readDb().projects.filter(projectLooksLikeBuilding);
    for (const project of projects) {
      attemptJobRecovery(project, 'startup_recovery').catch(() => {});
    }
  }

  // Red de recuperacion continua: sin esto, un job que muere por algo que no
  // sea un rate-limit reconocido (ej. un error no manejado, una conexion que
  // agoto sus reintentos) queda colgado hasta el proximo restart manual del
  // backend -- exactamente lo que paso dos veces la noche del 25/9/2026 con
  // un proyecto real. `developmentJobs` (el Map en memoria) solo tiene una
  // entrada mientras la promesa de runDevelopmentJob sigue pendiente
  // (incluso durmiendo por un rate-limit largo) -- si un proyecto figura
  // "building" y NO esta en el Map, su ultimo intento ya termino sin haber
  // actualizado el estado real, sea porque exploto o porque el proceso se
  // reinicio a mitad de camino.
  function startStuckJobSupervisor(intervalMs: number = STUCK_JOB_CHECK_INTERVAL_MS) {
    return setInterval(() => {
      const stuckProjects = deps.readDb().projects.filter(project =>
        projectLooksLikeBuilding(project) && !developmentJobs.has(project.id)
      );
      for (const project of stuckProjects) {
        attemptJobRecovery(project, 'supervisor_recovery').catch(() => {});
      }
    }, intervalMs);
  }

  return {
    recoverDevelopmentJobsOnStartup,
    startDevelopmentJob,
    startStuckJobSupervisor
  };
}
