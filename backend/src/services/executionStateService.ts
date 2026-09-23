import type { ExecutionState } from '../types/domain';

export type ExecutionRecord = {
  projectId: string;
  userId: string;
  sessionId: string;
  state: ExecutionState;
  socketId?: string;
  updatedAt: string;
};

type ExecutionStateDeps = {
  isActiveHostSession: (sessionId: string) => boolean;
};

export function createExecutionStateService(deps: ExecutionStateDeps) {
  const executionStates = new Map<string, ExecutionRecord>();

  function getExecutionRecord(projectId: string | null | undefined) {
    if (!projectId) return null;
    return executionStates.get(projectId) || null;
  }

  function getExecutionState(projectId: string): ExecutionState {
    const execution = executionStates.get(projectId);
    if (!execution) return 'IDLE';
    if (execution.state === 'RUNNING' || execution.state === 'STOPPING') {
      return deps.isActiveHostSession(execution.sessionId) ? execution.state : 'IDLE';
    }
    return execution.state;
  }

  function setExecutionState(
    projectId: string | null,
    userId: string | null | undefined,
    sessionId: string | null,
    state: ExecutionState,
    socketId?: string
  ) {
    if (!projectId || !userId || !sessionId) return;
    executionStates.set(projectId, {
      projectId,
      userId,
      sessionId,
      state,
      socketId,
      updatedAt: new Date().toISOString()
    });
  }

  function deleteExecutionState(projectId: string | null | undefined) {
    if (!projectId) return;
    executionStates.delete(projectId);
  }

  return {
    deleteExecutionState,
    getExecutionRecord,
    getExecutionState,
    setExecutionState
  };
}
