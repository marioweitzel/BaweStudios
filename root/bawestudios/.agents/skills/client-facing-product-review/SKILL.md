---
name: client-facing-product-review
description: Independently review a completed BaWe product as a paying client before delivery preparation. Use when component-queue.json has project_status AWAITING_CLIENT_FACING_REVIEW or next_node client-facing-product-review; inventories all reachable client-facing surfaces, navigates real flows by role/state/viewport, writes .bawe/client-facing-product-review.json, and updates the queue for correction or the next delivery stage.
---

# Client-Facing Product Review

## Purpose

Review the completed product as a buyer/client, not as the developer that built
it.

This stage is not final delivery packaging. It is the independent product
evaluation between development completion and later delivery preparation.

## Session Boundary

This skill is designed for a fresh session.

If the same session developed the product, ignore prior developer closure
claims. Base the verdict only on product authority, route/surface inventory,
runtime behavior and captured evidence.

Do not read developer closure summaries, known-debt excuses or final claims
before forming the independent verdict. `task-log.md` may be read only for
operational facts such as runtime URL, run commands, credentials location or
existing screenshot paths.

## Required Inputs

- `.bawe/component-queue.json`
- `prd.md`
- `project-context.md`
- `.bawe/app-structure.json`
- `.bawe/role-matrix.json` when roles exist
- running app or equivalent runtime instructions from `task-log.md`
- `.agents/schemas/client-facing-product-review.schema.json`
- `.agents/contracts/runtime-environment-contract.md`

## Output

Write:

```text
.bawe/client-facing-product-review.json
```

The JSON must conform to
`.agents/schemas/client-facing-product-review.schema.json`.

Then update `.bawe/component-queue.json` and `task-log.md`.

The final assistant message must be exactly:

```text
Parcial completado. Espero "continuar" para proseguir.
```

## Review Procedure

1. Read the required inputs.
2. Derive the client-facing surface inventory from:
   - routes;
   - navigation;
   - guards/protected route behavior;
   - role matrix;
   - `.bawe/app-structure.json.surfaces[]`;
   - renderable pages/components discovered in code when needed.
3. Do not rely only on remembered, recently touched or already captured screens.
4. Run or open the app using the existing runtime path. Do not implement
   corrections.
5. Review as a paying client across applicable coverage:
   - unauthenticated user;
   - each declared business role;
   - restricted route or direct URL access;
   - normal, empty, error and success states when reachable;
   - desktop and mobile viewports.
6. Follow the developed product flows end to end from the client perspective:
   visible actions must do real work, permission boundaries must hold, saved
   data must reappear where the product promises it, and failures must show
   recoverable user-facing states.
7. Capture or reuse enough screenshots to support the verdict. Missing coverage
   is a finding unless the surface/state is not applicable.
8. For every captured or reused screenshot, inspect the visible body text from
   that same surface. Check source-rendered copy, API-fed copy, persisted DB/seed
   values and success/error messages produced by the reviewed flow for mojibake,
   replacement characters or broken accents.
9. If a captured surface contains broken visible text, create a finding mapped
   to that surface. The correction objective must include that surface in
   `target_surfaces`; do not rely on a broader data-cleanup finding to cover it.
10. Compare what the client sees against `prd.md`, `project-context.md` and the
   declared Complete product scope.

## Blocking Signals

Fail the review if any reachable client-facing surface contains:

- visible demo, prueba, seed, local, mock or placeholder artifacts;
- visible default/test/local credentials;
- QA, readiness, validation, test or demo data mixed into the client
  experience;
- visible mojibake, replacement characters or broken accents in source-rendered
  copy, API-fed copy, persisted seed/DB data, or messages created during a
  reviewed flow. Suspicious patterns include `Ã`, `Â`, `�`, `ï¿½`, and `?` inside
  a word or phrase where an accented character should render;
- internal construction copy;
- references to "proximas pantallas", reusable components, foundation,
  scaffolding, queue, technical proof, validation state or implementation
  progress;
- `build priorities` as visible product wording;
- raw CRUD/spreadsheet screens without hierarchy, intent or product-specific
  presentation;
- routes that expose construction states;
- navigation or actions that promise more than the system delivers;
- core developed flows that fail, silently discard data, bypass role boundaries
  or expose raw technical errors to the client;
- UI that works technically but does not look like software a client paid for.

Visible client-facing review debt is blocking. It cannot be recorded as
non-blocking known debt.

## JSON Shape

Use this exact top-level shape:

```json
{
  "gate_id": "client-facing-product-review",
  "status": "PASS",
  "project_id": "",
  "reviewed_at": "",
  "surface_inventory_complete": true,
  "reviewed_as_paid_product": true,
  "inventory_sources": ["routes", "navigation", "guards", "role_matrix", "app_structure", "renderable_components"],
  "reviewed_roles": [],
  "reviewed_routes": [],
  "reviewed_states": [],
  "reviewed_viewports": [],
  "evidence": [],
  "internal_build_language_found": false,
  "demo_artifacts_visible": false,
  "unfinished_surface_found": false,
  "client_ready_verdict": true,
  "findings": [],
  "correction_objectives": [],
  "next_node": "delivery-package-preparation"
}
```

Allowed `status` values:

- `PASS`
- `NEEDS_CORRECTION`
- `BLOCKED`

Each finding must use:

```json
{
  "id": "CFPR-001",
  "severity": "BLOCKING",
  "surface": "",
  "role": "",
  "viewport": "",
  "issue": "",
  "evidence": "",
  "mapped_objective_id": "",
  "recommended_correction": ""
}
```

## Queue Update

On `PASS`:

- keep all objectives `READY_FOR_CLIENT_REVIEW` or justified `SKIPPED`;
- set `active_objective_id` to `null`;
- set queue `status` to `READY_FOR_CLIENT_REVIEW`;
- set `project_status` to `AWAITING_DELIVERY_PREPARATION`;
- set `next_node` to `delivery-package-preparation`;
- set `next_skill` to `delivery-package-preparation/SKILL.md`;
- set `next_action` to say the client-facing review passed and the next stage
  is delivery package/bridge preparation.

On `NEEDS_CORRECTION`:

- group findings into correction objectives;
- prefer one correction objective per coherent surface/workflow area;
- create only correction objectives required to remove client-visible review
  failures or restore professional product quality inside existing scope;
- do not invent new business features;
- set the first correction objective to `ACTIVE`;
- set later correction objectives to `PENDING`;
- set `active_objective_id` to the first correction objective id;
- set queue `status` to `NEEDS_CORRECTION`;
- set `project_status` to `NEEDS_CORRECTION`;
- set `next_node` to `autonomous-product-development`;
- set `next_skill` to `autonomous-product-development/SKILL.md`;
- set `next_action` to the first correction objective.

Correction objective ids must be stable and readable:

```text
CFPR-FIX-001
CFPR-FIX-002
```

On `BLOCKED`:

- set queue `status` to `BLOCKED`;
- set `project_status` to `BLOCKED`;
- keep `active_objective_id` as `null` unless a concrete correction objective can
  unblock the review;
- record the blocking reason and next action.

## Exit Message

Do not summarize status, artifacts, findings or next stage in the assistant
message. Persist them in `.bawe/client-facing-product-review.json`,
`.bawe/component-queue.json` and `task-log.md`.

The final assistant message must be exactly:

```text
Parcial completado. Espero "continuar" para proseguir.
```
