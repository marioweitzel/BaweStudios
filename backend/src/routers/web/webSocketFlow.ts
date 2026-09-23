import fs from 'fs';
import path from 'path';
import { Server as SocketIOServer, Socket } from 'socket.io';
import {
  EDIT_RESPONSE_END,
  EDIT_RESPONSE_START,
  INTERVIEW_COMPLETE_NOTICE,
  RESUME_CONTINUE_NOTICE,
  SUPPORT_RESPONSE_END,
  SUPPORT_RESPONSE_START
} from '../../config/env';
import type {
  DbShape,
  ExecutionState,
  HostJobStatus,
  StoredChatAttachment,
  StoredChatHistory,
  StoredChatMessage,
  StoredProject,
  StoredUser
} from '../../types/domain';
import { authenticateSocket, type AuthenticatedSocketUser } from '../../auth/socketAuth';
import type { HostManager } from '../../managers/HostManager';
import type { ExecutionRecord } from '../../services/executionStateService';
import { debugPanel } from '../../utils/debugPanel';
import { isFinalContract, isInvalidCommandResponse, isPartialContract } from '../../utils/contracts';
import { clientSafeHostError } from '../../utils/hostErrors';
import { makeSafeName, normalizeProjectName } from '../../utils/names';
import { detectPendingMotorQueueWork } from '../../utils/projectFiles';
import { normalizeProjectFamily } from '../projectFamilies';
import {
  appendEditAttachmentToPrompt,
  appendWebAttachmentToPrompt,
  buildWebContinuationCommand,
  buildWebEditCommand,
  buildWebStartCommand,
  buildWebSupportCommand
} from './webCommands';

type ChatSender = 'user' | 'agent' | 'system';

type ChatMessageOptions = {
  visible?: boolean;
  event_type?: string;
  attachment?: StoredChatAttachment;
};

type HostTurnEvent = {
  projectId?: string | null;
  userId?: string | null;
  sessionId?: string | null;
  eventType: string;
  payload?: Record<string, unknown>;
};

type HostJobEvent = {
  projectId: string;
  userId: string;
  sessionId?: string | null;
  status: HostJobStatus;
  command?: string | null;
  response?: string | null;
  error?: string | null;
  attempts?: number;
  finished?: boolean;
};

type CommittedMotorProject = {
  projectName: string;
  projectPath: string;
  logPath: string;
};

type PublicProjectView = Record<string, unknown>;

type LiveChatMessage = {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
};

type ActiveProjectRuntime = {
  socket: Socket;
  directory: string;
  sessionId: string | null;
  watcher: { close: () => void } | null;
  safeName: string;
  userId: string;
};

type WebSocketFlowDeps = {
  activeProjects: Map<string, ActiveProjectRuntime>;
  appendChatHistoryMessage: (
    historyId: string | null,
    userId: string | null | undefined,
    sender: ChatSender,
    text: string,
    options?: ChatMessageOptions
  ) => StoredChatMessage | null;
  confirmPendingChatTurn: (historyId: string | null, userId: string | null | undefined) => StoredChatHistory | null;
  createChatHistory: (userId: string, hostSessionId: string | null) => StoredChatHistory;
  createProjectRecord: (userId: string, projectName: string, extra?: Partial<StoredProject>) => StoredProject;
  emitProjectUpdate: (socket: Socket, projectId: string | null, userId: string | null | undefined) => void;
  finalizeProjectDelivery: (args: {
    project: StoredProject;
    userId: string;
    sessionId?: string | null;
    socket?: Socket | null;
    source: string;
  }) => Promise<StoredProject | null>;
  findCommittedMotorProject: (
    userId: string,
    projectName: string,
    options?: { answerText?: string | null; minMtimeMs?: number | null }
  ) => CommittedMotorProject | null;
  findProjectNameConflict: (userId: string, projectName: string) => StoredProject | null;
  findUnfinishedProjectForUser: (userId: string, exceptProjectId?: string | null) => StoredProject | null;
  getExecutionRecord: (projectId: string | null | undefined) => ExecutionRecord | null;
  getExecutionState: (projectId: string) => ExecutionState;
  getHostJob: (projectId: string) => Promise<{ status: string } | null>;
  hostManager: HostManager;
  linkChatHistoryToProject: (historyId: string | null, userId: string, project: StoredProject) => void;
  moveProjectToDevelopment: (args: {
    project: StoredProject;
    userId: string;
    historyId?: string | null;
    sessionId?: string | null;
    socket?: Socket | null;
    reason: string;
  }) => StoredProject;
  publicProject: (project: StoredProject) => PublicProjectView;
  readDb: () => DbShape;
  reconcileProjectStatus: (project: StoredProject) => StoredProject;
  recordHostTurnEvent: (event: HostTurnEvent) => void;
  saveChatMessage: (projectId: string, sender: 'user' | 'agent', text: string) => LiveChatMessage;
  setExecutionState: (
    projectId: string | null,
    userId: string | null | undefined,
    sessionId: string | null,
    state: ExecutionState,
    socketId?: string
  ) => void;
  setPendingAnswer: (
    historyId: string | null,
    userId: string | null | undefined,
    text: string,
    attachment?: StoredChatAttachment
  ) => StoredChatHistory | null;
  setPendingQuestion: (historyId: string | null, userId: string | null | undefined, text: string) => StoredChatHistory | null;
  startEditJob: (projectId: string, userId: string, reason: string) => void;
  suggestProjectName: (userId: string, projectName: string) => string;
  updateChatHistorySession: (
    historyId: string | null,
    userId: string | null | undefined,
    hostSessionId: string | null
  ) => StoredChatHistory | null;
  updateChatHistoryTurn: (
    historyId: string | null,
    userId: string | null | undefined,
    patch: Partial<Pick<StoredChatHistory, 'pending_question' | 'pending_answer'>>
  ) => StoredChatHistory | null;
  updateProject: (projectId: string, userId: string, patch: Partial<StoredProject>) => StoredProject | null;
  upsertHostJob: (event: HostJobEvent) => Promise<void>;
  userFromJwtToken: (token: string) => StoredUser | null;
};

