import fs from 'fs';
import path from 'path';
import type { StoredProject } from '../types/domain';

export function imageExtensionFromMime(mime: string, fallbackName = '') {
  const cleanMime = mime.split(';')[0].trim().toLowerCase();
  if (cleanMime === 'image/png') return 'png';
  if (cleanMime === 'image/jpeg' || cleanMime === 'image/jpg') return 'jpg';
  if (cleanMime === 'image/webp') return 'webp';
  if (cleanMime === 'image/svg+xml') return 'svg';
  const ext = path.extname(fallbackName).replace('.', '').toLowerCase();
  return ['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(ext) ? ext : 'png';
}

export function safeProjectFilePath(project: StoredProject, filename: string) {
  const projectRoot = path.resolve(project.project_path);
  const target = path.resolve(projectRoot, path.basename(filename));
  if (target !== projectRoot && !target.startsWith(projectRoot + path.sep)) {
    throw new Error('Ruta de archivo invalida');
  }
  return target;
}

export function safeProjectRelativePath(project: StoredProject, relativePath: string, label: string) {
  if (!relativePath || path.isAbsolute(relativePath)) {
    throw new Error(`${label} invalido`);
  }
  const projectRoot = path.resolve(project.project_path);
  const target = path.resolve(projectRoot, relativePath);
  if (target !== projectRoot && !target.startsWith(projectRoot + path.sep)) {
    throw new Error(`${label} fuera del proyecto`);
  }
  return target;
}

export function publicProjectFileUrl(projectId: string, filename: string) {
  return `/api/projects/${encodeURIComponent(projectId)}/files/${encodeURIComponent(path.basename(filename))}`;
}

export function publicProjectDownloadUrl(projectId: string) {
  return `/api/projects/${encodeURIComponent(projectId)}/download`;
}

export function parseKeyValueFile(filePath: string) {
  const result: Record<string, string> = {};
  const content = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const sep = line.indexOf('=');
    if (sep === -1) continue;
    result[line.slice(0, sep).trim()] = line.slice(sep + 1).trim();
  }
  return result;
}

export function normalizeRelativePathForCompare(value: string) {
  return value.replace(/\\/g, '/').replace(/^\.?\//, '');
}

export type PendingMotorQueueWork = { type: 'edit' | 'extension'; reason: string };

function queueFileHasOpenWork(project: StoredProject, relativePath: string, label: string): boolean {
  try {
    const queuePath = safeProjectRelativePath(project, relativePath, label);
    if (!fs.existsSync(queuePath)) return false;
    const raw = fs.readFileSync(queuePath, 'utf8').replace(/^﻿/, '');
    const queue = JSON.parse(raw);
    return queue?.status !== 'DONE';
  } catch {
    // Archivo ausente, ilegible o con JSON invalido: tratar como "sin cola
    // pendiente detectable" en vez de romper el flujo de abrir "cambios" —
    // el peor caso es caer al turno interactivo de siempre, no bloquear.
    return false;
  }
}

// edit-intake/extension-context-detector ya usan este mismo criterio del
// lado motor (status de la cola distinto de DONE = todavia queda trabajo
// sin terminar) para decidir si saltan directo a *-product-development en
// vez de conversar. Este chequeo replica esa misma señal del lado app, para
// decidir ANTES de abrir un turno interactivo si conviene ir directo a
// startEditJob (background) en cambio.
export function detectPendingMotorQueueWork(project: StoredProject): PendingMotorQueueWork | null {
  if (queueFileHasOpenWork(project, path.join('.bawe', 'edit-queue.json'), 'cola de ajustes')) {
    return { type: 'edit', reason: 'edit_queue_pending' };
  }
  if (queueFileHasOpenWork(project, path.join('.bawe', 'extension-queue.json'), 'cola de extension')) {
    return { type: 'extension', reason: 'extension_queue_pending' };
  }
  return null;
}
