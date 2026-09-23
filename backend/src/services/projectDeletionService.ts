import fs from 'fs';
import path from 'path';
import type { HostRuntime } from '../host-runtimes/HostRuntime';
import type { StoredProject } from '../types/domain';
import { isDeleteSuccessContract } from '../utils/contracts';
import { workspaceUserId } from '../utils/names';

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
