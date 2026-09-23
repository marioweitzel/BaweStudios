/**
 * HostAdapterFactory — Selecciona y crea el adaptador correcto.
 *
 * Lee HOST_ADAPTER del entorno y devuelve la instancia correcta.
 * El HostManager NO conoce los adaptadores concretos — solo usa esta fábrica.
 *
 * Para agregar un nuevo huésped en el futuro:
 * 1. Crear backend/hosts/<name>.json
 * 2. Crear backend/src/adapters/<Name>HostAdapter.ts que implemente IHostAdapter
 * 3. Registrarlo en el switch de createAdapter()
 *
 * Nada más necesita cambiar.
 */

import { IHostAdapter } from './IHostAdapter';
import { FakeHostAdapter } from './FakeHostAdapter';
import { CodexHostAdapter } from './CodexHostAdapter';
import { ClaudeHostAdapter } from './ClaudeHostAdapter';
import { OpenCodeHostAdapter } from './OpenCodeHostAdapter';
import { AutoHostAdapter } from './AutoHostAdapter';

/**
 * createAdapter(adapterName?) — Crea el adaptador según el nombre dado.
 *
 * Si no se pasa nombre, lee process.env.HOST_ADAPTER.
 * Si no hay env var, usa 'fake' como default seguro.
 *
 * @param adapterName — Nombre del adaptador a crear (opcional)
 * @returns Instancia de IHostAdapter lista para usar
 */
export function createAdapter(adapterName?: string): IHostAdapter {
  const name = adapterName || process.env.HOST_ADAPTER || 'fake';

  console.log(`[HOST FACTORY] HOST_ADAPTER=${name}`);

  switch (name) {
    case 'fake':
      return new FakeHostAdapter();

    case 'codex':
      return new CodexHostAdapter();

    case 'claude-code':
      return new ClaudeHostAdapter();

    case 'opencode':
      return new OpenCodeHostAdapter();

    case 'auto':
      return new AutoHostAdapter();

    case 'vscode':
      // Placeholder — implementar VSCodeHostAdapter cuando esté listo
      throw new Error(
        '[HOST FACTORY] Adaptador "vscode" aún no implementado.\n' +
        'Crear VSCodeHostAdapter.ts y registrarlo en HostAdapterFactory.'
      );

    default:
      throw new Error(
        `[HOST FACTORY] Adaptador desconocido: "${name}".\n` +
        'Valores válidos: fake, codex, claude-code, opencode, auto, vscode'
      );
  }
}
