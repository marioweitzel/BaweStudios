# Host runtimes boundary

This folder is the boundary between BaweStudio orchestration and guest-specific execution.

BaweStudio central backend must stay guest-neutral. It owns users, projects, chat history, database state, jobs, sockets, visible UI state and BaweStudio contracts such as:

```text
Parcial completado. Espero "continuar" para proseguir.
Finalizado.
```

Guest-specific details must not be added to `backend/src/index.ts`.

## Where To Change Things

Use this routing when fixing bugs:

```text
User/auth/project/chat/state/job bug
-> backend/src/index.ts or nearby BS services

Neutral host send/status/delete/evidence contract
-> backend/src/host-runtimes/HostRuntime.ts

Choosing the runtime for HOST_ADAPTER
-> backend/src/host-runtimes/HostRuntimeFactory.ts

Codex bridge URL, /codex/status, threadId, rollout, Codex cwd, codex-specific parsing
-> backend/src/host-runtimes/codex/

HTTP bridge process/PID/stdout/stderr/stop behavior for Codex
-> bridge/src/codex-bridge.js

Motor rules, dispatcher, skills, project files
-> root/bawestudios/ (read-only for the BaweStudio app agent)
```

## Do Not Duplicate Existing Boundaries

Already exists:

```text
HostManager + IHostAdapter
```

for the visible interview/chat session.

Already exists:

```text
HostRuntime + HostRuntimeFactory + codex/CodexRuntime
```

for background development, delete/status and future audit evidence.

If a future LLM cannot find Codex-specific behavior in `index.ts`, do not recreate it there. Look in `host-runtimes/codex/`.

## Current Runtime

Only Codex is implemented.

```text
HOST_ADAPTER=codex
-> HostRuntimeFactory
-> codex/CodexRuntime
-> bridge/src/codex-bridge.js
-> Codex CLI
```

Other guests should get their own folder and bridge instead of adding conditions to `index.ts`.
