import fs from 'fs';
import path from 'path';
import type { HostRuntime } from '../host-runtimes/HostRuntime';
import type { StoredProject } from '../types/domain';
import { isDeleteSuccessContract } from '../utils/contracts';
import { workspaceUserId } from '../utils/names';
import { env, bridgeHeaders } from '../config/env';

type HostTurnEvent = {
  projectId?: string | null;
  userId?: string | null;
  sessionId?: string | null;
  eventType: string;
  payload?: any;
};

type ProjectDeletionDeps = {
  hostRuntime: HostRuntime;
  recordHostTurnEvent: (event: HostTurnEvent) => void;
};

function extractHostText(rawBody: string) {
  try {
    const parsed = JSON.parse(rawBody) as { text?: string; response?: string; message?: string };
    return String(parsed.text || parsed.response || parsed.message || '').trim();
  } catch {
    return String(rawBody || '').trim();
  }
}

// El backend corre dentro de Docker y no tiene ni el CLI de Docker ni el
// socket para bajar contenedores el mismo -- por eso esto le delega el
// trabajo a docker-teardown-adapter.js (bridge/src/), un proceso host-side,
// mismo molde que claude-bridge.js/codex-bridge.js: no hace nada hasta que
// recibe esta peticion puntual, y valida el path que le llega antes de tocar
// Docker. Este proyecto le pasa la ruta ya traducida a como se ve DESDE EL
// HOST -- project.project_path es la ruta de adentro del contenedor
// (BAWE_PROJECTS_ROOT), nunca una ruta real en el filesystem del host.
function toHostProjectPath(projectPath: string): string | null {
  const hostRoot = env.dockerTeardown.hostProjectsRoot;
  if (!hostRoot) return null;
  const rel = path.relative(env.projectsRoot, projectPath);
  if (rel.startsWith('..')) return null;
  const sep = hostRoot.includes('\\') ? '\\' : '/';
  return hostRoot.replace(/[\\/]+$/, '') + sep + rel.split(path.sep).join(sep);
}

// Se corre ANTES de pedirle a Motor que borre la carpeta: el compose file
// vive adentro de [PROJECT_ROOT], asi que una vez que esa carpeta desaparece
// ya no hay forma de identificar que contenedores le pertenecian al proyecto.
// Si "down" no logra dejar todo abajo, se corta ahi (no se borra la carpeta)
// en vez de dejar un contenedor huerfano sin ningun compose file para poder
// limpiarlo despues.
async function teardownProjectContainers(project: StoredProject, deps: ProjectDeletionDeps, sessionId: string) {
  const hostProjectPath = toHostProjectPath(project.project_path);
  if (!hostProjectPath) {
    deps.recordHostTurnEvent({
      projectId: project.id,
      userId: project.userId,
      sessionId,
      eventType: 'delete.containers_skip_no_host_path',
      payload: { projectPath: project.project_path }
    });
    return;
  }

  let response: Response;
  try {
    response = await fetch(env.dockerTeardown.url, {
      method: 'POST',
      headers: bridgeHeaders({ 'content-type': 'application/json' }),
      body: JSON.stringify({ projectPath: hostProjectPath })
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    deps.recordHostTurnEvent({
      projectId: project.id,
      userId: project.userId,
      sessionId,
      eventType: 'delete.containers_teardown_failed',
      payload: { hostProjectPath, error: message }
    });
    throw new Error(`No se pudo contactar al adaptador de Docker: ${message}`);
  }

  const result = await response.json() as { ok: boolean; composeFile?: string; skipped?: boolean; error?: string; remaining?: string[] };
  if (!result.ok) {
    deps.recordHostTurnEvent({
      projectId: project.id,
      userId: project.userId,
      sessionId,
      eventType: 'delete.containers_teardown_failed',
      payload: { hostProjectPath, ...result }
    });
    throw new Error(result.error || 'El adaptador de Docker rechazo el teardown.');
  }
  if (result.skipped) {
    deps.recordHostTurnEvent({
      projectId: project.id,
      userId: project.userId,
      sessionId,
      eventType: 'delete.containers_skip_no_compose_file',
      payload: { hostProjectPath }
    });
    return;
  }
  deps.recordHostTurnEvent({
    projectId: project.id,
    userId: project.userId,
    sessionId,
    eventType: 'delete.containers_down',
    payload: { hostProjectPath, composeFile: result.composeFile }
  });
}

export function createProjectDeletionService(deps: ProjectDeletionDeps) {
  async function sendMotorDeleteCommand(project: StoredProject) {
    const sessionId = `delete_${project.id}_${Date.now()}`;
    const folderName = path.basename(project.project_path);
    const message = `eliminar ${workspaceUserId(project.userId)} ${folderName}`;
    deps.recordHostTurnEvent({
      projectId: project.id,
      userId: project.userId,
      sessionId,
      eventType: 'delete.request',
      payload: { message, projectName: project.project_name, projectPath: project.project_path }
    });

    await teardownProjectContainers(project, deps, sessionId);

    const result = await deps.hostRuntime.deleteProject(
      project,
      sessionId,
      workspaceUserId(project.userId),
      folderName
    );
    deps.recordHostTurnEvent({
      projectId: project.id,
      userId: project.userId,
      sessionId,
      eventType: 'delete.accepted',
      payload: { status: result.statusCode, response: result.bodyText.slice(0, 1000) }
    });
    const responseText = extractHostText(result.bodyText);
    if (!isDeleteSuccessContract(responseText)) {
      deps.recordHostTurnEvent({
        projectId: project.id,
        userId: project.userId,
        sessionId,
        eventType: 'delete.contract_rejected',
        payload: { responseText, raw: result.bodyText.slice(0, 1000) }
      });
      throw new Error(`Contrato de eliminacion no confirmado: ${responseText || '(sin texto)'}`);
    }
    if (fs.existsSync(project.project_path)) {
      deps.recordHostTurnEvent({
        projectId: project.id,
        userId: project.userId,
        sessionId,
        eventType: 'delete.filesystem_still_exists',
        payload: { projectPath: project.project_path, responseText }
      });
      throw new Error('El motor confirmo eliminacion pero el directorio del proyecto sigue existiendo.');
    }
    deps.recordHostTurnEvent({
      projectId: project.id,
      userId: project.userId,
      sessionId,
      eventType: 'delete.confirmed',
      payload: { responseText, projectPath: project.project_path }
    });
    return responseText;
  }

  return { sendMotorDeleteCommand };
}