export function registerWebSocketFlow(io: SocketIOServer, deps: WebSocketFlowDeps) {
  const {
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
  } = deps;
  io.on('connection', (socket: Socket) => {
    console.log(`[Socket] Cliente conectado: ${socket.id}`);
    const authenticatedSocketUser = authenticateSocket(socket, { userFromJwtToken });
    if (!authenticatedSocketUser) return;
    const socketUser: AuthenticatedSocketUser = authenticatedSocketUser;
    // Room propia por usuario: deja que trabajo en background (ej. el job de
    // "cambios", que no tiene un socket propio a mano) le avise en vivo a
    // cualquier pestaña abierta de ese usuario sin tener que rastrear sockets
    // a mano en otro lado.
    socket.join(socketUser.id);

    let activeSessionId: string | null = null;
    let activeSessionIsSupport = false;
    let activeSessionIsEdit = false;
    let safeProjectId: string | null = null;
    let activeChatHistoryId: string | null = null;
    let hostBusy = false;
    let pendingProjectNameCapture = false;
    let pendingProjectName: string | null = null;
    let pendingProjectNameAnswer: string | null = null;
    let pendingProjectNameSentAtMs: number | null = null;
    let answersReceived = 0;
    let cleanupHostListeners = () => {};
    const interviewCompleteNotice = INTERVIEW_COMPLETE_NOTICE;

// ── Helper: emitir mensaje del agente al frontend ──
  function currentProjectForSocket() {
    if (!safeProjectId || !socketUser?.id) return null;
    return readDb().projects.find(p => p.id === safeProjectId && p.userId === socketUser.id) || null;
  }

  // Marcadores a exigir en la respuesta segun el tipo de sesion activa (o
  // ninguno para la entrevista/desarrollo normal, que no usa marcadores).
  function activeSessionMarkers(): { start: string; end: string } | undefined {
    if (activeSessionIsEdit) return { start: EDIT_RESPONSE_START, end: EDIT_RESPONSE_END };
    if (activeSessionIsSupport) return { start: SUPPORT_RESPONSE_START, end: SUPPORT_RESPONSE_END };
    return undefined;
  }

  function buildOutgoingUserMessage(userMessage: string, attachment?: StoredChatAttachment) {
    return activeSessionIsEdit
      ? appendEditAttachmentToPrompt(userMessage, attachment)
      : appendWebAttachmentToPrompt(userMessage, attachment);
  }

  function clearSocketRuntimeState(projectId?: string | null) {
    cleanupHostListeners();
    hostBusy = false;
    activeSessionId = null;
    activeSessionIsSupport = false;
    activeSessionIsEdit = false;
    if (projectId) activeProjects.delete(projectId);
  }

  function clearStaleActiveSession(reason: string) {
    if (!activeSessionId) return;
    if (hostManager.getActiveSessionId() === activeSessionId) return;
    recordHostTurnEvent({
      projectId: safeProjectId,
      userId: socketUser?.id,
      sessionId: activeSessionId,
      eventType: 'session.stale_cleared',
      payload: { reason }
    });
    clearSocketRuntimeState(safeProjectId);
  }

  function projectHasContext(project: StoredProject | null) {
    return !!project && fs.existsSync(path.join(project.project_path, 'project-context.md'));
  }

  function appendUniqueAgentNotice(historyId: string | null, text: string) {
    if (!historyId || !socketUser?.id) return null;
    const history = readDb().chatHistories.find(h => h.id === historyId && h.userId === socketUser.id);
    const lastMessage = history?.messages?.[history.messages.length - 1];
    if (lastMessage?.sender === 'agent' && lastMessage.text === text) return lastMessage;
    return appendChatHistoryMessage(historyId, socketUser.id, 'agent', text, { event_type: 'interview_complete' });
  }

  function recoverCompletedInterview(reason: string) {
    const project = currentProjectForSocket();
    if (!projectHasContext(project)) return false;

    console.log(`[Socket] Recuperando cierre de entrevista (${reason}): project-context.md detectado en ${project?.project_path}`);
    hostBusy = false;
    moveProjectToDevelopment({
      project: project!,
      userId: socketUser.id,
      historyId: activeChatHistoryId || project?.chat_history_id || null,
      sessionId: activeSessionId,
      socket,
      reason
    });
    const sessionToClose = activeSessionId;
    clearSocketRuntimeState(project?.id || safeProjectId);
    if (sessionToClose && reason !== 'exit_host' && hostManager.getActiveSessionId() === sessionToClose) {
      void hostManager.stop(sessionToClose).catch((err: unknown) => {
        console.error(`[Socket] Error cerrando sesion tras cierre recuperado: ${err instanceof Error ? err.message : String(err)}`);
      });
    }
    return true;
  }

  function emitCodexQuestion(text: string) {
    if (recoverCompletedInterview('respuesta_codex')) return;
    recordHostTurnEvent({
      projectId: safeProjectId,
      userId: socketUser?.id,
      sessionId: activeSessionId,
      eventType: 'host.question',
      payload: { text: text.slice(0, 1000), chatHistoryId: activeChatHistoryId }
    });
    hostBusy = false;
    setExecutionState(safeProjectId, socketUser?.id, activeSessionId, 'IDLE', socket.id);
    console.log(`[BACKEND → FRONTEND] emitiendo agent-question: ${text}`);
    socket.emit('host:pending', { pending: false });
    confirmPendingChatTurn(activeChatHistoryId, socketUser?.id);
    setPendingQuestion(activeChatHistoryId, socketUser?.id, text);
    if (safeProjectId) saveChatMessage(safeProjectId, 'agent', text);
    emitProjectUpdate(socket, safeProjectId, socketUser?.id);
    socket.emit('agent-question', { question: text, chatHistoryId: activeChatHistoryId });
  }

  function emitAgentNotice(text: string) {
    hostBusy = false;
    setExecutionState(safeProjectId, socketUser?.id, activeSessionId, 'IDLE', socket.id);
    console.log(`[BACKEND -> FRONTEND] emitiendo aviso: ${text}`);
    socket.emit('host:pending', { pending: false });
    socket.emit('agent-question', { question: text, chatHistoryId: activeChatHistoryId });
  }

  function emitInvalidResumeCommandNotice(originalText: string) {
    recordHostTurnEvent({
      projectId: safeProjectId,
      userId: socketUser?.id,
      sessionId: activeSessionId,
      eventType: 'resume.invalid_command_from_motor',
      payload: {
        response: originalText.slice(0, 1000),
        chatHistoryId: activeChatHistoryId
      }
    });
    updateChatHistoryTurn(activeChatHistoryId, socketUser?.id, { pending_answer: null });
    hostBusy = false;
    setExecutionState(safeProjectId, socketUser?.id, activeSessionId, 'IDLE', socket.id);
    console.log(`[BACKEND -> FRONTEND] comando invalido interceptado; solicitando continuar`);
    socket.emit('host:pending', { pending: false });
    emitProjectUpdate(socket, safeProjectId, socketUser?.id);
    socket.emit('resume:invalid-command', {
      message: RESUME_CONTINUE_NOTICE,
      chatHistoryId: activeChatHistoryId
    });
  }

  function emitAgentError(text: string) {
    if (recoverCompletedInterview('error_host')) return;
    recordHostTurnEvent({
      projectId: safeProjectId,
      userId: socketUser?.id,
      sessionId: activeSessionId,
      eventType: 'host.error.visible',
      payload: { text: text.slice(0, 1000), chatHistoryId: activeChatHistoryId }
    });
    hostBusy = false;
    setExecutionState(safeProjectId, socketUser?.id, activeSessionId, 'IDLE', socket.id);
    console.log(`[BACKEND → FRONTEND] emitiendo agent-question (error): ${text}`);
    socket.emit('host:pending', { pending: false });
    appendChatHistoryMessage(activeChatHistoryId, socketUser?.id, 'agent', text);
    if (safeProjectId) saveChatMessage(safeProjectId, 'agent', text);
    emitProjectUpdate(socket, safeProjectId, socketUser?.id);
    socket.emit('agent-question', { question: text, chatHistoryId: activeChatHistoryId });
  }

  // ── Evento 'start-project': primera vez que el usuario escribe "comenzar" ──
  function confirmPendingProjectNameFromMotor() {
    if (!pendingProjectNameCapture || !pendingProjectName || !socketUser?.id) return null;
    const committed = findCommittedMotorProject(socketUser.id, pendingProjectName, {
      answerText: pendingProjectNameAnswer,
      minMtimeMs: pendingProjectNameSentAtMs
    });
    if (!committed) {
      emitAgentError('No pude confirmar la creacion del proyecto en el motor. Intenta nuevamente en unos segundos.');
      return null;
    }
    const projectName = committed.projectName;
    const projectPath = committed.projectPath;
    const project = safeProjectId
      ? updateProject(safeProjectId, socketUser.id, {
          name: projectName,
          project_name: projectName,
          project_path: projectPath,
          status: 'pending'
        })
      : createProjectRecord(socketUser.id, projectName, {
          project_path: projectPath,
          status: 'pending'
        });
    if (!project) return null;
    safeProjectId = project.id;
    linkChatHistoryToProject(activeChatHistoryId, socketUser.id, project);
    const linkedProject = readDb().projects.find(p => p.id === project.id && p.userId === socketUser.id) || project;
    const active = activeProjects.get(project.id);
    if (active) {
      active.directory = projectPath;
      active.safeName = makeSafeName(projectName);
    } else {
      activeProjects.set(project.id, {
        socket: socket,
        directory: projectPath,
        sessionId: activeSessionId,
        watcher: null,
        safeName: makeSafeName(projectName),
        userId: socketUser.id
      });
    }
    pendingProjectNameCapture = false;
    pendingProjectName = null;
    pendingProjectNameAnswer = null;
    pendingProjectNameSentAtMs = null;
    socket.emit('project:updated', publicProject(linkedProject));
    socket.emit('project-started', {
      projectId: linkedProject.id,
      project_id: linkedProject.project_id,
      project_name: linkedProject.project_name,
      project_path: linkedProject.project_path,
      chatHistoryId: activeChatHistoryId,
      chat_history_id: activeChatHistoryId,
      sessionId: activeSessionId,
      project: publicProject(linkedProject)
    });
    socket.emit('project-name-captured', {
      project_id: linkedProject.project_id,
      project_name: linkedProject.project_name,
      project_path: linkedProject.project_path,
      chat_history_id: activeChatHistoryId
    });
    return linkedProject;
  }

  function rejectDuplicateProjectNameIfNeeded(userMessage: string) {
    if (!pendingProjectNameCapture || !socketUser?.id) return false;
    const projectName = normalizeProjectName(userMessage);
    const conflict = findProjectNameConflict(socketUser.id, projectName);
    if (!conflict) return false;
    const suggestion = suggestProjectName(socketUser.id, projectName);
    appendChatHistoryMessage(activeChatHistoryId, socketUser.id, 'system', projectName, {
      visible: false,
      event_type: 'project_name_duplicate_rejected'
    });
    emitAgentNotice(`Ya tenés un proyecto llamado "${projectName}". Escribí otro nombre para este proyecto. Sugerencia: "${suggestion}".`);
    return true;
  }

  async function beginProject(data: any) {
    activeSessionIsSupport = false;
    activeSessionIsEdit = false;
    const userMessage = data.initialMessage || 'comenzar';
    const normalizedMessage = userMessage.trim().toLowerCase();
    let projectFamily = 'web';
    try {
      projectFamily = normalizeProjectFamily(data.projectFamily || data.project_family);
    } catch {
      socket.emit('error', { message: 'Ese tipo de proyecto todavia no esta disponible.' });
      return;
    }
    console.log(`[Socket] start-project recibido: mensaje="${userMessage}"`);
    clearStaleActiveSession('begin_project');

    if (activeSessionId) {
      if (normalizedMessage === 'comenzar' && socketUser?.id) {
        const unfinished = findUnfinishedProjectForUser(socketUser.id);
        if (unfinished) {
          socket.emit('new-project-blocked', {
            message: 'Tenes un proyecto sin terminar.\n\nPodes volver a ese proyecto para descargar el hilo antes de eliminarlo si ya no lo necesitas. Para crear un proyecto nuevo, primero tenes que finalizar o eliminar el proyecto actual.',
            project: publicProject(reconcileProjectStatus(unfinished))
          });
        }
      }
      console.warn(`[Socket] Ya hay una sesión activa (${activeSessionId}), ignorando start-project`);
      return;
    }

    try {
      // 1. Generar sessionId y projectId únicos
      if (!socketUser?.id) {
        socket.emit('error', { message: 'Debés iniciar sesión antes de crear proyectos.' });
        return;
      }

      const sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      activeSessionId = sessionId;
      const existingProjectId = data.projectId || data.project_id || null;
      const existingProject = existingProjectId
        ? readDb().projects.find(p => p.id === existingProjectId && p.userId === socketUser.id)
        : null;
      if (!existingProject && normalizedMessage === 'comenzar') {
        const unfinished = findUnfinishedProjectForUser(socketUser.id);
        if (unfinished) {
          socket.emit('new-project-blocked', {
            message: 'Tenes un proyecto sin terminar.\n\nPodes volver a ese proyecto para descargar el hilo antes de eliminarlo si ya no lo necesitas. Para crear un proyecto nuevo, primero tenes que finalizar o eliminar el proyecto actual.',
            project: publicProject(reconcileProjectStatus(unfinished))
          });
          activeSessionId = null;
          return;
        }
      }
      if (existingProjectId && !existingProject) {
        emitAgentError('No encontramos ese proyecto en tu cuenta. Selecciona un proyecto de tu historial.');
        activeSessionId = null;
        return;
      }
      if (!existingProject && normalizedMessage === 'continuar') {
        emitAgentError('Selecciona un proyecto de tu historial para continuar.');
        activeSessionId = null;
        return;
      }
      if (!existingProject && normalizedMessage !== 'comenzar') {
        emitAgentError('Para iniciar una entrevista nueva, escribi "comenzar".');
        activeSessionId = null;
        return;
      }
      if (existingProject && ['RUNNING', 'STOPPING'].includes(getExecutionState(existingProject.id))) {
        socket.emit('host:pending', { pending: true });
        emitProjectUpdate(socket, existingProject.id, socketUser.id);
        return;
      }
      safeProjectId = existingProject?.id || null;
      activeChatHistoryId = existingProject?.chat_history_id || null;
      if (!existingProject) {
        activeChatHistoryId = createChatHistory(socketUser.id, sessionId).id;
      } else {
        updateChatHistorySession(activeChatHistoryId, socketUser.id, sessionId);
      }
      pendingProjectNameCapture = !existingProject;
      answersReceived = 0;

      debugPanel.reset();
      debugPanel.setSessionId(sessionId);
      debugPanel.setState('starting', `Iniciando con mensaje: ${userMessage}`);
      recordHostTurnEvent({
        projectId: safeProjectId,
        userId: socketUser.id,
        sessionId,
        eventType: existingProject ? 'session.resume' : 'session.start',
        payload: { message: userMessage, projectId: safeProjectId, chatHistoryId: activeChatHistoryId, projectFamily }
      });

      const activeProject = existingProject || null;
      console.log(`[Socket] Proyecto activo: ${activeProject ? activeProject.project_path : '(pendiente de A1)'}`);
      if (safeProjectId) saveChatMessage(safeProjectId, 'user', userMessage);

      if (activeProject && safeProjectId) {
        activeProjects.set(safeProjectId, {
          socket: socket,
          directory: activeProject.project_path,
          sessionId: sessionId,
          watcher: null,
          safeName: makeSafeName(activeProject.project_name),
          userId: socketUser.id
        });
        setExecutionState(safeProjectId, socketUser.id, sessionId, 'RUNNING', socket.id);
      }

      // 4. Configurar listeners del HostManager
      cleanupHostListeners();
      const currentSessionId = sessionId;
      const messageHandler = async (evData: any) => {
        const { sessionId: msgSessionId, message } = evData;
        if (msgSessionId !== currentSessionId) return;

        console.log(`[BACKEND → FRONTEND] emitiendo: ${JSON.stringify(message)}`);

        recordHostTurnEvent({
          projectId: safeProjectId,
          userId: socketUser?.id,
          sessionId: activeSessionId,
          eventType: `host.message.${message.type || 'unknown'}`,
          payload: { message }
        });

        if (message.type === 'question') {
          if (isInvalidCommandResponse(message.text)) {
            emitInvalidResumeCommandNotice(message.text || '');
            return;
          }
          if (isPartialContract(message.text)) {
            const project = currentProjectForSocket();
            if (project && socketUser?.id) {
              hostBusy = false;
              moveProjectToDevelopment({
                project,
                userId: socketUser.id,
                historyId: activeChatHistoryId || project.chat_history_id || null,
                sessionId: activeSessionId,
                socket,
                reason: 'partial_contract'
              });
              const sessionToClose = activeSessionId;
              clearSocketRuntimeState(project.id);
              if (sessionToClose && hostManager.getActiveSessionId() === sessionToClose) {
                void hostManager.stop(sessionToClose).catch((err: unknown) => {
                  console.error(`[Socket] Error cerrando sesion tras contrato parcial: ${err instanceof Error ? err.message : String(err)}`);
                });
              }
              return;
            }
          }
          if (isFinalContract(message.text)) {
            const project = currentProjectForSocket();
            if (project && socketUser?.id) {
              hostBusy = false;
              const sessionToClose = activeSessionId;
              setExecutionState(safeProjectId, socketUser.id, activeSessionId, 'IDLE', socket.id);
              await upsertHostJob({
                projectId: project.id,
                userId: socketUser.id,
                sessionId: activeSessionId,
                status: 'final_contract_received',
                response: message.text,
                finished: true
              });
              const finalizedProject = await finalizeProjectDelivery({
                project,
                userId: socketUser.id,
                sessionId: activeSessionId,
                socket,
                source: 'socket_final_contract'
              });
              await upsertHostJob({
                projectId: project.id,
                userId: socketUser.id,
                sessionId: activeSessionId,
                status: finalizedProject ? 'delivery_ready' : 'delivery_failed',
                response: message.text,
                error: finalizedProject ? null : 'Validacion de entrega fallida',
                finished: true
              });
              activeSessionId = null;
              cleanupHostListeners();
              if (sessionToClose && hostManager.getActiveSessionId() === sessionToClose) {
                void hostManager.stop(sessionToClose).catch((err: unknown) => {
                  console.error(`[Socket] Error cerrando sesion tras contrato final: ${err instanceof Error ? err.message : String(err)}`);
                });
              }
            }
            return;
          }
          debugPanel.setCurrentQuestion(message.id);
          debugPanel.setState('waiting_for_user', `pregunta: ${message.id}`);
          if (pendingProjectNameCapture && pendingProjectName && message.id !== 'A1') {
            const confirmedProject = confirmPendingProjectNameFromMotor();
            if (!confirmedProject) return;
          }
          pendingProjectNameCapture = message.id === 'A1' || pendingProjectNameCapture;
          emitCodexQuestion(message.text);
        } else if (message.type === 'progress') {
          debugPanel.setState('processing', `fase: ${message.phase}`);
          setExecutionState(safeProjectId, socketUser?.id, activeSessionId, 'RUNNING', socket.id);
          socket.emit('host:pending', { pending: true });
          emitProjectUpdate(socket, safeProjectId, socketUser?.id);
          socket.emit('progress:update', {
            step: message.phase,
            percent: 50,
            message: message.text
          });
        } else if (message.type === 'interview_summary') {
          const totalAnswers = Object.keys(message.answers || {}).length;
          debugPanel.setAnswersCount(totalAnswers);
          console.log(`[Socket] interview_summary: ${JSON.stringify(message.answers)}`);
          socket.emit('project:updated', { answers: message.answers });
        } else if (message.type === 'interview_complete') {
          debugPanel.setState('interview_done', `respuestas: ${answersReceived} / 5`);
          if (!recoverCompletedInterview('interview_complete')) {
            hostBusy = false;
            setExecutionState(safeProjectId, socketUser?.id, activeSessionId, 'IDLE', socket.id);
            socket.emit('host:pending', { pending: false });
            socket.emit('agent-event', { ...message, text: message.text || interviewCompleteNotice });
            if (safeProjectId && socketUser?.id) {
              confirmPendingChatTurn(activeChatHistoryId, socketUser.id);
              updateChatHistoryTurn(activeChatHistoryId, socketUser.id, { pending_question: null, pending_answer: null });
              appendUniqueAgentNotice(activeChatHistoryId, message.text || interviewCompleteNotice);
              const project = updateProject(safeProjectId, socketUser.id, { status: 'building' });
              if (project) socket.emit('project:updated', publicProject(project));
            }
          }
        } else if (message.type === 'error') {
          emitAgentError(message.text);
        }
      };

      const errorHandler = (evData: any) => {
        const { sessionId: msgSessionId, error } = evData;
        if (msgSessionId !== activeSessionId) return;
        console.error(`[HostManager ERROR] ${error.message}`);
        recordHostTurnEvent({
          projectId: safeProjectId,
          userId: socketUser?.id,
          sessionId: activeSessionId,
          eventType: 'host.error',
          payload: { message: error.message }
        });
        emitAgentError(clientSafeHostError(error));
      };

      const exitHandler = (evData: any) => {
        const { sessionId: msgSessionId, code } = evData;
        if (msgSessionId !== activeSessionId) return;
        console.log(`[Socket] Sesión terminada: code ${code}`);
        recordHostTurnEvent({
          projectId: safeProjectId,
          userId: socketUser?.id,
          sessionId: activeSessionId,
          eventType: 'host.exit',
          payload: { code }
        });
        if (recoverCompletedInterview('exit_host')) {
          clearSocketRuntimeState(safeProjectId);
          return;
        }
        hostBusy = false;
        const currentExecution = getExecutionRecord(safeProjectId);
        setExecutionState(
          safeProjectId,
          socketUser?.id,
          activeSessionId,
          currentExecution?.state === 'STOPPING' ? 'STOPPED' : 'IDLE',
          socket.id
        );
        emitProjectUpdate(socket, safeProjectId, socketUser?.id);
        clearSocketRuntimeState(safeProjectId);
      };

      const pidHandler = (evData: any) => {
        const { sessionId: msgSessionId, pid } = evData;
        if (msgSessionId !== activeSessionId) return;
        debugPanel.setPID(pid);
        console.log(`[HostManager] PID real del proceso: ${pid}`);
        hostManager.off('pid', pidHandler);
      };

      hostManager.on('message', messageHandler);
      hostManager.on('error', errorHandler);
      hostManager.on('exit', exitHandler);
      hostManager.on('pid', pidHandler);
      cleanupHostListeners = () => {
        hostManager.off('message', messageHandler);
        hostManager.off('error', errorHandler);
        hostManager.off('exit', exitHandler);
        hostManager.off('pid', pidHandler);
        cleanupHostListeners = () => {};
      };

      // 5. Iniciar el proceso huésped
      await hostManager.start(sessionId);
      debugPanel.setState('initializing', `sessionId: ${sessionId}`);

      if (activeProject && safeProjectId) {
        socket.emit('project-started', {
          projectId: safeProjectId,
          project_id: safeProjectId,
          project_name: activeProject.project_name,
          project_path: activeProject.project_path,
          chatHistoryId: activeChatHistoryId,
          chat_history_id: activeChatHistoryId,
          sessionId,
          project: publicProject(activeProject)
        });
      } else {
        socket.emit('interview-started', { sessionId, chatHistoryId: activeChatHistoryId, chat_history_id: activeChatHistoryId });
      }

      // 7. Enviar el mensaje inicial al proceso
      debugPanel.setState('processing', `Procesando mensaje inicial: "${userMessage}"`);
      hostBusy = true;
      setExecutionState(safeProjectId, socketUser.id, sessionId, 'RUNNING', socket.id);
      emitProjectUpdate(socket, safeProjectId, socketUser.id);
      socket.emit('host:pending', { pending: true });
      if (existingProject && userMessage.trim().toLowerCase() === 'continuar') {
        const command = buildWebContinuationCommand(existingProject);
        recordHostTurnEvent({ projectId: safeProjectId, userId: socketUser.id, sessionId, eventType: 'host.send', payload: { message: command } });
        await hostManager.send(sessionId, command);
      } else if (!existingProject) {
        const command = buildWebStartCommand(socketUser.id);
        recordHostTurnEvent({ projectId: safeProjectId, userId: socketUser.id, sessionId, eventType: 'host.send', payload: { message: command } });
        await hostManager.send(sessionId, command);
      } else {
        recordHostTurnEvent({ projectId: safeProjectId, userId: socketUser.id, sessionId, eventType: 'host.send', payload: { message: userMessage } });
        await hostManager.send(sessionId, userMessage);
      }

      console.log(`[Socket] Sesión iniciada: ${safeProjectId}`);

    } catch (err) {
      console.error(`[Socket] Error al iniciar proyecto: ${err}`);
      debugPanel.setState('error', `Error: ${err}`);
      hostBusy = false;
      emitAgentError(clientSafeHostError(err instanceof Error ? err : String(err)));
      clearSocketRuntimeState(safeProjectId);
    }
  }

  socket.on('start-project', beginProject);

  // ── Sesion de soporte: solo lectura, nunca toca el estado del proyecto ──
  // Deliberadamente NO reusa beginProject/messageHandler/emitAgentError: esa
  // maquinaria detecta contratos de entrevista y puede mover el proyecto a
  // desarrollo (moveProjectToDevelopment) si encuentra project-context.md,
  // archivo que SIEMPRE existe en un proyecto ya entregado.
  async function beginSupportSession(data: any) {
    clearStaleActiveSession('begin_support');
    if (activeSessionId) {
      console.warn(`[Socket] Ya hay una sesión activa (${activeSessionId}), ignorando start-support`);
      return;
    }
    if (!socketUser?.id) {
      socket.emit('error', { message: 'Debés iniciar sesión antes de usar soporte.' });
      return;
    }
    const projectId = data?.projectId || data?.project_id || null;
    const project = projectId
      ? readDb().projects.find((p: StoredProject) => p.id === projectId && p.userId === socketUser!.id)
      : null;
    if (!project) {
      socket.emit('error', { message: 'Proyecto no encontrado para soporte.' });
      return;
    }
    if (project.status !== 'ready') {
      socket.emit('error', { message: 'El soporte está disponible una vez que el proyecto esté listo.' });
      return;
    }
    if (['RUNNING', 'STOPPING'].includes(getExecutionState(project.id))) {
      socket.emit('host:pending', { pending: true });
      return;
    }

    const supportError = (text: string) => {
      hostBusy = false;
      setExecutionState(safeProjectId, socketUser?.id, activeSessionId, 'IDLE', socket.id);
      socket.emit('host:pending', { pending: false });
      if (safeProjectId) saveChatMessage(safeProjectId, 'agent', text);
      socket.emit('support-event', { type: 'support_error', text, projectId: safeProjectId });
    };

    try {
      const sessionId = `support_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      activeSessionId = sessionId;
      activeSessionIsSupport = true;
      safeProjectId = project.id;
      activeChatHistoryId = createChatHistory(socketUser.id, sessionId).id;
      answersReceived = 0;

      recordHostTurnEvent({
        projectId: safeProjectId,
        userId: socketUser.id,
        sessionId,
        eventType: 'support.start',
        payload: { projectId: safeProjectId, chatHistoryId: activeChatHistoryId }
      });

      cleanupHostListeners();
      const currentSessionId = sessionId;

      const messageHandler = (evData: any) => {
        const { sessionId: msgSessionId, message } = evData;
        if (msgSessionId !== currentSessionId) return;
        recordHostTurnEvent({
          projectId: safeProjectId,
          userId: socketUser?.id,
          sessionId: activeSessionId,
          eventType: `support.message.${message.type || 'unknown'}`,
          payload: { message }
        });
        if (message.type === 'error') {
          supportError(message.text || 'Error en la sesión de soporte.');
          return;
        }
        hostBusy = false;
        setExecutionState(safeProjectId, socketUser?.id, currentSessionId, 'IDLE', socket.id);
        socket.emit('host:pending', { pending: false });
        if (safeProjectId) saveChatMessage(safeProjectId, 'agent', message.text || '');
        socket.emit('support-event', { type: 'support_reply', text: message.text || '', projectId: safeProjectId });
      };

      const errorHandler = (evData: any) => {
        const { sessionId: msgSessionId, error } = evData;
        if (msgSessionId !== currentSessionId) return;
        console.error(`[HostManager ERROR][soporte] ${error.message}`);
        recordHostTurnEvent({
          projectId: safeProjectId,
          userId: socketUser?.id,
          sessionId: activeSessionId,
          eventType: 'support.error',
          payload: { message: error.message }
        });
        supportError(clientSafeHostError(error));
      };

      const exitHandler = (evData: any) => {
        const { sessionId: msgSessionId, code } = evData;
        if (msgSessionId !== currentSessionId) return;
        console.log(`[Socket] Sesión de soporte terminada: code ${code}`);
        recordHostTurnEvent({
          projectId: safeProjectId,
          userId: socketUser?.id,
          sessionId: activeSessionId,
          eventType: 'support.exit',
          payload: { code }
        });
        hostBusy = false;
        setExecutionState(safeProjectId, socketUser?.id, currentSessionId, 'IDLE', socket.id);
        clearSocketRuntimeState(safeProjectId);
      };

      const pidHandler = (evData: any) => {
        const { sessionId: msgSessionId, pid } = evData;
        if (msgSessionId !== currentSessionId) return;
        console.log(`[HostManager] PID real del proceso [soporte]: ${pid}`);
        hostManager.off('pid', pidHandler);
      };

      hostManager.on('message', messageHandler);
      hostManager.on('error', errorHandler);
      hostManager.on('exit', exitHandler);
      hostManager.on('pid', pidHandler);
      cleanupHostListeners = () => {
        hostManager.off('message', messageHandler);
        hostManager.off('error', errorHandler);
        hostManager.off('exit', exitHandler);
        hostManager.off('pid', pidHandler);
        cleanupHostListeners = () => {};
      };

      await hostManager.start(sessionId);

      hostBusy = true;
      setExecutionState(safeProjectId, socketUser.id, sessionId, 'RUNNING', socket.id);

      socket.emit('project-started', {
        projectId: safeProjectId,
        project_id: safeProjectId,
        project_name: project.project_name,
        project_path: project.project_path,
        chatHistoryId: activeChatHistoryId,
        chat_history_id: activeChatHistoryId,
        sessionId,
        project: publicProject(project),
        supportMode: true
      });
      socket.emit('host:pending', { pending: true });

      const command = buildWebSupportCommand(project);
      recordHostTurnEvent({ projectId: safeProjectId, userId: socketUser.id, sessionId, eventType: 'host.send', payload: { message: command } });
      await hostManager.send(sessionId, command, { markers: { start: SUPPORT_RESPONSE_START, end: SUPPORT_RESPONSE_END } });
    } catch (err) {
      console.error(`[Socket] Error al iniciar soporte: ${err}`);
      hostBusy = false;
      supportError(clientSafeHostError(err instanceof Error ? err : String(err)));
      clearSocketRuntimeState(safeProjectId);
    }
  }

  // ── Sesion de "cambios": intake de pedidos de edicion post-entrega ──
  // Hermano paralelo de beginSupportSession, misma razon para no reusar
  // beginProject/messageHandler: la maquinaria de entrevista puede mover el
  // proyecto a desarrollo si detecta project-context.md, que siempre existe
  // en un proyecto ya entregado. A diferencia de soporte, esta sesion SI
  // puede terminar mutando el proyecto — pero nunca desde este handler: la
  // mutacion real ocurre en background, via startEditJob, disparado solo por
  // la señal EDIT_QUEUE_READY_SIGNAL fuera de los marcadores del cliente.
  async function beginEditSession(data: any) {
    clearStaleActiveSession('begin_edit');
    if (activeSessionId) {
      console.warn(`[Socket] Ya hay una sesión activa (${activeSessionId}), ignorando start-edit`);
      return;
    }
    if (!socketUser?.id) {
      socket.emit('error', { message: 'Debés iniciar sesión antes de pedir cambios.' });
      return;
    }
    const projectId = data?.projectId || data?.project_id || null;
    const project = projectId
      ? readDb().projects.find((p: StoredProject) => p.id === projectId && p.userId === socketUser!.id)
      : null;
    if (!project) {
      socket.emit('error', { message: 'Proyecto no encontrado para pedir cambios.' });
      return;
    }
    if (project.status !== 'ready') {
      socket.emit('error', { message: 'Los cambios están disponibles una vez que el proyecto esté listo.' });
      return;
    }
    if (['RUNNING', 'STOPPING'].includes(getExecutionState(project.id))) {
      socket.emit('host:pending', { pending: true });
      return;
    }
    // Anti-concurrencia: si ya hay una edicion en curso en background para
    // este proyecto (host_jobs con status edit_*, no terminal), no se abre
    // un chat de intake nuevo encima — evita que "cambios" salte directo a
    // edit-product-development (silencioso) en vez de charlar con el
    // cliente, y evita dos procesos tocando el mismo proyecto a la vez.
    const existingEditJob = await getHostJob(project.id);
    if (existingEditJob && String(existingEditJob.status || '').startsWith('edit_') && !['edit_done', 'edit_failed'].includes(existingEditJob.status)) {
      // edit-event con queueReady (no un 'error' generico): el frontend usa
      // esa señal para bloquear el chat mientras el trabajo real sigue
      // corriendo en background -- mismo canal que el guard de abajo, misma
      // razon (ya hay un job activo, no es un error del pedido del cliente).
      const text = 'Ya hay una edición en curso para este proyecto. Esperá a que termine antes de pedir otro cambio.';
      saveChatMessage(project.id, 'agent', text);
      socket.emit('edit-event', { type: 'edit_reply', text, projectId: project.id, queueReady: true });
      return;
    }

    // Segunda parte de la misma anti-concurrencia: el chequeo de arriba solo
    // ve trabajo que YA tiene fila en host_jobs. Si el motor dejo una cola
    // (edit-queue.json/extension-queue.json) con trabajo sin terminar de una
    // sesion anterior, retomarla como turno interactivo hace que el huesped
    // ejecute *-product-development de forma sincrona en vivo -- sin
    // reintentos, sin backoff, sin recuperacion de rate-limit, y sin que el
    // guard de arriba tenga nada que chequear todavia. Si se detecta, se
    // arranca el job de background directo y no se abre chat interactivo.
    const pendingQueueWork = detectPendingMotorQueueWork(project);
    if (pendingQueueWork) {
      recordHostTurnEvent({
        projectId: project.id,
        userId: socketUser.id,
        sessionId: null,
        eventType: 'cambios.resume_pending_queue',
        payload: { reason: pendingQueueWork.reason }
      });
      startEditJob(project.id, socketUser.id, pendingQueueWork.reason);
      const text = 'Estamos trabajando en tu último pedido.';
      saveChatMessage(project.id, 'agent', text);
      socket.emit('edit-event', { type: 'edit_reply', text, projectId: project.id, queueReady: true });
      return;
    }

    const editSessionError = (text: string) => {
      hostBusy = false;
      setExecutionState(safeProjectId, socketUser?.id, activeSessionId, 'IDLE', socket.id);
      socket.emit('host:pending', { pending: false });
      if (safeProjectId) saveChatMessage(safeProjectId, 'agent', text);
      socket.emit('edit-event', { type: 'edit_error', text, projectId: safeProjectId });
    };

    try {
      const sessionId = `edit_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      activeSessionId = sessionId;
      activeSessionIsEdit = true;
      safeProjectId = project.id;
      activeChatHistoryId = createChatHistory(socketUser.id, sessionId).id;
      answersReceived = 0;

      recordHostTurnEvent({
        projectId: safeProjectId,
        userId: socketUser.id,
        sessionId,
        eventType: 'cambios.start',
        payload: { projectId: safeProjectId, chatHistoryId: activeChatHistoryId }
      });

      cleanupHostListeners();
      const currentSessionId = sessionId;

      const messageHandler = (evData: any) => {
        const { sessionId: msgSessionId, message } = evData;
        if (msgSessionId !== currentSessionId) return;
        recordHostTurnEvent({
          projectId: safeProjectId,
          userId: socketUser?.id,
          sessionId: activeSessionId,
          eventType: `cambios.message.${message.type || 'unknown'}`,
          payload: { message }
        });
        if (message.type === 'error') {
          editSessionError(message.text || 'Error en la sesión de cambios.');
          return;
        }
        hostBusy = false;
        setExecutionState(safeProjectId, socketUser?.id, currentSessionId, 'IDLE', socket.id);
        socket.emit('host:pending', { pending: false });
        if (safeProjectId) saveChatMessage(safeProjectId, 'agent', message.text || '');
        socket.emit('edit-event', {
          type: 'edit_reply',
          text: message.text || '',
          projectId: safeProjectId,
          queueReady: Boolean(message.editQueueReady || message.extensionQueueReady)
        });
        if (message.editQueueReady && safeProjectId && socketUser?.id) {
          recordHostTurnEvent({
            projectId: safeProjectId,
            userId: socketUser.id,
            sessionId: activeSessionId,
            eventType: 'cambios.queue_ready',
            payload: {}
          });
          startEditJob(safeProjectId, socketUser.id, 'queue_ready_signal');
        }
        if (message.extensionQueueReady && safeProjectId && socketUser?.id) {
          recordHostTurnEvent({
            projectId: safeProjectId,
            userId: socketUser.id,
            sessionId: activeSessionId,
            eventType: 'cambios.extension_queue_ready',
            payload: {}
          });
          startEditJob(safeProjectId, socketUser.id, 'extension_queue_ready_signal');
        }
        if (message.editQueueReady || message.extensionQueueReady) {
          // El trabajo real sigue en background desde aca (startEditJob ya
          // disparado arriba) -- esta sesion interactiva terminó su parte y
          // hay que cerrarla, si no activeSessionId queda vivo para siempre
          // (HostManager nunca la marca "exit", ninguna otra señal la
          // limpia) y bloquea en silencio cualquier "start-edit" futuro en
          // el mismo socket via clearStaleActiveSession, que la ve todavia
          // "activa" segun HostManager y no la toca.
          const sessionToClose = currentSessionId;
          clearSocketRuntimeState(safeProjectId);
          if (hostManager.getActiveSessionId() === sessionToClose) {
            void hostManager.stop(sessionToClose).catch((err: unknown) => {
              console.error(`[Socket] Error cerrando sesion tras queue_ready: ${err instanceof Error ? err.message : String(err)}`);
            });
          }
          return;
        }
      };

      const errorHandler = (evData: any) => {
        const { sessionId: msgSessionId, error } = evData;
        if (msgSessionId !== currentSessionId) return;
        console.error(`[HostManager ERROR][cambios] ${error.message}`);
        recordHostTurnEvent({
          projectId: safeProjectId,
          userId: socketUser?.id,
          sessionId: activeSessionId,
          eventType: 'cambios.error',
          payload: { message: error.message }
        });
        editSessionError(clientSafeHostError(error));
      };

      const exitHandler = (evData: any) => {
        const { sessionId: msgSessionId, code } = evData;
        if (msgSessionId !== currentSessionId) return;
        console.log(`[Socket] Sesión de cambios terminada: code ${code}`);
        recordHostTurnEvent({
          projectId: safeProjectId,
          userId: socketUser?.id,
          sessionId: activeSessionId,
          eventType: 'cambios.exit',
          payload: { code }
        });
        hostBusy = false;
        setExecutionState(safeProjectId, socketUser?.id, currentSessionId, 'IDLE', socket.id);
        clearSocketRuntimeState(safeProjectId);
      };

      const pidHandler = (evData: any) => {
        const { sessionId: msgSessionId, pid } = evData;
        if (msgSessionId !== currentSessionId) return;
        console.log(`[HostManager] PID real del proceso [cambios]: ${pid}`);
        hostManager.off('pid', pidHandler);
      };

      hostManager.on('message', messageHandler);
      hostManager.on('error', errorHandler);
      hostManager.on('exit', exitHandler);
      hostManager.on('pid', pidHandler);
      cleanupHostListeners = () => {
        hostManager.off('message', messageHandler);
        hostManager.off('error', errorHandler);
        hostManager.off('exit', exitHandler);
        hostManager.off('pid', pidHandler);
        cleanupHostListeners = () => {};
      };

      await hostManager.start(sessionId);

      hostBusy = true;
      setExecutionState(safeProjectId, socketUser.id, sessionId, 'RUNNING', socket.id);

      socket.emit('project-started', {
        projectId: safeProjectId,
        project_id: safeProjectId,
        project_name: project.project_name,
        project_path: project.project_path,
        chatHistoryId: activeChatHistoryId,
        chat_history_id: activeChatHistoryId,
        sessionId,
        project: publicProject(project),
        editMode: true
      });
      socket.emit('host:pending', { pending: true });

      const command = buildWebEditCommand(project);
      recordHostTurnEvent({ projectId: safeProjectId, userId: socketUser.id, sessionId, eventType: 'host.send', payload: { message: command } });
      await hostManager.send(sessionId, command, { markers: { start: EDIT_RESPONSE_START, end: EDIT_RESPONSE_END } });
    } catch (err) {
      console.error(`[Socket] Error al iniciar cambios: ${err}`);
      hostBusy = false;
      editSessionError(clientSafeHostError(err instanceof Error ? err : String(err)));
      clearSocketRuntimeState(safeProjectId);
    }
  }

  socket.on('start-support', beginSupportSession);
  socket.on('start-edit', beginEditSession);

  // ── Evento 'user-reply': respuestas del usuario a las preguntas del agente ──
  socket.on('user-reply', async (data: any) => {
    const userMessage = data.reply || data.message || '';
    const attachment = data.attachment as StoredChatAttachment | undefined;
    console.log(`[Socket] user-reply recibido: mensaje="${userMessage}"`);

    if (!activeSessionId) {
      console.warn('[Socket] user-reply sin sesión activa — ignorando');
      socket.emit('error', { message: 'No hay sesión activa. Escribe "comenzar" primero.' });
      return;
    }

    if (hostBusy) {
      console.warn('[Socket] user-reply ignorado: host ocupado');
      socket.emit('host:pending', { pending: true });
      return;
    }

    try {
      if (rejectDuplicateProjectNameIfNeeded(userMessage)) return;
      const codexMessage = buildOutgoingUserMessage(userMessage, attachment);
      setPendingAnswer(activeChatHistoryId, socketUser?.id, userMessage, attachment);
      if (pendingProjectNameCapture && !safeProjectId) {
        pendingProjectName = normalizeProjectName(userMessage);
        pendingProjectNameAnswer = userMessage;
        pendingProjectNameSentAtMs = Date.now();
      }
      if (safeProjectId) saveChatMessage(safeProjectId, 'user', userMessage);

      debugPanel.setState('processing', `Procesando respuesta: "${userMessage}"`);
      answersReceived++;
      debugPanel.setAnswersCount(answersReceived);
      hostBusy = true;
      setExecutionState(safeProjectId, socketUser?.id, activeSessionId, 'RUNNING', socket.id);
      emitProjectUpdate(socket, safeProjectId, socketUser?.id);
      socket.emit('host:pending', { pending: true });
      recordHostTurnEvent({
        projectId: safeProjectId,
        userId: socketUser?.id,
        sessionId: activeSessionId,
        eventType: 'host.send',
        payload: { message: codexMessage.slice(0, 1000), chatHistoryId: activeChatHistoryId, attachment: attachment ? { filename: attachment.filename, projectPath: attachment.projectPath } : null }
      });
      await hostManager.send(activeSessionId, codexMessage, { markers: activeSessionMarkers() });
      socket.emit('reply-saved', { ok: true });
    } catch (err) {
      console.error(`[Socket] Error enviando reply: ${err}`);
      debugPanel.setState('error', `Error: ${err}`);
      hostBusy = false;
      emitAgentError(clientSafeHostError(err instanceof Error ? err : String(err)));
    }
  });

  // ── Compatibilidad: evento legacy 'chat:message' ──
  socket.on('chat:message', async (data: any) => {
    console.log(`[Socket] chat:message (legacy) recibido — redirigiendo`);
    const msg = data.message || data.text || '';
    const requestedProjectId = data.projectId || data.project_id || safeProjectId;
    const requestedProject = requestedProjectId && socketUser?.id
      ? readDb().projects.find(p => p.id === requestedProjectId && p.userId === socketUser.id) || null
      : null;
    const requestedHistory = requestedProject?.chat_history_id
      ? readDb().chatHistories.find(h => h.id === requestedProject.chat_history_id && h.userId === socketUser?.id) || null
      : null;
    const normalizedMsg = msg.trim().toLowerCase();
    clearStaleActiveSession('chat_message');
    if (requestedProjectId && ['RUNNING', 'STOPPING'].includes(getExecutionState(requestedProjectId))) {
      console.warn('[Socket] chat:message ignorado: ejecucion activa');
      socket.emit('host:pending', { pending: true });
      emitProjectUpdate(socket, requestedProjectId, socketUser?.id);
      return;
    }
    if (hostBusy) {
      console.warn('[Socket] chat:message ignorado: host ocupado');
      socket.emit('host:pending', { pending: true });
      return;
    }
    if (requestedProject && requestedHistory?.pending_question && normalizedMsg !== 'continuar' && getExecutionState(requestedProject.id) === 'IDLE') {
      recordHostTurnEvent({
        projectId: requestedProject.id,
        userId: socketUser?.id,
        sessionId: activeSessionId,
        eventType: 'resume.invalid_command_blocked_local',
        payload: { message: msg.slice(0, 1000), chatHistoryId: requestedHistory.id }
      });
      updateChatHistoryTurn(requestedHistory.id, socketUser?.id, { pending_answer: null });
      socket.emit('host:pending', { pending: false });
      emitProjectUpdate(socket, requestedProject.id, socketUser?.id);
      socket.emit('resume:invalid-command', {
        message: RESUME_CONTINUE_NOTICE,
        chatHistoryId: requestedHistory.id
      });
      return;
    }
    if (normalizedMsg === 'continuar' && (!data.projectId || data.projectId === 'new')) {
      emitAgentError('Selecciona un proyecto de tu historial para continuar.');
      return;
    }
    if (normalizedMsg === 'continuar' && data.projectId && data.projectId !== 'new' && socketUser?.id) {
      const project = requestedProject;
      if (!project) {
        socket.emit('error', { message: 'Proyecto no encontrado para continuar.' });
        return;
      }
      const continuationCommand = buildWebContinuationCommand(project);
      const sendContinuation = async () => {
        if (!activeSessionId) return;
        updateChatHistorySession(project.chat_history_id || activeChatHistoryId, socketUser?.id, activeSessionId);
        hostBusy = true;
        setExecutionState(safeProjectId, socketUser?.id, activeSessionId, 'RUNNING', socket.id);
        emitProjectUpdate(socket, safeProjectId, socketUser?.id);
        socket.emit('host:pending', { pending: true });
        recordHostTurnEvent({
          projectId: safeProjectId,
          userId: socketUser?.id,
          sessionId: activeSessionId,
          eventType: 'host.send',
          payload: { message: continuationCommand, chatHistoryId: project.chat_history_id || activeChatHistoryId }
        });
        await hostManager.send(activeSessionId, continuationCommand);
      };
      if (!activeSessionId) {
        await beginProject({ initialMessage: 'continuar', projectId: project.id });
      } else {
        await sendContinuation();
      }
    } else if (!activeSessionId) {
      await beginProject({
        initialMessage: msg,
        projectId: requestedProjectId && requestedProjectId !== 'new' ? requestedProjectId : undefined
      });
    } else {
      const userMessage = msg;
      const attachment = data.attachment as StoredChatAttachment | undefined;
      if (rejectDuplicateProjectNameIfNeeded(userMessage)) return;
      const codexMessage = buildOutgoingUserMessage(userMessage, attachment);
      setPendingAnswer(activeChatHistoryId, socketUser?.id, userMessage, attachment);
      if (pendingProjectNameCapture && !safeProjectId) {
        pendingProjectName = normalizeProjectName(userMessage);
        pendingProjectNameAnswer = userMessage;
        pendingProjectNameSentAtMs = Date.now();
      }
      if (safeProjectId) saveChatMessage(safeProjectId, 'user', userMessage);
      debugPanel.setState('processing', `Procesando respuesta: "${userMessage}"`);
      answersReceived++;
      debugPanel.setAnswersCount(answersReceived);
      hostBusy = true;
      setExecutionState(safeProjectId, socketUser?.id, activeSessionId, 'RUNNING', socket.id);
      emitProjectUpdate(socket, safeProjectId, socketUser?.id);
      socket.emit('host:pending', { pending: true });
      recordHostTurnEvent({
        projectId: safeProjectId,
        userId: socketUser?.id,
        sessionId: activeSessionId,
        eventType: 'host.send',
        payload: { message: codexMessage.slice(0, 1000), chatHistoryId: activeChatHistoryId, attachment: attachment ? { filename: attachment.filename, projectPath: attachment.projectPath } : null }
      });
      await hostManager.send(activeSessionId, codexMessage, { markers: activeSessionMarkers() });
      socket.emit('reply-saved', { ok: true });
    }
  });

  socket.on('host:stop', async (data: any) => {
    const requestedSessionId = data?.sessionId || activeSessionId;
    const requestedProjectId = data?.projectId || data?.project_id || safeProjectId;
    console.log(`[Socket] host:stop recibido: sessionId=${requestedSessionId || '(none)'} projectId=${requestedProjectId || '(none)'}`);

    if (!socketUser?.id) {
      socket.emit('host:stop-error', { message: 'Usuario no autenticado.' });
      return;
    }
    const execution = getExecutionRecord(requestedProjectId);
    const stopSessionId = requestedSessionId || execution?.sessionId || null;
    if (
      !requestedProjectId ||
      !execution ||
      execution.userId !== socketUser.id ||
      !stopSessionId ||
      !['RUNNING', 'STOPPING'].includes(getExecutionState(requestedProjectId))
    ) {
      socket.emit('host:stop-error', {
        sessionId: stopSessionId || null,
        projectId: requestedProjectId || null,
        message: 'No hay sesión activa para detener.'
      });
      return;
    }
    const project = readDb().projects.find(p => p.id === requestedProjectId && p.userId === socketUser.id);
    if (!project) {
      socket.emit('host:stop-error', {
        sessionId: stopSessionId,
        projectId: requestedProjectId || null,
        message: 'Proyecto activo invalido.'
      });
      return;
    }

    if (execution.sessionId !== stopSessionId) {
      socket.emit('host:stop-error', {
        sessionId: stopSessionId,
        projectId: requestedProjectId,
        message: 'Sesión activa no encontrada para este usuario.'
      });
      return;
    }

    try {
      setExecutionState(requestedProjectId, socketUser.id, stopSessionId, 'STOPPING', socket.id);
      socket.emit('host:stopping', { sessionId: stopSessionId, projectId: requestedProjectId });
      emitProjectUpdate(socket, requestedProjectId, socketUser.id);
      await hostManager.stop(stopSessionId);
      hostBusy = false;
      if (activeSessionId === stopSessionId) clearSocketRuntimeState(requestedProjectId);
      setExecutionState(requestedProjectId, socketUser.id, stopSessionId, 'STOPPED', socket.id);
      socket.emit('host:pending', { pending: false });
      socket.emit('host:stopped', {
        sessionId: stopSessionId,
        projectId: requestedProjectId,
        status: 'cancelled'
      });
      activeProjects.delete(requestedProjectId);
      emitProjectUpdate(socket, requestedProjectId, socketUser.id);
      setExecutionState(requestedProjectId, socketUser.id, stopSessionId, 'IDLE', socket.id);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error(`[Socket] Error deteniendo host: ${error.message}`);
      setExecutionState(requestedProjectId, socketUser.id, stopSessionId, 'STOPPED', socket.id);
      socket.emit('host:stop-error', {
        sessionId: stopSessionId,
        projectId: requestedProjectId,
        message: 'No se pudo detener la generación.'
      });
    }
  });
  
  socket.on('disconnect', async () => {
    console.log(`[Socket] Cliente desconectado: ${socket.id}`);
    const disconnectSessionId = activeSessionId;
    const disconnectProjectId = safeProjectId;
    if (disconnectSessionId && hostManager.getActiveSessionId() === disconnectSessionId) {
      console.log(`[Socket] Deteniendo host por desconexion: sessionId=${disconnectSessionId} projectId=${disconnectProjectId || '(sin proyecto)'}`);
      try {
        if (disconnectProjectId && socketUser?.id) {
          setExecutionState(disconnectProjectId, socketUser.id, disconnectSessionId, 'STOPPING', socket.id);
        }
        await hostManager.stop(disconnectSessionId);
        clearSocketRuntimeState(disconnectProjectId);
        if (disconnectProjectId && socketUser?.id) {
          setExecutionState(disconnectProjectId, socketUser.id, disconnectSessionId, 'IDLE', socket.id);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error(`[Socket] Error deteniendo host por desconexion: ${error.message}`);
        if (disconnectProjectId && socketUser?.id) {
          setExecutionState(disconnectProjectId, socketUser.id, disconnectSessionId, 'STOPPED', socket.id);
        }
      }
    }
    // Limpiar watchers y proyectos
    for (const [projectId, proj] of activeProjects) {
      if (proj.socket?.id === socket.id) {
        const executionState = getExecutionState(projectId);
        const processStillActive = Boolean(
          proj.sessionId &&
          hostManager.getActiveSessionId() === proj.sessionId &&
          ['RUNNING', 'STOPPING'].includes(executionState)
        );
        if (processStillActive) continue;
        if (proj.watcher) {
          proj.watcher.close();
        }
        activeProjects.delete(projectId);
      }
    }
    
    debugPanel.setState('idle', 'Socket desconectado');
  });
});

// ── Start server ──
}
