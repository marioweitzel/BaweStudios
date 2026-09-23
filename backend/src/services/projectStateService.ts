import fs from 'fs';
import path from 'path';
import { readDeliveryInfo } from './deliveryService';
import type { ExecutionState, ProjectState, ProjectStateView, StoredProject } from '../types/domain';

type ProjectStateDeps = {
  getExecutionState: (projectId: string) => ExecutionState;
};

export function createProjectStateService(deps: ProjectStateDeps) {
  function getProjectState(project: StoredProject): ProjectState {
    const projectContextPath = path.join(project.project_path, 'project-context.md');
    if (project.status === 'ready') return 'PROJECT_FINISHED';
    try {
      if (readDeliveryInfo(project)) return 'PROJECT_FINISHED';
    } catch {
      // Delivery artifacts may be partially written while the motor is finishing.
    }
    if (project.status === 'building') return 'PROJECT_BUILDING';
    if (fs.existsSync(projectContextPath)) return 'PROJECT_BUILDING';
    return 'INTERVIEW_NOT_COMPLETED';
  }

  function isProjectUnfinished(project: StoredProject) {
    const state = getProjectState(project);
    return state === 'INTERVIEW_NOT_COMPLETED' || state === 'PROJECT_BUILDING';
  }

  function legacyStatusForState(state: ProjectState): StoredProject['status'] {
    if (state === 'PROJECT_FINISHED') return 'ready';
    if (state === 'INTERVIEW_NOT_COMPLETED') return 'pending';
    return 'building';
  }

  function getProjectStateView(project: StoredProject, options: { interviewActive?: boolean } = {}): ProjectStateView {
    const project_state = getProjectState(project);
    const execution_state = deps.getExecutionState(project.id);
    const interviewActive = !!options.interviewActive && project_state === 'INTERVIEW_NOT_COMPLETED' && execution_state === 'IDLE';

    if (execution_state === 'RUNNING') {
      return {
        project_state,
        execution_state,
        state: project_state,
        headerLabel: 'Entrevista en progreso',
        centralTitle: 'Entrevista en progreso',
        centralText: 'Pensando...',
        inputDisabled: true,
        showStop: true,
        canAcceptInput: false,
        temporaryMessage: 'Pensando...'
      };
    }

    if (execution_state === 'STOPPING') {
      return {
        project_state,
        execution_state,
        state: project_state,
        headerLabel: 'Entrevista en progreso',
        centralTitle: 'Deteniendo...',
        centralText: 'Deteniendo...',
        inputDisabled: true,
        showStop: true,
        canAcceptInput: false,
        temporaryMessage: 'Deteniendo...'
      };
    }

    if (execution_state === 'STOPPED') {
      return {
        project_state,
        execution_state,
        state: project_state,
        headerLabel: 'Entrevista no completada',
        centralTitle: 'Entrevista detenida.',
        centralText: 'Escribi "continuar" para proseguir.',
        inputDisabled: false,
        showStop: false,
        canAcceptInput: project_state === 'INTERVIEW_NOT_COMPLETED',
        temporaryMessage: 'Entrevista detenida.\n\nEscribi "continuar" para proseguir.'
      };
    }

    if (project_state === 'PROJECT_FINISHED') {
      return {
        project_state,
        execution_state,
        state: project_state,
        headerLabel: 'Proyecto finalizado',
        centralTitle: 'Tu proyecto esta listo.',
        centralText: 'Anda a Proyectos para descargar el ZIP o probar la demo.',
        inputDisabled: true,
        showStop: false,
        canAcceptInput: false
      };
    }

    if (project_state === 'PROJECT_BUILDING') {
      return {
        project_state,
        execution_state,
        state: project_state,
        headerLabel: 'Proyecto en desarrollo',
        centralTitle: 'Su proyecto se esta desarrollando.',
        centralText: '',
        inputDisabled: true,
        showStop: false,
        canAcceptInput: false
      };
    }

    if (interviewActive) {
      return {
        project_state,
        execution_state,
        state: project_state,
        headerLabel: 'Entrevista en progreso',
        centralTitle: 'Entrevista en progreso',
        centralText: '',
        inputDisabled: false,
        showStop: false,
        canAcceptInput: true
      };
    }

    return {
      project_state,
      execution_state,
      state: project_state,
      headerLabel: 'Entrevista no completada',
      centralTitle: 'Este proyecto tiene una entrevista no completada.',
      centralText: 'Escribi "continuar" para seguir donde lo dejaste o selecciona Nuevo Proyecto u otro proyecto del historial.',
      inputDisabled: false,
      showStop: false,
      canAcceptInput: true
    };
  }

  return {
    getProjectState,
    getProjectStateView,
    isProjectUnfinished,
    legacyStatusForState
  };
}

