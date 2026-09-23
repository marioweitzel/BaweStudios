---
name: extension-facing-review
description: Independently review one Extensión item's touched surfaces as a paying client before it reaches delivery. Clone of client-facing-product-review, scoped to the objectives in extension-queue.json instead of the whole product. Reached only from extension-product-development's Refreshing Delivery, never directly from the dispatcher.
---

# Extension Facing Review

## Purpose

Review what this Extensión item actually built as a buyer/client, not as the
developer that built it — same intent as `client-facing-product-review`, but
scoped to one feature instead of the whole product. This exists because a
feature can pass every technical gate (`testing-gate`,
`security-baseline-gate`, `a11y-validation-gate`) and still look wrong on a
real screen — a visual/aesthetic failure that no functional check catches.

This is not final delivery packaging. It is the independent review between
this feature's development completion and `delivery-package-preparation`.

## Session Boundary

Reached only from `extension-product-development`'s "Refreshing Delivery",
in the same background session — never directly from the dispatcher, never
in a live client-facing turn.

If the same session developed this feature, ignore prior developer closure
claims for it. Base the verdict only on `extension-prd.md`, the objective's
declared surfaces, runtime behavior and captured evidence — not on what the
developer step said it finished.

Do not read developer closure summaries, known-debt excuses or final claims
before forming the independent verdict. `task-log.md` may be read only for
operational facts such as runtime URL, run commands, credentials location or
existing screenshot paths.

## Required Inputs

- `.bawe/extension-queue.json` — objectives that reached
  `READY_FOR_CLIENT_REVIEW` are what this review covers; nothing else in the
  product.
- `.bawe/extension-prd.md`
- `.bawe/extension-context.md`
- `.bawe/extension-app-structure.json` — `surface_refs` of the reviewed
  objective(s) define the surface inventory for this review.
- `.bawe/app-structure.json` — read-only, for `design_system` coherence and
  to know what already existed before this feature.
- running app or equivalent runtime instructions from `task-log.md`
- `.agents/schemas/extension-client-facing-review.schema.json`
- `.agents/contracts/runtime-environment-contract.md`

## Output

Write:

```text
.bawe/extension-client-facing-review.json
```

The JSON must conform to
`.agents/schemas/extension-client-facing-review.schema.json`.

Then, only on `NEEDS_CORRECTION` or `BLOCKED`, update
`.bawe/extension-queue.json` and `task-log.md` per "Queue Update" below. On
`PASS`, leave `.bawe/extension-queue.json` as-is — the caller
(`extension-product-development`) owns marking it `DONE` once delivery is
refreshed.

## Review Procedure

1. Read the required inputs.
2. Derive the surface inventory from the `surface_refs` of every objective
   in `.bawe/extension-queue.json` with status `READY_FOR_CLIENT_REVIEW` —
   not the whole product's routes. If an objective's changes are inherently
   product-wide (for example a global visual layer applied across existing
   screens), its `surface_refs` should already reflect that breadth; review
   exactly what it declares, no more, no less.
3. Do not rely only on remembered, recently touched or already captured
   screens.
4. Run or open the app using the existing runtime path. Do not implement
   corrections.
5. Review as a paying client across applicable coverage for this feature:
   - each declared business role that can reach these surfaces;
   - normal, empty, error and success states when reachable;
   - every form factor/viewport this product actually targets, per
     `project-context.md`/`app-structure.json` — do not assume desktop and
     mobile web if the product is native mobile, or vice versa.
6. Follow this feature's flow end to end from the client perspective:
   visible actions must do real work, permission boundaries must hold,
   saved data must reappear where the feature promises it, and failures
   must show recoverable user-facing states.
7. Capture or reuse enough screenshots to support the verdict. Missing
   coverage of a declared surface is a finding unless not applicable.
8. For every captured or reused screenshot, inspect the visible body text
   from that same surface for mojibake, replacement characters or broken
   accents, same as `client-facing-product-review`.
