---
name: extension-queue-generator
description: Generate the small queue for one Extensión item and stop before development. Clone of component-queue-generator, scoped to extension-queue.json.
---

# Extension Queue Generator

## Purpose

Create `.bawe/extension-queue.json`: the objective(s) needed to build this
one feature, handing conceptual control to `extension-product-development`.

## Inputs

- `.bawe/extension-prd.md`
- `.bawe/extension-context.md`
- `.bawe/extension-build-directives.json`
- `.bawe/extension-app-structure.json`
- `.agents/schemas/component-queue.schema.json` — reuse the same objective
  shape for consistency, in a separate file.

## Output

`.bawe/extension-queue.json`, same shape as `.bawe/component-queue.json`:
`schema_version`, `project_id`, `objectives[]`, `active_objective_id`,
`dependencies`, `status`, `project_status`, `blockers`, `next_action`. Each
objective: `id`, `title`, `summary`, `status`, `dependencies`,
`acceptance_reference`, `surface_refs` (pointing into
`extension-app-structure.json`, never into `.bawe/app-structure.json`),
`design_system_ref` (pointing to `.bawe/app-structure.json.design_system`
read-only, since this feature reuses it), `next_action`.

## Rules

- Usually one objective is enough — this is one feature, not a product.
  Split into more than one only when the feature has genuinely independent
  parts that could ship separately (for example a backend trigger plus a
  visible history screen).
- Every objective must trace back to `extension-prd.md`'s acceptance
  criteria.
- If the feature touches UI, every UI objective needs `design_system_ref`
  and must instruct reusing the existing design system exactly, not
  planning a new one.
- If a required upstream artifact is missing or inconsistent, set
  `status = NEEDS_CORRECTION`, point `next_node`/`next_skill` back to the
  owning extension-track skill, and stop — do not repair it here.
- Never write to `.bawe/component-queue.json`.

## Next Step

Exit after `.bawe/extension-queue.json` exists — this stage does not chain
into development in the same turn. A later
`cambios <workspace_user_id> <project_name>` call resumes it, per
`edit-intake`'s Entry logic (`.bawe/extension-queue.json` having a
`PENDING`/`ACTIVE` item is itself the marker `extension-context-detector`
reads).

## Exit

When stopping at this stage, the final assistant message must be exactly:

```text
Parcial completado. Espero "continuar" para proseguir.
```
