---
name: adn-translator
description: Translate product authority into NEXO build directives for PRE_QUEUE.
---

# ADN Translator

## Purpose

Translate the validated PRD and context into operational build directives.

## Inputs

- `prd.md`
- `project-context.md`
- `.bawe/prd-validation-gate.json`
- `.agents/schemas/build-directives.schema.json`
- `output-schema.json`

## Output

- `.bawe/build-directives.json`

The output must include a routing pointer for the next PRE_QUEUE node.

## Rules

- Execute only when `[PROJECT_ROOT]/.bawe/prd-validation-gate.json` exists and has `status = PASS`.
- If the PRD validation pointer is missing, read `prd-validation-gate/SKILL.md` instead of translating.
- If the PRD validation pointer is `NEEDS_CORRECTION` or `BLOCKED`, do not translate; follow its `next_node` or blocking reason.
- Build directives are operational authority after product authority.
- Include product scope, stack assumptions, main flows, routing hints and validation priorities.
- Include `visual_product_standard` for every UI product. This is the first
  product-level visual instruction and must describe intention, quality bar and
  personality, not component-by-component styling.
  - Base it on `project-context.md` Visual DNA, PRD product type, audience,
    workflow and language.
  - State the expected perceived quality: professional, client-presentable,
    product-specific and sellable, not merely functional.
  - State what the product must not feel like: raw CRUD, spreadsheet, scaffold,
    generic admin template or copied reference.
  - Include palette direction from Visual DNA or product authority. Do not
    invent exact colors unless the source gives them.
  - Include a transfer policy for visual references: use composition, hierarchy,
    density, rhythm, panels, lines, affordances, state feedback and restrained
    motion; do not copy brand, colors, fonts, text, exact layout or domain
    concepts.
  - Require the first UI objective to establish a reusable visual foundation
    before feature-specific closure.
- For executable products, include runtime delivery directives:
  - Windows local runtime uses Docker Desktop.
  - Local validation uses `docker-compose-local.yml`.
  - Ubuntu VPS delivery uses Docker Swarm with Traefik.
  - VPS configuration lives in `docker-compose-vps.yml`.
  - `.env.example` is the only env file created by the motor unless the user
    provides real local values.
- Set `routing.selected_route` directly from product type and build directives.
- If `routing.selected_route = software-product`, set `routing.next_node = software-product-architect`.
- If `routing.selected_route = app-web`, set `routing.next_node = architecture`.
- If no route can be selected, set `routing.selected_route = blocked`, set `routing.next_node = null`, and record the conflict in `conflicts`.
- Do not route through an intermediate routing-only skill.
- Do not invent features beyond the PRD.
- If product authority and operational authority conflict, block and record the conflict in `task-log.md`.
- Do not execute implementation.

## Exit

Exit when `.bawe/build-directives.json` conforms to the reduced NEXO schema and points to the next architecture node.

When stopping at this stage, the final assistant message must be exactly:

```text
Parcial completado. Espero "continuar" para proseguir.
```
