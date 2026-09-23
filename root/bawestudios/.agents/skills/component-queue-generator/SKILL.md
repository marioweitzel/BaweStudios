---
name: component-queue-generator
description: Generate the reduced PRE_QUEUE component queue and stop before autonomous development.
---

# Component Queue Generator

## Purpose

Create the reduced queue that hands conceptual control to `AUTONOMOUS_DEVELOPMENT`.

## Inputs

- `prd.md`
- `project-context.md`
- `.bawe/build-directives.json`
- `.bawe/app-structure.json`
- `.bawe/role-matrix.json` when applicable.
- `.agents/schemas/component-queue.schema.json`

## Output

- `.bawe/component-queue.json`

## Reduced Queue Shape

Top-level keys:

- `schema_version`
- `project_id`
- `objectives`
- `active_objective_id`
- `dependencies`
- `status`
- `project_status`
- `blockers`
- `next_node` when the queue cannot start because an upstream PRE_QUEUE artifact
  needs correction, or when a later lifecycle stage needs an explicit handoff
- `next_skill` when `next_node` points to an installed skill
- `next_action`

Each objective may include:

- `id`
- `title`
- `summary`
- `status`
- `dependencies`
- `acceptance_reference`
- `surface_refs` for related `app-structure.surface_contracts[]`.
- `module_refs` for related `app-structure.module_boundaries[]`.
- `data_flow_refs` for related `app-structure.data_flow_contracts[]`.
- `visual_contract_refs` when the objective touches UI and app structure
  provides visual surface contracts.
- `visual_enrichment_refs` when the objective touches UI and app structure
  provides visual enrichment opportunities for the referenced surfaces.
- `design_system_ref` when the objective touches UI. Use
  `.bawe/app-structure.json.design_system`.
- `blockers`
- `next_action`

Allowed statuses:

- `PENDING`
- `ACTIVE`
- `NEEDS_VALIDATION`
- `NEEDS_CORRECTION`
- `BLOCKED`
- `READY_FOR_CLIENT_REVIEW`
- `SKIPPED`

Allowed project statuses:

- `IN_PROGRESS`
- `AWAITING_CLIENT_FACING_REVIEW`
- `BLOCKED`
- `NEEDS_CORRECTION`
- `AWAITING_DELIVERY_PREPARATION`
- `READY_FOR_CLIENT_REVIEW`

## Rules

- Queue objectives must trace back to PRD acceptance criteria or app structure.
- `acceptance_reference` must be semantically specific to the objective. Do not
  attach business rules or acceptance ids merely because they exist nearby in
  the PRD, share a broad feature area, or are useful project context. If no
  exact acceptance/rule id matches the objective, leave `acceptance_reference`
  empty or use the applicable surface/module/data-flow refs instead of adding
  unrelated BR ids.
- Each objective should point to the relevant blueprint sections instead of
  duplicating them.
- `surface_refs`, `module_refs`, `data_flow_refs`, `visual_contract_refs` and
  `visual_enrichment_refs` must reference ids or surface ids that exist in
  `.bawe/app-structure.json`.
- If a required blueprint reference is missing or inconsistent because an
  upstream PRE_QUEUE artifact is incomplete, set queue `status =
  NEEDS_CORRECTION`, `project_status = NEEDS_CORRECTION`,
  `active_objective_id = null`, `next_node` to the owning PRE_QUEUE repair
  node, `next_skill` to that skill path, add a concise blocker, and stop.
  Do not repair the blueprint in this stage.
- Use `BLOCKED` only when the queue cannot truthfully continue without a
  client/source decision, a source contradiction must be resolved, or the
  repair owner cannot be identified from the routing artifacts.
- UI objectives should preserve the relevant `surface_id` and selected visual
  references from `.bawe/app-structure.json`; do not reopen the visual catalog
  unless the app structure is missing the needed contract.
- UI objectives should preserve relevant
  `.bawe/app-structure.json.visual_architecture.visual_enrichment_opportunities`
  by surface in `visual_enrichment_refs`. The queue must not decide new imagery
  or create assets; it only carries the architecture decision to the active
  objective.
- If any objective touches UI, `.bawe/app-structure.json.design_system` must
  exist. If it is missing or lacks palette, typography, spacing scale, component
  primitives or state styles, set queue `status = NEEDS_CORRECTION`, add a
  concise blocker pointing back to the architecture skill selected by
  `.bawe/build-directives.json`, and stop before development.
- Every UI objective must include `design_system_ref` pointing to
  `.bawe/app-structure.json.design_system`.
- UI objectives must point to visual contracts that include perceived product
  quality expectations: hierarchy, composition, interaction polish, state
  feedback, copy quality, responsive behavior and product-specific identity
  cues. Do not duplicate those details into the queue.
- UI objectives must carry recommended visual enrichment opportunities when
  present for their surfaces. Do not duplicate the full rationale; point back to
  the app structure so autonomous development can decide the concrete
  implementation.
- If the first runnable objective touches UI, its `next_action` must explicitly
  require establishing the shared visual foundation from
  `build-directives.visual_product_standard` and
  `app-structure.design_system` + `app-structure.visual_architecture` before
  objective closure.
- Later UI objectives must say that they reuse and extend the existing shared
  design system; they must not invent a new visual language for that objective.
- When an objective references a UI surface and
  `.bawe/app-structure.json.visual_architecture.surface_contracts[]` contains
  that `surface_id`, include that id in `visual_contract_refs`.
- When an objective references a UI surface and
  `.bawe/app-structure.json.visual_architecture.visual_enrichment_opportunities[]`
  contains that `surface_id`, include that surface id in
  `visual_enrichment_refs`.
- If a UI objective has no visual contract for one of its surfaces, do not invent
  it in the queue. Set queue `status = NEEDS_CORRECTION`, add a concise blocker
  pointing back to the architecture skill selected by `.bawe/build-directives.json`,
  and stop before development.
- Do not put route helpers, redirects or non-visual surfaces in
  `visual_contract_refs`.
- For executable products, the first runnable objective must account for Docker
  runtime foundations needed to validate that objective:
  Dockerfiles, `docker-compose-local.yml`, `docker-compose-vps.yml`,
  `.env.example` and `.dockerignore`.
- Do not create a separate documentation objective for Docker. Treat those files
  as runtime artifacts required by the first objective that needs the app to
  run.
- Initialize exactly one objective as `ACTIVE` when a runnable objective exists; otherwise set `active_objective_id` to `null`.
- Set `project_status` to `IN_PROGRESS` unless a correction or blocker prevents
  all project work.
- Do not create implementation tasks beyond the declared complete product scope. Scope limits features; it does not lower professional quality,
  client-presentable copy, state handling or visual finish.
- Do not continue into autonomous development during PRE_QUEUE installation.

## Advancement

Queue advancement after each objective is governed by `.agents/contracts/project-lifecycle-contract.md`.

The queue is updated directly and minimally:

1. current objective -> `READY_FOR_CLIENT_REVIEW`;
2. next dependency-satisfied `PENDING` objective -> `ACTIVE`;
3. `active_objective_id` -> next objective id;
4. if no next objective exists, `active_objective_id` -> `null` and project closure is evaluated.

## Exit

Exit after the reduced queue exists and PRE_QUEUE stops.

The queue is the resume pointer after development starts. It must be readable
without loading the whole project:

- current `active_objective_id`;
- current objective status;
- blockers, if any;
- blueprint refs needed for the objective;
- next action.

Do not create handoff files, validation dossiers or parallel state files.

When stopping at this stage, the final assistant message must be exactly:

```text
Parcial completado. Espero "continuar" para proseguir.
```
