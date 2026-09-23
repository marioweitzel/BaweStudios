export function normalizeProjectName(name: string) {
  return name.trim().replace(/[<>:"/\\|?*\x00-\x1F]/g, '').replace(/\s+/g, ' ').slice(0, 80) || 'proyecto';
}

export function makeProjectId() {
  return `proj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function workspaceUserId(userId: string) {
  return `user_${userId}`;
}

export function makeSafeName(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 50) || 'proyecto';
}

export function sameProjectName(a: string, b: string) {
  return normalizeProjectName(a).toLocaleLowerCase('es') === normalizeProjectName(b).toLocaleLowerCase('es');
}
