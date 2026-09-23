---
name: extension-prd-generator
description: Write the scoped product spec for one Extensión item. Clone of prd-spec-generator, scoped to a single new capability instead of a whole product.
---

# Extension PRD Generator

## Purpose

Turn `.bawe/extension-context.md` into `.bawe/extension-prd.md`: a small,
complete product spec for exactly one new capability being added to an
already-delivered product. Same authority and rigor as a PRD section —
functional requirements, flows, acceptance criteria, MVP and out-of-scope
— just scoped to one feature instead of a whole product.

Never modify `prd.md`. This feature's spec lives in its own file so the
original product-authority document stays the historical record of what
was actually delivered and reviewed at launch.

## Inputs

- `.bawe/extension-context.md`
- `.bawe/extension-log-preguntas.md`
- `prd.md` and `project-context.md` — read-only, for consistency with the
  existing product's business rules, roles and terminology.

## Output

`.bawe/extension-prd.md`, following the same structure a PRD section would:

- Título y resumen de la feature.
- Propósito: qué problema resuelve, para quién.
- Alcance: qué agrega exactamente a `[project_name]`.
- Flujo(s) funcional(es), paso a paso.
- Reglas de negocio relevantes a esta feature.
- Criterios de aceptación, verificables.
- MVP de esta feature vs. explícitamente fuera de alcance por ahora.
- Riesgos y ambigüedades que quedaron abiertas.

## Rules

- Product authority for this feature is `.bawe/extension-context.md` and
  `.bawe/extension-log-preguntas.md`, in that order, same as the original
  PRD's authority order for the whole product.
- Do not invent requirements beyond what the client described and what
  `extension-context.md` captured. If something is genuinely unclear,
  record it as an open risk instead of guessing.
- Do not treat technical stack as a requirement unless the client stated it
  as an explicit restriction — same rule the original PRD follows.
- Do not duplicate the whole existing `prd.md`; reference it only where
  this feature depends on an existing rule or role.
- Keep it proportional to one feature. If while writing this the scope
  looks like more than one capability, stop and record that as a blocker in
  `task-log.md` instead of writing an oversized spec — that likely means
  `edit-intake` under-classified the request.

## Next Step

After writing `.bawe/extension-prd.md`, read and execute
`extension-prd-validation-gate/SKILL.md`.

## Exit

When stopping at this stage, the final assistant message must be exactly:

```text
Parcial completado. Espero "continuar" para proseguir.
```
