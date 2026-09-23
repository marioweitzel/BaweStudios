import fs from 'fs';
import path from 'path';
import type { DbShape, ProjectState, StoredProject } from '../types/domain';
import { makeProjectId, normalizeProjectName, sameProjectName } from '../utils/names';

type FindCommittedMotorProjectOptions = {
  answerText?: string | null;
  minMtimeMs?: number | null;
};

type ProjectRegistryDeps = {
  readDb: () => DbShape;
  writeDb: (db: DbShape) => void;
  buildProjectPath: (projectName: string, userId?: string) => string;
  getProjectState: (project: StoredProject) => ProjectState;
  isProjectUnfinished: (project: StoredProject) => boolean;
  legacyStatusForState: (state: ProjectState) => StoredProject['status'];
  onProjectDeleted: (projectId: string) => void;
};

export function createProjectRegistryService(deps: ProjectRegistryDeps) {
  function normalizeForSearch(value: string) {
    return value
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
      .replace(/[*_`"“”'’]/g, '')
      .replace(/\s+/g, ' ')
      .toLocaleLowerCase('es');
  }

  function workspaceRootForUser(userId: string) {
    return path.dirname(deps.buildProjectPath('__probe__', userId));
  }

  function projectNameFromLog(logPath: string) {
    if (!fs.existsSync(logPath)) return null;
    const raw = fs.readFileSync(logPath, 'utf8').replace(/^\uFEFF/, '');
    const a1Line = raw.split(/\r?\n/).find(line => line.includes('| A1 |'));
    if (!a1Line) return null;
    const cells = a1Line.split('|').map(cell => cell.trim()).filter(Boolean);
    const value = cells[2] || '';
    return value ? normalizeProjectName(value) : null;
  }

  function logHasPendingA2(logPath: string) {
    if (!fs.existsSync(logPath)) return false;
    const raw = fs.readFileSync(logPath, 'utf8').replace(/^\uFEFF/, '');
    return raw.split(/\r?\n/).some(line =>
      normalizeForSearch(line).includes('siguiente pregunta pendiente a2')
    );
  }

  function isProjectNameSupportedByAnswer(projectName: string, answerText: string) {
    const normalizedName = normalizeForSearch(projectName);
    const normalizedAnswer = normalizeForSearch(answerText);
    return !!normalizedName && normalizedAnswer.includes(normalizedName);
  }

  function findUnfinishedProjectForUser(userId: string, exceptProjectId?: string | null) {
    return deps.readDb().projects.find(project =>
      project.userId === userId &&
      project.id !== exceptProjectId &&
      deps.isProjectUnfinished(project)
    ) || null;
  }

  function reconcileProjectStatus(project: StoredProject) {
    const expectedStatus = deps.legacyStatusForState(deps.getProjectState(project));
    if (project.status === expectedStatus) return project;
    return updateProject(project.id, project.userId, { status: expectedStatus }) || project;
  }

  function findProjectNameConflict(userId: string, projectName: string) {
    return deps.readDb().projects.find(p => p.userId === userId && sameProjectName(p.project_name || p.name, projectName)) || null;
  }

  function suggestProjectName(userId: string, projectName: string) {
    const baseName = normalizeProjectName(projectName);
    const hyphenated = baseName.replace(/\s+/g, '-');
    if (hyphenated !== baseName && !findProjectNameConflict(userId, hyphenated)) return hyphenated;
    for (let i = 2; i <= 50; i++) {
      const candidate = `${baseName}-${i}`;
      if (!findProjectNameConflict(userId, candidate)) return candidate;
    }
    return `${baseName}-${Date.now()}`;
  }

  function logPreguntasHasA1(logPath: string, projectName: string) {
    if (!fs.existsSync(logPath)) return false;
    const raw = fs.readFileSync(logPath, 'utf8').replace(/^\uFEFF/, '');
    const expected = normalizeProjectName(projectName);
    return raw.split(/\r?\n/).some(line => {
      if (!line.includes('| A1 |')) return false;
      const cells = line.split('|').map(cell => cell.trim()).filter(Boolean);
      return cells.some(cell => sameProjectName(cell, expected));
    });
  }

  function findCommittedMotorProject(userId: string, projectName: string, options: FindCommittedMotorProjectOptions = {}) {
    const cleanName = normalizeProjectName(projectName);
    const projectPath = deps.buildProjectPath(cleanName, userId);
    const logPath = path.join(projectPath, 'log-preguntas.md');
    if (fs.existsSync(projectPath) && logPreguntasHasA1(logPath, cleanName)) {
      return { projectName: cleanName, projectPath, logPath };
    }

    const answerText = options.answerText || '';
    if (!answerText.trim()) return null;

    const userWorkspaceRoot = workspaceRootForUser(userId);
    if (!fs.existsSync(userWorkspaceRoot)) return null;

    const minMtimeMs = options.minMtimeMs ? options.minMtimeMs - 120000 : null;
    const candidates = fs.readdirSync(userWorkspaceRoot, { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .map(entry => {
        const candidateProjectName = normalizeProjectName(entry.name);
        const candidateProjectPath = path.join(userWorkspaceRoot, entry.name);
        const candidateLogPath = path.join(candidateProjectPath, 'log-preguntas.md');
        if (!fs.existsSync(candidateLogPath)) return null;

        const stat = fs.statSync(candidateLogPath);
        if (minMtimeMs && stat.mtimeMs < minMtimeMs) return null;

        const loggedProjectName = projectNameFromLog(candidateLogPath) || candidateProjectName;
        if (!logPreguntasHasA1(candidateLogPath, loggedProjectName)) return null;
        if (!logHasPendingA2(candidateLogPath)) return null;
        if (!isProjectNameSupportedByAnswer(loggedProjectName, answerText)) return null;

        return {
          projectName: loggedProjectName,
          projectPath: candidateProjectPath,
          logPath: candidateLogPath
        };
      })
      .filter((candidate): candidate is { projectName: string; projectPath: string; logPath: string } => !!candidate);

    return candidates.length === 1 ? candidates[0] : null;
  }

  function createProjectRecord(userId: string, projectName: string, extra: Partial<StoredProject> = {}) {
    const now = new Date().toISOString();
    const cleanName = normalizeProjectName(projectName);
    const projectId = extra.id || extra.project_id || makeProjectId();
    const projectPath = extra.project_path || deps.buildProjectPath(cleanName, userId);

    const project: StoredProject = {
      id: projectId,
      project_id: projectId,
      userId,
      user_id: userId,
      name: cleanName,
      project_name: cleanName,
      project_path: projectPath,
      description: extra.description || '',
      type: extra.type || 'saas',
      status: extra.status || 'pending',
      previewUrl: extra.previewUrl || '',
      zipUrl: extra.zipUrl || '',
      createdAt: extra.createdAt || now,
      updatedAt: now,
      created_at: extra.created_at || now,
      updated_at: now
    };

    const db = deps.readDb();
    const existingIndex = db.projects.findIndex(p => p.id === projectId && p.userId === userId);
    if (existingIndex >= 0) {
      db.projects[existingIndex] = {
        ...db.projects[existingIndex],
        ...project,
        createdAt: db.projects[existingIndex].createdAt,
        created_at: db.projects[existingIndex].created_at
      };
    } else {
      db.projects.push(project);
    }
    deps.writeDb(db);
    return project;
  }

  function updateProject(projectId: string, userId: string, patch: Partial<StoredProject>) {
    const db = deps.readDb();
    const idx = db.projects.findIndex(p => p.id === projectId && p.userId === userId);
    if (idx === -1) return null;
    const now = new Date().toISOString();
    db.projects[idx] = { ...db.projects[idx], ...patch, updatedAt: now, updated_at: now };
    if (patch.name) db.projects[idx].project_name = patch.name;
    if (patch.project_name) db.projects[idx].name = patch.project_name;
    deps.writeDb(db);
    return db.projects[idx];
  }

  function deleteProjectRecord(projectId: string, userId: string) {
    const db = deps.readDb();
    const project = db.projects.find(p => p.id === projectId && p.userId === userId);
    if (!project) return null;
    const now = new Date().toISOString();
    db.projects = db.projects.filter(p => !(p.id === projectId && p.userId === userId));
    db.chatHistories = db.chatHistories
      .filter(h => !(h.projectId === projectId && h.userId === userId))
      .map(h => h.projectId === projectId ? { ...h, projectId: null, project_id: null, updatedAt: now, updated_at: now } : h);
    deps.onProjectDeleted(projectId);
    deps.writeDb(db);
    return project;
  }

  return {
    createProjectRecord,
    deleteProjectRecord,
    findCommittedMotorProject,
    findProjectNameConflict,
    findUnfinishedProjectForUser,
    reconcileProjectStatus,
    suggestProjectName,
    updateProject
  };
}
