---
name: architecture
description: Generate the app-web architecture artifacts for PRE_QUEUE.
---

# Architecture

## Purpose

Create a structural application plan for projects routed as `app-web`.

## Inputs

- `prd.md`
- `project-context.md`
- `.bawe/build-directives.json`
- `.agents/schemas/app-structure.schema.json`

## Output

- `.bawe/app-structure.json`
- Update `.bawe/build-directives.json` routing pointer after architecture is created.

## Rules

- Define pages, routes, data entities, API surfaces and layout responsibilities at planning level.
- Keep implementation decisions aligned with the declared stack.
- Always include `visual_architecture` in `.bawe/app-structure.json`.
- If `.bawe/build-directives.json` contains `visual_product_standard`, derive `visual_architecture` from it.
- If explicit visual input is thin or absent, infer a coherent professional visual architecture from the product type, audience, workflows, data density, domain signals and PRD constraints.
- Visual inference must improve product finish without fabricating business facts, brand assets, external references, exact logos, exact imagery, client-approved colors or unsupported UX promises.
- `visual_architecture` must include:
  - `overall_direction`;
  - `product_visual_standard`;
  - `source_basis`;
  - `surface_contracts` with visual intent, perceived quality bar, layout anatomy, state feedback and responsive expectations for each primary UI surface;
  - `visual_enrichment_opportunities` for images, illustrations, patterns, icon systems or microinteractions that could make the product feel more specific, trustworthy, understandable or valuable.
- For `visual_enrichment_opportunities`, reason per primary UI surface:
  - prefer explicit interview, PRD or project-context clues about desired imagery, mood, visual references, domain objects or client preferences when they exist;
  - if source material has no visual clue, infer a coherent opportunity from the product domain, audience, workflow and surface intent;
  - recommend `none` when visual enrichment would be decorative noise, reduce task focus or conflict with a dense operational workflow.
- Visual enrichment must not fabricate client-owned identity, real photos,
  premises, staff, customers, pets, products, logos, approved brand colors or
  factual claims. Mark inferred choices as product/design inference, not as
  client-provided facts.
- Each visual enrichment opportunity must state:
  - target `surface_id`;
  - whether enrichment is recommended;
  - asset strategy: provided asset, generated/illustrative image, licensed/reference image, icon system, pattern, microinteraction or none;
  - intended product value;
  - source basis;
  - constraints and things to avoid.
- After `.bawe/app-structure.json` is valid, update `.bawe/build-directives.json` without changing product scope:
  - set `routing.next_node` to `component-queue-generator`;
  - set `routing.next_skill` to `component-queue-generator/SKILL.md`;
  - set `routing.completed_node` to `architecture`;
  - set `routing.architecture_artifact` to `.bawe/app-structure.json`.
- Do not write application source code.
- Do not create runtime validation records.

## Exit

Exit when `.bawe/app-structure.json` is valid, `.bawe/build-directives.json` points to `component-queue-generator`, and the project can resume from that pointer.

When stopping at this stage, the final assistant message must be exactly:

```text
Parcial completado. Espero "continuar" para proseguir.
```
