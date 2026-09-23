---
name: prd-spec-generator
description: Generate the product PRD using the installed PRD templates and methodology assets.
---

# PRD Spec Generator

## Purpose

Produce `prd.md` as the main product authority for BaWe.

## Inputs

- `project-context.md`
- `log-preguntas.md`
- `assets/template-registry.json`
- `assets/base/*.md`
- `assets/methodology/*.md`
- `assets/project-types/*/prd-template.md`

## Outputs

- `prd.md`

## Rules

- Select the closest template from `assets/template-registry.json`.
- Preserve confirmed user intent.
- Separate assumptions, open questions and blockers.
- Acceptance criteria must be testable.
- Treat A5 as the complete functional vision captured during the interview.
  Treat A_PRIORITIES as implementation ordering only. Any supported A5 item not
  named in A_PRIORITIES remains product scope unless contradicted, unsupported
  or explicitly postponed by source evidence.
- Treat the interview's priority answer as implementation ordering, not as the
  full product boundary. The PRD must derive complete product scope from all
  product authority and describe a functional, professional and client-presentable
  product within that scope.
- Do not use build priorities as a quality label in generated product artifacts.
  Use "complete product scope" or equivalent wording unless quoting a source
  field.
- Include objective, coherent product improvements when they are necessary to
  make the requested product complete, usable, trustworthy or professionally
  presentable, as long as they are traceable to client intent, domain necessity
  or recorded model inference and do not invent unsupported business scope.
- Do not create architecture, code, queues or runtime state.
- Do not create intermediate PRD audit/input files.
- Use `project-context.md` as processed product authority and `log-preguntas.md` as raw source fallback for traceability, contradictions and missing nuance.

## Exit

Exit when `prd.md` is ready for `prd-validation-gate`.

When stopping at this stage, the final assistant message must be exactly:

```text
Parcial completado. Espero "continuar" para proseguir.
```
