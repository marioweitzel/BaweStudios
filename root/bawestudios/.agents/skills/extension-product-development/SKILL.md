---
name: extension-product-development
description: Full-rigor development cycle for one Extensión item's queue on an already-delivered project. Clone of autonomous-product-development, scoped to extension-*.
---

# Extension Product Development

## Purpose

Build the objective(s) in `.bawe/extension-queue.json` as a real vertical
product slice — same rigor as building any new capability, because it is
one: new data, new roles, new surfaces are all allowed here, unlike
`edit-product-development`'s low-impact track. The only difference from
building this feature as part of the original product is that it happens
after delivery, on its own files, without touching the original ones.

This skill is not client-facing. It is reached only through
`extension-context-detector`, never directly from the dispatcher.

Once reached, work silently — do not send any conversational message to
whoever is watching this session until the queue is fully processed or
work must pause. The only two valid outputs are the exact pause phrase and
the exact completion phrase defined under Queue And Lifecycle below;
nothing else should reach the caller in between.

## Required Inputs

- `.bawe/extension-prd.md`
- `.bawe/extension-context.md`
- `.bawe/extension-build-directives.json`
- `.bawe/extension-app-structure.json`
- `.bawe/extension-queue.json`
- `task-log.md`

## Read-Only Reference (never write to these)

- `prd.md`, `project-context.md` — the original product's authority; this
  feature must stay coherent with them, never contradict them silently.
- `.bawe/app-structure.json` — its `design_system` is the only visual
  language this feature may use. Its `surfaces`/`module_boundaries` show
  what already exists, to avoid rebuilding something that is already
  there.
- `.bawe/component-queue.json` — never read for routing decisions here;
  build-pipeline state is a separate track.

## Authority Model

Product authority for this feature, in order: `.bawe/extension-prd.md`,
`.bawe/extension-context.md`, explicit client clarifications recorded
during `extension-initialization-logic`.

Operational authority: `.bawe/extension-build-directives.json`, the active
objective from `.bawe/extension-queue.json`, `.bawe/extension-app-structure.json`.

If this feature's authority conflicts with the original product's `prd.md`
or `.bawe/app-structure.json`, stop and record the conflict in
`task-log.md` — do not silently override the original product's decisions.

## Blueprint Reading

Use `.bawe/extension-queue.json` as the resume pointer. For the active
objective, read its `surface_refs` from `.bawe/extension-app-structure.json`
first; read the relevant parts of the existing `.bawe/app-structure.json`
(surfaces, module boundaries, `design_system`) only as needed to stay
coherent with the real product. Do not reread unrelated original surfaces.

## Visual Contract

When the objective touches UI:

1. Reuse `.bawe/app-structure.json.design_system` exactly — palette,
   typography, signature element, motion, restraint rules, component
   primitives, radius, icons. This is not a new product; it must look like
   the same one.
2. Use the surface contract from `.bawe/extension-app-structure.json` for
   this feature's own layout/composition needs.
3. Do not introduce a new signature element, a new accent color, a new
   motion language or a new icon style. If the feature seems to need one,
   that is a sign it was misclassified as Extensión-scoped-addition and
   should be flagged in `task-log.md` instead of improvised.

## Development Cycle

Same cycle as `autonomous-product-development`:

```text
UNDERSTAND -> INSPECT -> PLAN LOCALLY -> IMPLEMENT -> REVIEW CODE STRUCTURE
-> RUN THE APP OR RELEVANT CHECKS -> NAVIGATE THE REAL FLOW WHEN UI EXISTS
-> CORRECT -> REVALIDATE -> PROFESSIONAL SELF CHECK
-> REQUEST PROFESSIONAL CLOSURE -> UPDATE CONTINUITY
```

## Docker Runtime

Same runtime contract as the original build: executable products validate
through `docker-compose-local.yml` (Windows Docker Desktop) before
readiness, and keep `docker-compose-vps.yml` current. Do not deploy to the
VPS unless explicitly asked.

## Self Validation And Closure

