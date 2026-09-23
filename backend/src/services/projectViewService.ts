import type { StoredChatHistory, StoredProject } from '../types/domain';

type ProjectViewDeps = {
  chatMessages: Record<string, any[]>;
  deliveryFieldsForProject: (project: StoredProject) => Record<string, any>;
  findChatHistoryForProject: (projectId: string) => StoredChatHistory | null;
  getConfirmedChatMessagesForProject: (projectId: string) => any[];
  getExecutionRecord: (projectId: string | null | undefined) => { sessionId: string } | null;
  getProjectStateView: (project: StoredProject, options?: { interviewActive?: boolean }) => any;
  getActiveHostSessionId: () => string | null;
  legacyStatusForState: (state: any) => StoredProject['status'];
};

export function createProjectViewService(deps: ProjectViewDeps) {
  function hasActiveHostSessionForProject(project: StoredProject, history?: StoredChatHistory | null) {
    const execution = deps.getExecutionRecord(project.id);
    const sessionId = execution?.sessionId || history?.hostSessionId || null;
    return !!sessionId && deps.getActiveHostSessionId() === sessionId;
  }

  function publicProject(project: StoredProject) {
    const execution = deps.getExecutionRecord(project.id);
    const history = deps.findChatHistoryForProject(project.id);
    const activeHostSession = hasActiveHostSessionForProject(project, history);
    const stateView = deps.getProjectStateView(project, {
      interviewActive: activeHostSession && !!history?.pending_question
    });
    const historyMessages = deps.getConfirmedChatMessagesForProject(project.id);
    const deliveryFields = stateView.project_state === 'PROJECT_FINISHED' ? deps.deliveryFieldsForProject(project) : {};
    return {
      id: project.id,
      project_id: project.project_id,
      name: project.name,
      project_name: project.project_name,
      project_path: project.project_path,
      description: project.description,
      type: project.type,
      status: deps.legacyStatusForState(stateView.project_state),
      project_state: stateView.project_state,
      execution_state: stateView.execution_state,
      execution_session_id: activeHostSession ? (execution?.sessionId || history?.hostSessionId || null) : null,
      state: stateView.project_state,
      state_view: stateView,
      previewUrl: project.previewUrl,
      zipUrl: project.zipUrl,
      ...deliveryFields,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      chat_history_id: project.chat_history_id || null,
      pending_question: activeHostSession && history?.pending_question?.visible !== false ? history?.pending_question || null : null,
      requires_continue: !!history?.pending_question && !activeHostSession,
      messages: historyMessages.length ? historyMessages : (deps.chatMessages[project.id] || [])
    };
  }

  return {
    hasActiveHostSessionForProject,
    publicProject
  };
}
