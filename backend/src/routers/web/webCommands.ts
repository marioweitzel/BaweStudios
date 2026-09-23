import fs from 'fs';
import path from 'path';
import type { StoredChatAttachment, StoredProject } from '../../types/domain';
import { env } from '../../config/env';
import { normalizeProjectName, workspaceUserId } from '../../utils/names';

// El backend normaliza el nombre a mano (normalizeProjectName), pero el motor
// slugifica el nombre del proyecto con su propia regla al crear la carpeta
// (minusculas, sin tildes, guiones en vez de espacios). Si difieren, el
// "continuar <user> <nombre>" que se manda al motor no matchea ningun
// directorio real y el motor corta con NO_ACTIVE_PROJECT aunque el proyecto
// exista. Como el workspace del motor esta espejado en el backend
// (BAWE_PROJECTS_ROOT), resolvemos el nombre real leyendo el directorio en
// vez de confiar en que las dos normalizaciones coincidan.
function looseSlug(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Mn}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function resolveMotorProjectFolderName(userId: string, projectName: string): string {
  const cleanName = normalizeProjectName(projectName);
  const userWorkspaceRoot = path.join(env.projectsRoot, workspaceUserId(userId));
  try {
    if (fs.existsSync(path.join(userWorkspaceRoot, cleanName))) return cleanName;
    const target = looseSlug(cleanName);
    const match = fs.readdirSync(userWorkspaceRoot, { withFileTypes: true })
      .find(entry => entry.isDirectory() && looseSlug(entry.name) === target);
    if (match) return match.name;
  } catch {
    // Workspace no accesible desde el backend en este momento: cae al nombre
    // normalizado (comportamiento previo) en vez de romper el comando.
  }
  return cleanName;
}

export function buildWebContinuationCommand(project: StoredProject): string {
  const projectName = resolveMotorProjectFolderName(
    project.userId,
    project.project_name || project.name || project.project_id || project.id
  );
  return `continuar ${workspaceUserId(project.userId)} ${projectName}`.trim();
}

export function buildWebStartCommand(userId: string): string {
  return `comenzar ${workspaceUserId(userId)}`;
}

export function buildWebSupportCommand(project: StoredProject): string {
  const projectName = resolveMotorProjectFolderName(
    project.userId,
    project.project_name || project.name || project.project_id || project.id
  );
  return `soporte ${workspaceUserId(project.userId)} ${projectName}`.trim();
}

export function buildWebEditCommand(project: StoredProject): string {
  const projectName = resolveMotorProjectFolderName(
    project.userId,
    project.project_name || project.name || project.project_id || project.id
  );
  return `cambios ${workspaceUserId(project.userId)} ${projectName}`.trim();
}

export function appendWebAttachmentToPrompt(text: string, attachment?: StoredChatAttachment | null) {
  if (!attachment) return text;
  return `${text.trim()}\n\nLogo adjunto por el cliente:\n${attachment.projectPath}`;
}

// edit-intake reconoce cualquier bloque final referenciando una ruta de
// archivo adjunta, sin exigir una redaccion fija ("Imagen adjunta:" es solo
// el ejemplo del skill) — se usa una etiqueta propia, distinta de la del
// logo, para que quede claro en los logs a que flujo pertenece cada adjunto.
export function appendEditAttachmentToPrompt(text: string, attachment?: StoredChatAttachment | null) {
  if (!attachment) return text;
  return `${text.trim()}\n\nImagen adjunta:\n${attachment.projectPath}`;
}