1. Activate `.agents/contracts/self-validation-contract.md` — it already
   applies regardless of whether the change came from original
   construction or a post-delivery extension; no changes needed there.
2. Run applicable validations for the surface actually touched:
   `visual-quality-gate`, `a11y-validation-gate`, `security-baseline-gate`,
   `docker-validation-gate`, `testing-gate`, etc., by the same
   applicability rules as always.
3. Correct blockers, revalidate.
4. Activate `.agents/contracts/professional-closure-contract.md` for the
   closure decision.

Allowed objective statuses: same as the original —
`IN_PROGRESS`, `NEEDS_VALIDATION`, `NEEDS_CORRECTION`, `BLOCKED`,
`READY_FOR_CLIENT_REVIEW`, `SKIPPED`.

## Refreshing Delivery

Once every objective in `.bawe/extension-queue.json` reaches
`READY_FOR_CLIENT_REVIEW`:

1. Read and execute
   `[WORKSPACE_ROOT]/.agents/skills/extension-facing-review/SKILL.md` to
   independently review this feature as a client before packaging it.
   - On `PASS`: continue to step 2 below, in this same turn.
   - On `NEEDS_CORRECTION`: `extension-facing-review` already appended
     correction objectives to `.bawe/extension-queue.json` and set one
     `ACTIVE`. Return to "Development Cycle" above for that objective in
     this same turn; do not proceed to delivery.
   - On `BLOCKED`: stop here; do not proceed to delivery.
2. Read and execute
   `[WORKSPACE_ROOT]/.agents/skills/delivery-package-preparation/SKILL.md`
   to refresh `delivery/[project_name]/` and its zip from the updated
   source.
3. Set the extension queue's own `status` to `DONE`.
4. Record in `task-log.md`, tagged `[extension]`, what was built, what was
   validated (including that the independent client-facing review passed)
   and that delivery was refreshed, and update its `Current State` header
   block (`current_objective`, `project_status`, `next_action`,
   `last_updated`) — do not leave it showing the state from before this
   session.

## Queue And Lifecycle

Same advancement logic as the original, scoped to
`.bawe/extension-queue.json`: mark the objective `READY_FOR_CLIENT_REVIEW`,
select the next `PENDING` objective if any, or finish per "Refreshing
Delivery" above if none remain.

### Signaling The Result

Writing a summary of what was built and validated in your final response is
normal and expected — do not suppress it. BaweStudio detects the outcome
mechanically, by searching the raw response for one exact marker, not by
reading your summary. Include the correct marker verbatim, on its own line,
anywhere in the response — before, after or in the middle of your summary
does not matter, as long as the exact bracketed text is present unmodified
(no markdown bold around it, no translation, no paraphrase):

- A session stops mid-way (another `PENDING` objective remains, or work is
  blocked):

```text
[[BAWE_CAMBIOS_EDICION_PARCIAL]]
```

  This means still in progress, not finished — a later
  `cambios <workspace_user_id> <project_name>` call resumes it through
  `edit-intake` → `extension-context-detector` (never `continuar`, that
  routes to the original build pipeline).

- No `PENDING` objective remains and "Refreshing Delivery" completed:

```text
[[BAWE_CAMBIOS_EDICION_FINALIZADA]]
```

  Same marker and same meaning as `edit-product-development`'s completion
  signal — BaweStudio does not need to know which internal track did the
  work, only that the client's request is finished, with no further
  `cambios` call needed.

Never write both markers in the same response. Never write a marker whose
condition is not actually true. These are deliberately different tokens
from `Parcial completado.`/`Finalizado.` (the original pipeline's signals)
— the two tracks must stay distinguishable even if a response gets
truncated or reordered.

## Rules

- Never touch `.bawe/component-queue.json`, `prd.md`, `project-context.md`
  or `.bawe/app-structure.json` — read-only reference only, as above.
- Do not implement anything outside this feature's own objective(s).
- Do not close by build pass, HTTP 200, Docker healthy or one happy path
  alone — same discipline as the original.
- Do not skip validation because the product was already delivered once;
  a new capability needs the same closure rigor as any first-time build.
