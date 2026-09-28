/**
 * HostRuntimeDetector — Resuelve, en modo HOST_ADAPTER=auto, cual adapter
 * usar probando directamente la salud de cada bridge candidato (GET
 * /health) en el orden de HOST_ADAPTER_PREFERENCE.
 *
 * Ya no consulta host-detect.js. Cada bridge (codex-bridge.js,
 * claude-bridge.js, opencode-bridge.js) se niega a abrir su puerto si su CLI
 * no esta instalado (ver el chequeo al final de cada uno) -- entonces
 * "responde /health" ya implica "el CLI esta instalado Y el bridge esta
 * efectivamente corriendo ahora", una sola señal en vez de dos desacopladas
 * (instalacion via host-detect.js + vida del proceso, que podian
 * contradecirse).
 */

export type AdapterHealthUrls = Record<string, string>;

export const DEFAULT_ADAPTER_HEALTH_URLS: AdapterHealthUrls = {
  'claude-code': process.env.CLAUDE_BRIDGE_HEALTH_URL || 'http://host.docker.internal:5001/health',
  codex: process.env.CODEX_BRIDGE_HEALTH_URL || 'http://host.docker.internal:5000/health',
  opencode: process.env.OPENCODE_BRIDGE_HEALTH_URL || 'http://host.docker.internal:5002/health'
};

async function isHealthy(url: string, timeoutMs: number): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export function parseAdapterPreference(raw: string | undefined, defaultPreference: string[]): string[] {
  if (!raw || !raw.trim()) return defaultPreference;
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}

/**
 * resolveHealthyAdapter — Nunca lanza. Prueba /health de cada nombre en
 * `preference`, en orden, y devuelve el primero que responda ok. Nombres en
 * `preference` sin URL conocida en `healthUrls` se saltean. Si ninguno
 * responde, devuelve `fallback` sin haber confirmado nada sobre el.
 */
export async function resolveHealthyAdapter(
  preference: string[],
  healthUrls: AdapterHealthUrls,
  fallback: string,
  timeoutMs = 2000
): Promise<string> {
  for (const name of preference) {
    const url = healthUrls[name];
    if (!url) continue;
    if (await isHealthy(url, timeoutMs)) {
      return name;
    }
  }
  return fallback;
}

/**
 * checkAllAdaptersHealth — Para el selector de CLI del sidebar: chequea
 * TODOS los adapters conocidos en paralelo (no se detiene en el primero que
 * responda, a diferencia de resolveHealthyAdapter) y devuelve cuales estan
 * realmente disponibles ahora mismo.
 */
export async function checkAllAdaptersHealth(
  healthUrls: AdapterHealthUrls,
  timeoutMs = 2000
): Promise<Record<string, boolean>> {
  const names = Object.keys(healthUrls);
  const results = await Promise.all(names.map(name => isHealthy(healthUrls[name], timeoutMs)));
  const byName: Record<string, boolean> = {};
  names.forEach((name, i) => { byName[name] = results[i]; });
  return byName;
}
