export type ProjectFamily = 'web';

export const DEFAULT_PROJECT_FAMILY: ProjectFamily = 'web';

export function normalizeProjectFamily(value: unknown): ProjectFamily {
  if (!value) return DEFAULT_PROJECT_FAMILY;
  if (value === 'web') return 'web';
  throw new Error('PROJECT_FAMILY_UNSUPPORTED');
}
