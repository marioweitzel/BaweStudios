---
name: extension-architecture
description: Add the structural plan for one Extensión item without touching the existing product's architecture. Clone of architecture/software-product-architect, scoped to one addition.
---

# Extension Architecture

## Purpose

Plan how one new capability fits into an already-built product: what, if
any, new surface, route, data entity or module it needs. Reuse the
existing product's `design_system` exactly as it is — this is never a
chance to redesign it.

## Inputs

- `.bawe/extension-prd.md`
- `.bawe/extension-context.md`
- `.bawe/extension-build-directives.json`
- `.bawe/app-structure.json` — read-only. Its `design_system` (palette,
  typography, signature_element, motion, restraint_rules,
  component_primitives, radius, icons) is the only visual language this
  feature is allowed to use.
- `.agents/schemas/app-structure.schema.json`

## Output

`.bawe/extension-app-structure.json`:

```yaml
feature_id: ""
depends_on_design_system: true   # always true — never redefine it here
new_surfaces: []                 # zero or more, only if this feature needs a screen/view that does not exist yet
new_module_boundaries: []
new_data_flow_contracts: []
new_data_entities: []            # only if the feature needs to store something new
role_changes: []                 # only if a role needs a new permission for this feature
```

Each entry in `new_surfaces[]`, when present, follows the same shape as a
`surface_contract` in the original `app-structure.json` — `surface_id`,
`visual_intent`, `perceived_quality_bar`, `layout_anatomy`,
`state_feedback`, `responsive_expectations` — but must explicitly reuse the
existing `design_system` tokens, never invent new ones.

## Rules

- Never write to `.bawe/app-structure.json`. Read its `design_system` and
  reuse it exactly — same palette, same signature element, same motion and
  restraint rules that already exist. This feature must look like the same
  product, not a different one glued on.
- If the feature needs no new screen (a backend-only capability, a
  notification trigger, a report generated but shown inside an existing
  view), leave `new_surfaces` empty — do not invent a UI just to have
  something to plan.
- If the feature genuinely needs a new data entity or role permission,
  record it here; do not silently skip it and do not modify
  `.bawe/role-matrix.json` — that stays out of scope for this track's
  first version; record a blocker in `task-log.md` if a role conflict
  appears.
- Do not write application source code.
- Do not fabricate business facts, brand assets or imagery beyond what
  `extension-prd.md` describes.

## Next Step

After writing `.bawe/extension-app-structure.json`, read and execute
`extension-queue-generator/SKILL.md`.

## Exit

When stopping at this stage, the final assistant message must be exactly:

```text
Parcial completado. Espero "continuar" para proseguir.
```
