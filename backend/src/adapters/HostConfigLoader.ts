/**
 * HostConfigLoader — Lee y valida la configuración del huésped activo.
 *
 * Responsabilidad única: dado el nombre del adaptador (e.g. "codex", "fake"),
 * leer el archivo JSON correspondiente desde backend/hosts/<name>.json,
 * validar que todos los campos obligatorios existen y que el entorno es viable.
 *
 * Esta clase NO sabe nada de cómo ejecutar el proceso. Solo carga y valida config.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

export interface HostConfig {
  name: string;
  type: 'node-process' | 'cli-process';
  command: string;
  args?: string[];
  cwd: string;
  mode: 'persistent' | 'spawn-per-message';
  input: 'stdin' | 'argv';
  output: 'stdout';
  stderr?: 'capture' | 'ignore';
  timeoutMs?: number;
}

// Directorio donde viven los JSON de configuración de cada huésped
const HOSTS_DIR = path.join(__dirname, '..', '..', 'hosts');

/**
 * loadHostConfig(adapterName) — Carga y valida la configuración del huésped.
 *
 * @param adapterName — Nombre del adaptador (fake, codex, claude-code, vscode)
 * @returns HostConfig validada
 * @throws Error con descripción clara si algo falla
 */
export function loadHostConfig(adapterName: string): HostConfig {
  const configPath = path.join(HOSTS_DIR, `${adapterName}.json`);

  // 1. Verificar que el archivo existe
  if (!fs.existsSync(configPath)) {
    throw new Error(
      `[HOST CONFIG] archivo no encontrado: ${configPath}\n` +
      `Adaptadores disponibles: ${getAvailableAdapters().join(', ')}`
    );
  }

  // 2. Parsear el JSON
  let config: HostConfig;
  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    config = JSON.parse(raw) as HostConfig;
  } catch (err) {
    throw new Error(`[HOST CONFIG] error parseando ${configPath}: ${(err as Error).message}`);
  }

  // 3. Validar campos obligatorios
  const required: (keyof HostConfig)[] = ['name', 'command', 'cwd', 'mode'];
  for (const field of required) {
    if (!config[field]) {
      throw new Error(`[HOST CONFIG] campo obligatorio faltante: "${field}" en ${configPath}`);
    }
  }

  // 4. Validar que el cwd existe físicamente
  const resolvedCwd = resolveCwd(config.cwd, adapterName);
  if (!fs.existsSync(resolvedCwd)) {
    throw new Error(
      `[HOST CONFIG] cwd no existe en el sistema de archivos: ${resolvedCwd}\n` +
      `Revisar campo "cwd" en ${configPath}`
    );
  }
  config.cwd = resolvedCwd;

  // 5. Verificar que el comando está disponible en PATH (solo para CLI externos)
  if (config.type === 'cli-process') {
    verifyCommandInPath(config.command, configPath);
  }

  console.log(`[HOST CONFIG] cargado: ${adapterName}.json`);
  console.log(`[HOST CONFIG] cwd: ${config.cwd}`);

  return config;
}

/**
 * Resuelve el cwd: si es relativo, lo resuelve desde la raíz del backend.
 * Si es absoluto, lo retorna tal cual.
 */
function resolveCwd(cwd: string, adapterName: string): string {
  if (path.isAbsolute(cwd)) {
    return cwd;
  }
  // Relativo → resolver desde el directorio raíz del backend
  const backendRoot = path.join(__dirname, '..', '..');
  return path.resolve(backendRoot, cwd);
}

/**
 * Verifica que un comando existe en PATH.
 * En Windows usa 'where', en Unix usa 'which'.
 */
function verifyCommandInPath(command: string, configPath: string): void {
  try {
    const checkCmd = process.platform === 'win32' ? `where ${command}` : `which ${command}`;
    execSync(checkCmd, { stdio: 'pipe' });
  } catch {
    // No bloquear el pipeline por comandos que pueden estar en PATH en runtime
    // Solo advertir — el error real aparecerá al intentar spawnear
    console.warn(
      `[HOST CONFIG] ADVERTENCIA: comando "${command}" no encontrado en PATH.\n` +
      `Si Codex está instalado globalmente pero no en PATH del proceso, puede fallar en runtime.\n` +
      `Config: ${configPath}`
    );
  }
}

/**
 * Lista todos los adaptadores disponibles en el directorio hosts/.
 */
export function getAvailableAdapters(): string[] {
  if (!fs.existsSync(HOSTS_DIR)) return [];
  return fs.readdirSync(HOSTS_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace('.json', ''));
}
