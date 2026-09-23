import { HostRuntime, HostRuntimeOptions } from './HostRuntime';
import { CodexRuntime } from './codex/CodexRuntime';
import { ClaudeRuntime } from './claude/ClaudeRuntime';
import { OpenCodeRuntime } from './opencode/OpenCodeRuntime';
import { AutoHostRuntime } from './AutoHostRuntime';

export function createHostRuntime(options: HostRuntimeOptions): HostRuntime {
  const adapter = process.env.HOST_ADAPTER || 'codex';

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
