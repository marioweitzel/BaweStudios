---
name: extension-prd-validation-gate
description: Validate one Extensión item's scoped PRD before it becomes build directives. Clone of prd-validation-gate, scoped to extension-prd.md.
---

# Extension PRD Validation Gate

## Purpose

Validate `.bawe/extension-prd.md` against `.bawe/extension-context.md` and
`.bawe/extension-log-preguntas.md` before this feature becomes operational
directives. Owns the routing pointer:

```text
[PROJECT_ROOT]/.bawe/extension-prd-validation-gate.json
```

## Inputs

- `.bawe/extension-prd.md`
- `.bawe/extension-context.md`
- `.bawe/extension-log-preguntas.md`
- `prd.md` — read-only, to check this feature does not silently contradict
  an existing business rule or an explicit original out-of-scope decision.

## Output

Always write or replace `.bawe/extension-prd-validation-gate.json`:

```json
{
  "status": "PASS | NEEDS_CORRECTION | BLOCKED",
  "findings": [],
  "next_node": "extension-adn-translator | extension-prd-generator | null"
}
```

Create `.bawe/` if it does not exist. Do not modify `extension-prd.md`
itself, and never modify `prd.md`.

## Procedure

1. Check the spec is complete: purpose, scope, flow, acceptance criteria,
   MVP vs out-of-scope for this feature are all present and concrete, not
   placeholders.
2. Check it does not silently contradict `prd.md`'s existing business rules
   or an explicit original out-of-scope decision — if it does, that is not
   a validation failure to fix quietly, it is a scope conflict to surface.
3. Check acceptance criteria are verifiable, not vague ("funciona bien").
4. Check open risks/ambiguities were recorded, not silently resolved by
   assumption where the client's words did not cover it.

## Rules

- `PASS` → `next_node = extension-adn-translator`.
- `NEEDS_CORRECTION` → `next_node = extension-prd-generator`, with concrete
  findings of what is missing or unclear.
- `BLOCKED` → the spec conflicts with existing product authority in a way
  that needs a human decision, not a rewrite; record the conflict plainly
  and set `next_node = null`.
- Do not create implementation artifacts or intermediate audit files.

## Exit

When stopping at this stage, the final assistant message must be exactly:

```text
Parcial completado. Espero "continuar" para proseguir.
```
