import type {
  DbShape,
  StoredChatAttachment,
  StoredChatHistory,
  StoredChatMessage,
  StoredProject
} from '../types/domain';

type ChatHistoryDeps = {
  readDb: () => DbShape;
  writeDb: (db: DbShape) => void;
};

export function createChatHistoryService(deps: ChatHistoryDeps) {
  function makeChatHistoryId() {
    return `chat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function makeChatMessageId(sender: 'user' | 'agent' | 'system') {
    return `${sender === 'user' ? 'usr' : sender === 'agent' ? 'agt' : 'sys'}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  }

  function createChatHistory(userId: string, hostSessionId: string | null) {
    const now = new Date().toISOString();
    const history: StoredChatHistory = {
      id: makeChatHistoryId(),
      userId,
      user_id: userId,
      projectId: null,
      project_id: null,
      hostSessionId,
      status: 'interview_started',
      messages: [],
      pending_question: null,
      pending_answer: null,
      createdAt: now,
      updatedAt: now,
      created_at: now,
      updated_at: now
    };
    const db = deps.readDb();
    db.chatHistories.push(history);
    deps.writeDb(db);
    return history;
  }

  function findChatHistoryForProject(projectId: string) {
    return deps.readDb().chatHistories.find(h => h.projectId === projectId) || null;
  }

  function appendChatHistoryMessage(
    historyId: string | null,
    userId: string | null | undefined,
    sender: 'user' | 'agent' | 'system',
    text: string,
    options: { visible?: boolean; event_type?: string; attachment?: StoredChatAttachment } = {}
  ) {
    if (!historyId || !userId || !text.trim()) return null;
    const db = deps.readDb();
    const idx = db.chatHistories.findIndex(h => h.id === historyId && h.userId === userId);
    if (idx === -1) return null;
    const now = new Date().toISOString();
    const msg: StoredChatMessage = {
      id: makeChatMessageId(sender),
      sender,
      text,
      timestamp: now,
      visible: options.visible !== false,
      event_type: options.event_type,
      attachment: options.attachment
    };
    db.chatHistories[idx].messages.push(msg);
    db.chatHistories[idx].updatedAt = now;
    db.chatHistories[idx].updated_at = now;
    deps.writeDb(db);
    return msg;
  }

  function makeStoredChatMessage(
    sender: 'user' | 'agent' | 'system',
    text: string,
    options: { visible?: boolean; event_type?: string; attachment?: StoredChatAttachment } = {}
  ) {
    return {
      id: makeChatMessageId(sender),
      sender,
      text,
      timestamp: new Date().toISOString(),
      visible: options.visible !== false,
      event_type: options.event_type,
      attachment: options.attachment
    };
  }

  function updateChatHistoryTurn(
    historyId: string | null,
    userId: string | null | undefined,
    patch: Partial<Pick<StoredChatHistory, 'pending_question' | 'pending_answer'>>
  ) {
    if (!historyId || !userId) return null;
    const db = deps.readDb();
    const idx = db.chatHistories.findIndex(h => h.id === historyId && h.userId === userId);
    if (idx === -1) return null;
    const now = new Date().toISOString();
    db.chatHistories[idx] = {
      ...db.chatHistories[idx],
      ...patch,
      updatedAt: now,
      updated_at: now
    };
    deps.writeDb(db);
    return db.chatHistories[idx];
  }

  function updateChatHistorySession(
    historyId: string | null,
    userId: string | null | undefined,
    hostSessionId: string | null
  ) {
    if (!historyId || !userId) return null;
    const db = deps.readDb();
    const idx = db.chatHistories.findIndex(h => h.id === historyId && h.userId === userId);
    if (idx === -1) return null;
    const now = new Date().toISOString();
    db.chatHistories[idx] = {
      ...db.chatHistories[idx],
      hostSessionId,
      updatedAt: now,
      updated_at: now
    };
    deps.writeDb(db);
    return db.chatHistories[idx];
  }

  function setPendingQuestion(historyId: string | null, userId: string | null | undefined, text: string) {
    if (!text.trim()) return null;
    return updateChatHistoryTurn(historyId, userId, {
      pending_question: makeStoredChatMessage('agent', text)
    });
  }

  function setPendingAnswer(historyId: string | null, userId: string | null | undefined, text: string, attachment?: StoredChatAttachment) {
    if (!text.trim()) return null;
    return updateChatHistoryTurn(historyId, userId, {
      pending_answer: makeStoredChatMessage('user', text, { attachment })
    });
  }

  function confirmPendingChatTurn(historyId: string | null, userId: string | null | undefined) {
    if (!historyId || !userId) return null;
    const db = deps.readDb();
    const idx = db.chatHistories.findIndex(h => h.id === historyId && h.userId === userId);
    if (idx === -1) return null;
    const history = db.chatHistories[idx];
    if (!history.pending_question || !history.pending_answer) return history;
    const now = new Date().toISOString();
    db.chatHistories[idx] = {
      ...history,
      messages: [...history.messages, history.pending_question, history.pending_answer],
      pending_question: null,
      pending_answer: null,
      updatedAt: now,
      updated_at: now
    };
    deps.writeDb(db);
    return db.chatHistories[idx];
  }

  function linkChatHistoryToProject(historyId: string | null, userId: string, project: StoredProject) {
    if (!historyId) return;
    const db = deps.readDb();
    const historyIdx = db.chatHistories.findIndex(h => h.id === historyId && h.userId === userId);
    const projectIdx = db.projects.findIndex(p => p.id === project.id && p.userId === userId);
    if (historyIdx === -1 || projectIdx === -1) return;
    const now = new Date().toISOString();
    db.chatHistories[historyIdx] = {
      ...db.chatHistories[historyIdx],
      projectId: project.id,
      project_id: project.project_id,
      status: 'project_linked',
      updatedAt: now,
      updated_at: now
    };
    db.projects[projectIdx] = {
      ...db.projects[projectIdx],
      chat_history_id: historyId,
      updatedAt: now,
      updated_at: now
    };
    deps.writeDb(db);
  }

  function getConfirmedChatMessagesForProject(projectId: string) {
    const history = findChatHistoryForProject(projectId);
    return (history?.messages || []).filter(m => m.visible !== false);
  }

  return {
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
  };
}
