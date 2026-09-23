import express from 'express';
import http from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import path from 'path';
import { HostManager } from './managers/HostManager';
import { debugPanel } from './utils/debugPanel';
import {
  normalizeProjectName,
  workspaceUserId
} from './utils/names';
import { publicProjectDownloadUrl } from './utils/projectFiles';
import { createHostRuntime } from './host-runtimes/HostRuntimeFactory';
import { createAuth } from './auth/auth';
import { createChatHistoryService } from './services/chatHistoryService';
import { createDeliveryFieldsService, requireDeliveryInfo } from './services/deliveryService';
import { createDevelopmentJobService } from './services/developmentJobService';
import { createEditJobService } from './services/editJobService';
import { createExecutionStateService } from './services/executionStateService';
import { createLiveProjectUpdatesService } from './services/liveProjectUpdatesService';
import { createProjectDeletionService } from './services/projectDeletionService';
import { createProjectRegistryService } from './services/projectRegistryService';
import { createProjectStateService } from './services/projectStateService';
import { createProjectViewService } from './services/projectViewService';
import { createMysqlStore } from './store/mysqlStore';
import { buildWebContinuationCommand, buildWebEditCommand } from './routers/web/webCommands';
import { registerWebHttpRoutes } from './routers/web/httpRoutes';
import { registerWebSocketFlow } from './routers/web/webSocketFlow';
import {
  INTERVIEW_COMPLETE_NOTICE,
  env
} from './config/env';
import type {
  StoredProject,
} from './types/domain';


const app = express();
app.disable('x-powered-by');
const server = http.createServer(app);
const io = new SocketIOServer(server, { cors: { origin: env.frontendOrigin } });

app.use(express.json());

const port = env.port;
const JWT_SECRET = env.jwtSecret;
const PROJECTS_ROOT = env.projectsRoot;
const DB_HOST = env.db.host;
const DB_PORT = env.db.port;
const DB_NAME = env.db.name;
const DB_USER = env.db.user;
const DB_PASS = env.db.pass;

const hostManager = new HostManager();
const hostRuntime = createHostRuntime({ projectsRoot: PROJECTS_ROOT });
debugPanel.setState('idle', 'Backend iniciando...');

const {
  deleteExecutionState,
  getExecutionRecord,
  getExecutionState,
  setExecutionState
} = createExecutionStateService({
  isActiveHostSession: sessionId => hostManager.getActiveSessionId() === sessionId
});

const {
  getProjectState,
  getProjectStateView,
  isProjectUnfinished,
  legacyStatusForState
} = createProjectStateService({ getExecutionState });

const {
  getActiveEditJobs,
  getHostJob,
  initMysqlStore,
  insertEditAttachment,
  readDb,
  recordHostTurnEvent,
  upsertHostJob,
  writeDb
} = createMysqlStore({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASS,
  database: DB_NAME
}, { workspaceUserId });

const {
  appendChatHistoryMessage,
  confirmPendingChatTurn,
  createChatHistory,
  findChatHistoryForProject,
  getConfirmedChatMessagesForProject,
  linkChatHistoryToProject,
  makeChatMessageId,
  setPendingAnswer,
  setPendingQuestion,
  updateChatHistorySession,
  updateChatHistoryTurn
} = createChatHistoryService({ readDb, writeDb });

const {
  deliveryFieldsForProject
} = createDeliveryFieldsService({ recordHostTurnEvent });

const {
  sendMotorDeleteCommand
} = createProjectDeletionService({ hostRuntime, recordHostTurnEvent });

function buildProjectPath(projectName: string, userId?: string) {
  const folderName = normalizeProjectName(projectName);
  return userId ? path.join(PROJECTS_ROOT, workspaceUserId(userId), folderName) : path.join(PROJECTS_ROOT, folderName);
}

