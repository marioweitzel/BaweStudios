---
name: project-context-generator
description: Generate project-context.md from the completed interview log during PRE_QUEUE.
---

# Project Context Generator

## Purpose

Create `project-context.md`, the canonical processed project context used by PRD generation and the rest of PRE_QUEUE.

## Inputs

- `log-preguntas.md`
- Explicit user clarifications.

## Output

- `project-context.md`

## Required Content

- Project name and slug.
- Product type, pipeline and interview completion state.
- Target users, personas, roles and expected permissions.
- Product purpose, current process, desired process and main flows.
- Complete functional vision derived from A5.
- Requested build priorities derived from A_PRIORITIES.
- Business rules, acceptance signals and non-blocking uncertainties.
- Integrations, explicit technical preferences and engine defaults as declarative context.
- Visual DNA, brand constraints and reference signals.
- Lightweight assumptions, open ambiguities and product constraints.
- Traceability back to `log-preguntas.md`.

## Minimum Canonical Schema

`project-context.md` must include these top-level sections and fields so `project-context-detector` can route the next session without reading interview assets:

```yaml
__metadata:
  schema_version: "1.0"
  created_by: "project-context-generator"
project:
  name: ""
  slug: ""
  pipeline: ""
  type: ""
section_a:
  status: "complete"
section_b:
  status: "complete"
current_status:
  last_completed_node: "project-context-generator"
  next_node: "prd-spec-generator"
```

The schema can include richer nested sections, but these fields are mandatory and must not be placeholders.

## Lightweight Enrichment Schema

`project-context.md` should stay short, but it must preserve enough strategic meaning to improve `prd.md` without creating extra control documents.

When evidence exists in `log-preguntas.md`, include these blocks:

```yaml
visual_dna:
  product_context:
    usage_pattern: "daily_work | occasional_use | conversion | content_reading | showcase"
    information_density: "low | medium | high"
    primary_device: "mobile | desktop | both"
    navigation_context: "public_site | private_dashboard | role_based_workspace | checkout | content_hub"
    interaction_complexity: "low | medium | high"
  experience_signals:
    content_priority:
      - ""
    visual_tone:
      - ""

assumptions:
  - field: ""
    value: ""
    source: "ENGINE_INFERENCE | ENGINE_DEFAULT | LLM_INTERPRETATION"
    confidence: 0.0
    justification: ""
    reversible: true

open_ambiguities:
  - field: ""
    issue: ""
    impact: ""
    resolution_mode: "defer_to_prd | defer_to_architecture | model_decides | ask_client_if_blocking"

product_constraints:
  must_preserve:
    - ""
  must_not_do:
    - ""
  deferred_decisions:
    - ""
```

Use these blocks as processed product context, not as final UI design or architecture.

- `visual_dna` records raw or inferred visual/product experience signals. It does not prescribe exact layouts, components, colors or screen designs.
- `assumptions` records decisions made to keep moving when the client did not specify something. Keep only assumptions that matter downstream.
- `open_ambiguities` records unresolved points that should not block context generation but may matter to PRD, architecture or implementation.
- `product_constraints` records client intent and exclusions that downstream skills must preserve.

Keep these blocks concise. Prefer 3 to 8 high-signal items over exhaustive classification.

## Rules

- Product authority order is `prd.md`, then `project-context.md`, then `log-preguntas.md`, then explicit user clarifications.
- A5 is the complete functional vision captured during the interview. Preserve
  every supported A5 item as product scope unless it is contradicted,
  unsupported or explicitly postponed by source evidence.
- A_PRIORITIES only orders construction. Any A5 item not named in A_PRIORITIES
  remains pending product scope, not discarded scope.
- The interview's build-priority answer orders implementation work. It does not
  define the full product boundary by itself. Derive complete product scope from
  all interview answers, recorded inferences and explicit client clarifications.
- Preserve objective, coherent product improvements that make the requested
  product functional, professional and client-presentable without inventing
  unsupported business scope.
- Do not use build priorities as a quality label in `project-context.md`. Use
  "complete_product_scope", "complete product scope" or equivalent wording unless
  quoting a source field.
- If inputs conflict, record the conflict in `project-context.md` and block downstream decisions that depend on it.
- Do not generate implementation code.
- Do not generate intermediate PRD context files.
- Do not generate PRD audit/input files.
- `project-context.md` must preserve enough product meaning for `prd-spec-generator` without requiring any interview intermediate file.
- Do not recreate V4.9-style heavy reasoning blocks: no per-field `information_classification`, no exhaustive confidence matrix, no giant `reasoning` section, no references to `project-context-prd.md`, no references to `prd-input.md`, and no operational state such as `current_tramo`.
- If a field has no evidence and is not needed downstream, omit it instead of filling placeholder text.
- If a default is used, label it as `ENGINE_DEFAULT`; if an inference is used, label it as `ENGINE_INFERENCE`; if it is semantic interpretation, label it as `LLM_INTERPRETATION`.

## Exit

Exit when `project-context.md` can support PRD generation.

After writing `project-context.md`, do not return to `bawe-initialization-logic`.
If `prd.md` does not exist, the next skill is `prd-spec-generator`.

When stopping at this stage, the final assistant message must be exactly:

```text
Parcial completado. Espero "continuar" para proseguir.
```
