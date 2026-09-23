---
name: extension-context-generator
description: Turn a finished extension interview into processed context for one Extensión item. Clone of project-context-generator, scoped to a single new capability.
---

# Extension Context Generator

## Purpose

Process `.bawe/extension-log-preguntas.md` into `.bawe/extension-context.md`
— raw material for `extension-prd-generator`, scoped to one new capability
on an already-existing product. Never regenerate `project-context.md`.

## Inputs

- `.bawe/extension-log-preguntas.md`
- `project-context.md` and `prd.md` — read-only, to understand the existing
  product this feature is being added to; never modify them.

## Output

`.bawe/extension-context.md`, short:

```yaml
__metadata:
  created_by: "extension-context-generator"
  created_at: "[ISO8601]"

feature:
  title: ""
  origin: "client_change_request"
  client_request_raw: ""
  reference_assets: []

purpose: ""
surface: ""
main_flow: ""
roles_involved: []
data_involved: []
external_integration: ""

mvp_for_this_feature:
  - ""
explicitly_out_of_scope_for_now:
  - ""

assumptions:
  - field: ""
    value: ""
    source: "ENGINE_INFERENCE | LLM_INTERPRETATION"
    justification: ""

open_ambiguities:
  - field: ""
    issue: ""
    resolution_mode: "defer_to_extension_prd | ask_client_if_blocking"

current_status:
  last_completed_node: "extension-context-generator"
  next_node: "extension-prd-generator"
```

## Rules

- Use only answers already in `extension-log-preguntas.md`; do not invent
  facts. Mark anything inferred as `assumptions`, not as client fact.
- Read `project-context.md`/`prd.md` only to keep this feature coherent
  with the existing product (its roles, its stack, its scale) — never copy
  their content wholesale and never write to them.
- Keep it short. This is one feature, not a product — do not add the full
  weight of `project-context.md`'s schema (no `visual_dna` product-context
  block, no confidence matrix, no traceability table).
- Do not prescribe exact UI or exact architecture; that is
  `extension-architecture`'s job.

## Next Step

After writing `.bawe/extension-context.md`, read and execute
`extension-prd-generator/SKILL.md`.

## Exit

When stopping at this stage, the final assistant message must be exactly:

```text
Parcial completado. Espero "continuar" para proseguir.
```