function moveProjectToDevelopment(args: {
  project: StoredProject;
  userId: string;
  historyId?: string | null;
  sessionId?: string | null;
  socket?: Socket | null;
  reason: string;
}) {
  const historyId = args.historyId || args.project.chat_history_id || null;
  confirmPendingChatTurn(historyId, args.userId);
  updateChatHistoryTurn(historyId, args.userId, { pending_question: null, pending_answer: null });

  const updatedHistory = historyId ? readDb().chatHistories.find(h => h.id === historyId && h.userId === args.userId) : null;
  const lastMessage = updatedHistory?.messages?.[updatedHistory.messages.length - 1];
  if (lastMessage?.sender !== 'agent' || lastMessage.text !== INTERVIEW_COMPLETE_NOTICE) {
    appendChatHistoryMessage(historyId, args.userId, 'agent', INTERVIEW_COMPLETE_NOTICE, { event_type: 'interview_complete' });
  }

  const updatedProject = updateProject(args.project.id, args.userId, { status: 'building' }) || args.project;
  if (args.sessionId) {
    setExecutionState(updatedProject.id, args.userId, args.sessionId, 'IDLE', args.socket?.id);
    updateChatHistorySession(historyId, args.userId, null);
  }
  recordHostTurnEvent({
    projectId: updatedProject.id,
    userId: args.userId,
    sessionId: args.sessionId || null,
    eventType: 'contract.partial.accepted',
    payload: { reason: args.reason }
  });

  if (args.socket) {
    args.socket.emit('host:pending', { pending: false });
    args.socket.emit('project:updated', publicProject(updatedProject));
    args.socket.emit('agent-event', {
      type: 'interview_complete',
      text: INTERVIEW_COMPLETE_NOTICE,
      recovered: args.reason !== 'partial_contract',
      projectId: updatedProject.id,
      project: publicProject(updatedProject)
    });
  }

  startDevelopmentJob(updatedProject.id, args.userId, args.reason);
  return updatedProject;
}

async function finalizeProjectDelivery(args: {
  project: StoredProject;
  userId: string;
  sessionId?: string | null;
  socket?: Socket | null;
  source: string;
}) {
  try {
    const delivery = requireDeliveryInfo(args.project);
    const updatedProject = updateProject(args.project.id, args.userId, {
      status: 'ready',
      previewUrl: delivery.previewUrl,
      zipUrl: publicProjectDownloadUrl(args.project.id)
    }) || args.project;

    updateChatHistoryTurn(updatedProject.chat_history_id || null, args.userId, {
      pending_question: null,
      pending_answer: null
    });
    recordHostTurnEvent({
      projectId: updatedProject.id,
      userId: args.userId,
      sessionId: args.sessionId || null,
      eventType: 'delivery.ready',
      payload: {
        source: args.source,
        previewUrl: delivery.previewUrl,
        zipPath: delivery.zipPathRelative,
        zipEncrypted: delivery.zipEncrypted
      }
    });

    if (args.socket) {
      args.socket.emit('host:pending', { pending: false });
      args.socket.emit('project:updated', publicProject(updatedProject));
      args.socket.emit('agent-event', {
        type: 'project_finalized',
        text: 'Finalizado.',
        projectId: updatedProject.id,
        project: publicProject(updatedProject)
      });
    }
    return updatedProject;
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    recordHostTurnEvent({
      projectId: args.project.id,
      userId: args.userId,
      sessionId: args.sessionId || null,
      eventType: 'delivery.validation_failed',
      payload: { source: args.source, error }
    });
    return null;
  }
}

// A diferencia de finalizeProjectDelivery, no cambia project.status (se
// queda en 'ready' todo el tiempo, ver plan de edicion post-entrega) ni
// regenera el paquete de entrega — edit-product-development ya lo refresco
// del lado del motor antes de emitir "Edición finalizada.". Esto solo avisa:
// via la room del usuario (por si tiene una pestaña abierta) y via el evento
// de auditoria.
async function notifyEditFinished(args: { project: StoredProject; userId: string; sessionId?: string | null }) {
  recordHostTurnEvent({
    projectId: args.project.id,
    userId: args.userId,
    sessionId: args.sessionId || null,
    eventType: 'edit.notify_finished',
    payload: {}
  });
  io.to(args.userId).emit('edit-event', {
    type: 'edit_finished',
    projectId: args.project.id,
    text: 'Tu edición fue aplicada. Los cambios ya están disponibles en "Proyectos" -> "Preview".'
  });
  io.to(args.userId).emit('project:updated', publicProject(args.project));
}

function closeInterviewFromFilesystem(project: StoredProject, userId: string) {
  const reconciled = reconcileProjectStatus(project);
  if (getProjectState(reconciled) !== 'PROJECT_BUILDING') return reconciled;
  return moveProjectToDevelopment({
    project: reconciled,
    userId,
    historyId: reconciled.chat_history_id,
    reason: 'filesystem_context'
  });
}

