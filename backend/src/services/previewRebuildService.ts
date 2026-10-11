import type { StoredProject } from '../types/domain';
import { env, bridgeHeaders } from '../config/env';
import { toHostProjectPath } from './projectDeletionService';

type HostTurnEvent = {
  projectId?: string | null;
  userId?: string | null;
  sessionId?: string | null;
  eventType: string;
  payload?: any;
};

type PreviewRebuildDeps = {
  recordHostTurnEvent: (event: HostTurnEvent) => void;
};

// Tras una edicion el motor deja el codigo y el paquete de entrega al dia,
// pero el preview (contenedores de la VPS) sigue con el build viejo. El backend
// corre dentro de Docker, asi que se lo pide al adaptador del host (mismo que
// usa el borrado). Nunca corta el flujo: si falla, queda el evento y el aviso
// de edicion sale igual.
export function createPreviewRebuildService(deps: PreviewRebuildDeps) {
  async function rebuildPreview(args: { project: StoredProject; userId: string; sessionId?: string | null }) {
    const { project, userId, sessionId } = args;
    const hostProjectPath = toHostProjectPath(project.project_path);
    const base = { projectId: project.id, userId, sessionId: sessionId || null };
    if (!hostProjectPath) {
      deps.recordHostTurnEvent({ ...base, eventType: 'edit.preview_rebuild_skip_no_host_path', payload: { projectPath: project.project_path } });
      return;
    }
    try {
      const response = await fetch(env.dockerTeardown.rebuildUrl, {
        method: 'POST',
        headers: bridgeHeaders({ 'content-type': 'application/json' }),
        body: JSON.stringify({ projectPath: hostProjectPath })
      });
      const result = await response.json() as { ok: boolean; skipped?: boolean; reason?: string; error?: string };
      if (!result.ok) {
        deps.recordHostTurnEvent({ ...base, eventType: 'edit.preview_rebuild_failed', payload: { hostProjectPath, error: result.error } });
        return;
      }
      deps.recordHostTurnEvent({
        ...base,
        eventType: result.skipped ? 'edit.preview_rebuild_skipped' : 'edit.preview_rebuilt',
        payload: { hostProjectPath, reason: result.reason || null }
      });
    } catch (err) {
      deps.recordHostTurnEvent({
        ...base,
        eventType: 'edit.preview_rebuild_failed',
        payload: { hostProjectPath, error: err instanceof Error ? err.message : String(err) }
      });
    }
  }

  return { rebuildPreview };
}
