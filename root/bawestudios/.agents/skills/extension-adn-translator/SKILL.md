---
name: extension-adn-translator
description: Translate one Extensión item's validated spec into its own build directives. Clone of adn-translator, scoped to extension-*.
---

# Extension ADN Translator

## Purpose

Translate the validated `.bawe/extension-prd.md` and
`.bawe/extension-context.md` into `.bawe/extension-build-directives.json` —
operational directives for this one feature only.

## Inputs

- `.bawe/extension-prd.md`
- `.bawe/extension-context.md`
- `.bawe/extension-prd-validation-gate.json`
- `.bawe/build-directives.json` — read-only. The original product's stack,
  runtime and `visual_product_standard` stay authoritative; this feature
  inherits them, it does not redefine them.

## Output

`.bawe/extension-build-directives.json`

## Rules

- Execute only when `.bawe/extension-prd-validation-gate.json` exists and
  has `status = PASS`. If missing, read
  `extension-prd-validation-gate/SKILL.md` instead. If
  `NEEDS_CORRECTION` or `BLOCKED`, do not translate; follow its
  `next_node`.
- Inherit stack, runtime and `visual_product_standard` from the existing
  `.bawe/build-directives.json` — do not redeclare or diverge from them.
  Add only what is specific to this feature: its scope, its main flow, any
  new integration it needs and its own validation priorities.
- If this feature needs a new external integration, record provider, mode
  and required (non-secret) variables here, same convention as the
  original `visual_dna`/`integrations` pattern — never invent an API key
  value.
- Set `routing.next_node = extension-architecture`.
- Do not invent scope beyond `extension-prd.md`.
- Never modify `.bawe/build-directives.json`.

## Exit

Exit when `.bawe/extension-build-directives.json` exists and points to
`extension-architecture`.

When stopping at this stage, the final assistant message must be exactly:

```text
Parcial completado. Espero "continuar" para proseguir.
```