const activeProjects = new Map();
const chatMessages: any = {};

const {
  hasActiveHostSessionForProject,
  publicProject
} = createProjectViewService({
  chatMessages,
  deliveryFieldsForProject,
  findChatHistoryForProject,
  getActiveHostSessionId: () => hostManager.getActiveSessionId(),
  getConfirmedChatMessagesForProject,
  getExecutionRecord,
  getProjectStateView,
  legacyStatusForState
});

const {
  emitProjectUpdate,
  saveChatMessage
} = createLiveProjectUpdatesService({
  chatMessages,
  makeChatMessageId,
  publicProject,
  readDb
});

const {
  createProjectRecord,
  deleteProjectRecord,
  findCommittedMotorProject,
  findProjectNameConflict,
  findUnfinishedProjectForUser,
  reconcileProjectStatus,
  suggestProjectName,
  updateProject
} = createProjectRegistryService({
  readDb,
  writeDb,
  buildProjectPath,
  getProjectState,
  isProjectUnfinished,
  legacyStatusForState,
  onProjectDeleted: projectId => {
    delete chatMessages[projectId];
    deleteExecutionState(projectId);
    activeProjects.delete(projectId);
  }
});

const {
  recoverDevelopmentJobsOnStartup,
  startDevelopmentJob
} = createDevelopmentJobService({
  buildContinuationCommand: buildWebContinuationCommand,
  finalizeProjectDelivery,
  getHostJob,
  getProjectState,
  hostBackgroundMaxAttempts: env.hostBackgroundMaxAttempts,
  hostRuntime,
  readDb,
  recordHostTurnEvent,
  upsertHostJob
});

const {
  recoverEditJobsOnStartup,
  startEditJob
} = createEditJobService({
  buildEditCommand: buildWebEditCommand,
  getActiveEditJobs,
  getHostJob,
  hostBackgroundMaxAttempts: env.hostBackgroundMaxAttempts,
  hostRuntime,
  notifyEditFinished,
  readDb,
  recordHostTurnEvent,
  upsertHostJob
});

const {
  authMiddleware,
  fileAuthMiddleware,
  findUser,
  findUserById,
  publicUser,
  signToken,
  userFromJwtToken
} = createAuth({ jwtSecret: JWT_SECRET, readDb, workspaceUserId });

registerWebHttpRoutes(app, {
  appendChatHistoryMessage,
  authMiddleware,
  chatMessages,
  closeInterviewFromFilesystem,
  createProjectRecord,
  deleteProjectRecord,
  fileAuthMiddleware,
  finalizeProjectDelivery,
  findChatHistoryForProject,
  findUnfinishedProjectForUser,
  findUser,
  findUserById,
  getConfirmedChatMessagesForProject,
  getExecutionRecord,
  getExecutionState,
  getProjectStateView,
  hasActiveHostSessionForProject,
  insertEditAttachment,
  publicProject,
  publicUser,
  readDb,
  reconcileProjectStatus,
  recordHostTurnEvent,
  sendMotorDeleteCommand,
  signToken,
  updateProject,
  writeDb
});

registerWebSocketFlow(io, {
  activeProjects,
  appendChatHistoryMessage,
  confirmPendingChatTurn,
  createChatHistory,
  createProjectRecord,
  emitProjectUpdate,
  finalizeProjectDelivery,
  findCommittedMotorProject,
  findProjectNameConflict,
  findUnfinishedProjectForUser,
  getExecutionRecord,
  getExecutionState,
  getHostJob,
  hostManager,
  linkChatHistoryToProject,
  moveProjectToDevelopment,
  publicProject,
  readDb,
  reconcileProjectStatus,
  recordHostTurnEvent,
  saveChatMessage,
  setExecutionState,
  setPendingAnswer,
  setPendingQuestion,
  startEditJob,
  suggestProjectName,
  updateChatHistorySession,
  updateChatHistoryTurn,
  updateProject,
  upsertHostJob,
  userFromJwtToken
});

initMysqlStore()
  .then(() => {
    console.log(`[DB] MySQL store listo: ${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}`);
    recoverDevelopmentJobsOnStartup();
    recoverEditJobsOnStartup();
    server.listen(port, () => console.log(`BaweStudio backend listening on port ${port}`));
  })
  .catch(err => {
    console.error(`[DB] No se pudo iniciar MySQL store: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  });
