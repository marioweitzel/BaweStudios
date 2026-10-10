import { HostRuntime, HostRuntimeOptions } from './HostRuntime';
import { CodexRuntime } from './codex/CodexRuntime';
import { ClaudeRuntime } from './claude/ClaudeRuntime';
import { OpenCodeRuntime } from './opencode/OpenCodeRuntime';
import { AutoHostRuntime } from './AutoHostRuntime';
import { ProjectRoutingHostRuntime } from './ProjectRoutingHostRuntime';

function buildHostRuntime(adapter: string, options: HostRuntimeOptions): HostRuntime {
  switch (adapter) {
    case 'codex':
      return new CodexRuntime(options);
    case 'claude-code':
      return new ClaudeRuntime(options);
    case 'opencode':
      return new OpenCodeRuntime(options);
    case 'auto':
      return new AutoHostRuntime(options);
    default:
      throw new Error(`[HOST RUNTIME] Runtime no implementado para HOST_ADAPTER="${adapter}".`);
  }
}

// El runtime de los trabajos de fondo respeta el CLI elegido en cada proyecto
// (preferredHostAdapter); HOST_ADAPTER solo decide cuando el proyecto no eligio.
export function createHostRuntime(options: HostRuntimeOptions): HostRuntime {
  const defaultRuntime = buildHostRuntime(process.env.HOST_ADAPTER || 'codex', options);
  return new ProjectRoutingHostRuntime(defaultRuntime, adapter => buildHostRuntime(adapter, options));
}
