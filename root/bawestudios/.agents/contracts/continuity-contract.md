# Continuity Contract

Runtime authority: `.agents/contracts/continuity-contract.md`

This contract defines one minimal continuity source for a future LLM resume.

## Primary Source

Use:

```text
task-log.md
```

Do not create a parallel state system unless a later task explicitly installs one.

## Required Fields

Continuity must answer:

- `project_id`
- `current_objective`
- `objective_status`
- `project_status`
- `completed_work`
- `files_changed`
- `validations_run`
- `evidence_available`
- `blockers`
- `next_action`
- `last_updated`

Optional when useful:

- `active_objective_id`
- `scope_sources`
- `runtime_url`
- `known_debt`

## Status Values

Use:

- `IN_PROGRESS`
- `NEEDS_VALIDATION`
- `NEEDS_CORRECTION`
- `BLOCKED`
- `READY_FOR_CLIENT_REVIEW`
- `SKIPPED`

Project status values are:

- `IN_PROGRESS`
- `AWAITING_CLIENT_FACING_REVIEW`
- `NEEDS_CORRECTION`
- `BLOCKED`
- `AWAITING_DELIVERY_PREPARATION`
- `READY_FOR_CLIENT_REVIEW`

## Update Timing

Update continuity:

- after selecting an objective;
- after meaningful implementation work;
- after validations;
- after blockers;
- before ending the session;
- after user changes acceptance criteria.

Do not update continuity after every micro-step just to satisfy a schema.

## Evidence Model

Evidence is a list of actual artifacts or concise summaries:

```text
- build: command/result
- api: endpoint/result
- db: query/migration/result
- ui: screenshot paths
- browser: console summary
- visual: findings summary
- docker: compose result
```

## Minimal task-log.md Shape

```md
# Task Log - BaWe

## Current State
- project_id:
- current_objective:
- objective_status:
- blockers:
- next_action:
- last_updated:
- exit_contract: the same exact phrase from professional-closure-contract.md's "Whole Project Closure" (line ~204) is ALSO required by the active development skill for every objective pause, not only when the whole project is done — re-check before writing any response that stops before finishing all queued work.

## Completed Work
- ...

## Files Changed
- ...

## Validations Run
- ...

## Evidence Available
- ...

## Known Debt
- ...
```

## Relation To Queue

The reduced queue may hold:

- ordered objectives/features;
- active objective;
- dependencies;
- status.

Continuity records the current work state in prose.

After an objective reaches `READY_FOR_CLIENT_REVIEW`, continuity must record the queue advancement result:

- previous objective;
- new active objective or `none`;
- project status;
- next action.

Do not duplicate the full queue in `task-log.md`.

When updating `.bawe/component-queue.json` or any runtime JSON alongside
continuity, write JSON as UTF-8 without BOM and verify strict JSON parsing
before ending the session. If the updated JSON previously had BOM, rewrite the
updated file without BOM instead of preserving it.

On Windows PowerShell 5.1, do not use `Set-Content -Encoding UTF8` or
`Out-File -Encoding UTF8` for runtime JSON. Use:

```powershell
$json = $object | ConvertTo-Json -Depth 20
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($path, $json, $utf8NoBom)
```

## Blocker Handling

A blocker must include:

- condition;
- evidence;
- what was attempted;
- what is needed;
- independent work still possible, if any.

Do not mark a task ready if a blocker affects the requested product outcome.
