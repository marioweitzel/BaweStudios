import type { Socket } from 'socket.io';

type LiveProjectUpdatesDeps = {
  chatMessages: Record<string, any[]>;
  makeChatMessageId: (sender: 'user' | 'agent' | 'system') => string;
  publicProject: (project: any) => any;
  readDb: () => { projects: any[] };
};

export function createLiveProjectUpdatesService(deps: LiveProjectUpdatesDeps) {
  function saveChatMessage(projectId: string, sender: 'user' | 'agent', text: string) {
    if (!deps.chatMessages[projectId]) deps.chatMessages[projectId] = [];
    const msg = {
      id: deps.makeChatMessageId(sender),
      sender,
      text,
      timestamp: new Date().toISOString()
    };
    deps.chatMessages[projectId].push(msg);
    return msg;
  }

  function emitProjectUpdate(socket: Socket, projectId: string | null, userId: string | null | undefined) {
    if (!projectId || !userId) return;
    const project = deps.readDb().projects.find(p => p.id === projectId && p.userId === userId);
    if (project) socket.emit('project:updated', deps.publicProject(project));
  }

  return {
    emitProjectUpdate,
    saveChatMessage
  };
}
