---
name: prd-validation-gate
description: Validate PRD completeness and write the PRD validation state pointer before NEXO translation.
---

# PRD Validation Gate

## Purpose

Validate `prd.md` against `project-context.md` and raw interview context before product intent becomes operational directives.

This gate owns the PRD validation pointer:

```text
[PROJECT_ROOT]/.bawe/prd-validation-gate.json
```

That file is the routing authority for the next session after `prd.md` exists.

## Inputs

- `prd.md`
- `project-context.md`
- `log-preguntas.md` when present
- `prd-spec-generator/assets/methodology/validation-rules.md`
- `prd-spec-generator/assets/base/prd-base.md`

## Output

Always write or replace:

```text
[PROJECT_ROOT]/.bawe/prd-validation-gate.json
```

Create `[PROJECT_ROOT]/.bawe/` if it does not exist.

Do not create implementation artifacts.
Do not create PRD input/audit intermediates.
Do not modify `prd.md`.

## Status Values

Return and persist exactly one status:

- `PASS`
- `NEEDS_CORRECTION`
- `BLOCKED`

## Validation Criteria

- The product goal is explicit.
- Target users and main flows are defined.
- Complete product scope and out-of-scope items are separated. The
  interview's priority answer is treated as the priority signal, not as a
  lower-quality product standard.
- Acceptance criteria are testable.
- Explicit client requirements from `log-preguntas.md` are preserved.
- Contradictions are surfaced.
- Technical implementation details are not treated as product requirements unless explicitly requested as product constraints.

## Pointer Schema

On `PASS`:

```json
{
  "gate_id": "prd-validation-gate",
  "owner": "prd-validation-gate",
  "status": "PASS",
  "validated_artifacts": ["prd.md", "project-context.md", "log-preguntas.md"],
  "next_node": "adn-translator",
  "findings": [],
  "created_at": "[ISO8601]"
}
```

On `NEEDS_CORRECTION`:

```json
{
  "gate_id": "prd-validation-gate",
  "owner": "prd-validation-gate",
  "status": "NEEDS_CORRECTION",
  "validated_artifacts": ["prd.md", "project-context.md", "log-preguntas.md"],
  "next_node": "prd-spec-generator",
  "repair_mode": true,
  "findings": ["[concise correction item]"],
  "created_at": "[ISO8601]"
}
```

On `BLOCKED`:

```json
{
  "gate_id": "prd-validation-gate",
  "owner": "prd-validation-gate",
  "status": "BLOCKED",
  "validated_artifacts": ["prd.md", "project-context.md", "log-preguntas.md"],
  "next_node": null,
  "blocking_reason": "[specific source contradiction or missing decision]",
  "findings": ["[concise blocking item]"],
  "created_at": "[ISO8601]"
}
```

## Rules

- If a contradiction affects scope, actors, primary flows or product
  scope, persist `BLOCKED`.
- If the PRD is incomplete but correctable from existing context, persist `NEEDS_CORRECTION`.
- If validation passes, persist `PASS` with `next_node = adn-translator`.
- The gate report is state, not product authority. Product authority remains `prd.md`.
- Do not continue to architecture, queue, code or implementation from this gate.

## Exit

Exit after writing `.bawe/prd-validation-gate.json`.

Routing after this gate is handled by `project-context-detector` on the next `continuar`, or by the current flow if it immediately reads the gate pointer.

When stopping at this stage, the final assistant message must be exactly:

```text
Parcial completado. Espero "continuar" para proseguir.
```