9. If a captured surface contains broken visible text, create a finding
   mapped to that surface.
10. Compare what the client sees against `extension-prd.md`'s acceptance
    criteria and against `.bawe/app-structure.json.design_system` — this
    feature must look like it belongs to the same product, not a bolted-on
    addition.

## Blocking Signals

Fail the review if any surface this feature touches contains:

- visible demo, prueba, seed, local, mock or placeholder artifacts;
- visible default/test/local credentials;
- QA, readiness, validation, test or demo data mixed into the client
  experience;
- visible mojibake, replacement characters or broken accents in
  source-rendered copy, API-fed copy, persisted seed/DB data, or messages
  created during a reviewed flow;
- internal construction copy;
- references to reusable components, foundation, scaffolding, queue,
  technical proof, validation state or implementation progress;
- a new signature element, accent color, motion language or icon style that
  was not there before, unless `extension-prd.md` explicitly authorized a
  new visual language for this feature;
- a legibility or usability regression on any existing surface this
  feature's changes now overlay or wrap (for example: a background, overlay
  or new layer that makes existing text/controls harder to read or use than
  before this feature shipped);
- core developed flows that fail, silently discard data, bypass role
  boundaries or expose raw technical errors to the client;
- UI that works technically but does not look like software a client paid
  for.

Visible client-facing review debt is blocking. It cannot be recorded as
non-blocking known debt.

## JSON Shape

Use this exact top-level shape:

```json
{
  "gate_id": "extension-facing-review",
  "status": "PASS",
  "project_id": "",
  "extension_objective_ids": [],
  "reviewed_at": "",
  "surface_inventory_complete": true,
  "reviewed_as_paid_product": true,
  "inventory_sources": ["extension_queue", "extension_app_structure", "renderable_components"],
  "reviewed_roles": [],
  "reviewed_surfaces": [],
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
  "id": "EFR-001",
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

On `PASS`: do not modify `.bawe/extension-queue.json`. Return control to
`extension-product-development`, which continues to delivery.

On `NEEDS_CORRECTION`:

- group findings into correction objectives, one per coherent
  surface/workflow area;
- create only correction objectives required to remove client-visible
  review failures or restore this feature's visual/functional coherence —
  do not invent new scope beyond `extension-prd.md`;
- append correction objectives to `.bawe/extension-queue.json`'s
  `objectives[]`, each `status: PENDING` except the first, which is
  `ACTIVE`;
- set `active_objective_id` to the first correction objective's id;
- set the queue's own `status` to `NEEDS_CORRECTION`;
- set `next_action` to the first correction objective;
- record the findings in `task-log.md`, tagged `[extension]`.

Correction objective ids must be stable and readable:

```text
EFR-FIX-001
EFR-FIX-002
```

On `BLOCKED`:

- set the queue's own `status` to `BLOCKED`;
- keep `active_objective_id` as `null` unless a concrete correction
  objective can unblock the review;
- record the blocking reason and next action in `task-log.md`, tagged
  `[extension]`.

## Exit

This skill is not client-facing and does not stop the turn on its own.

- On `PASS`: read and execute
  `[WORKSPACE_ROOT]/.agents/skills/delivery-package-preparation/SKILL.md` is
  the caller's job, not this skill's — return to
  `extension-product-development`'s "Refreshing Delivery" step 2.
- On `NEEDS_CORRECTION`: return to `extension-product-development`'s
  "Development Cycle" for the newly `ACTIVE` correction objective, in this
  same turn.
- On `BLOCKED`: stop here per `extension-product-development`'s own
  lifecycle rules for a blocked queue.

If, and only if, this review itself cannot finish within the current turn
(for example the surface inventory is unusually large), emit exactly
`[[BAWE_CAMBIOS_EDICION_PARCIAL]]` — the same marker
`extension-product-development` already uses for an unfinished turn. Never
emit `[[BAWE_CAMBIOS_EDICION_FINALIZADA]]` from this skill; only the caller,
after delivery is actually refreshed, may consider the work finished.
