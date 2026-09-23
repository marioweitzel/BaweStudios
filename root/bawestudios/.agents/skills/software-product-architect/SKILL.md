---
name: software-product-architect
description: Generate product architecture and role matrix artifacts for richer software products.
---

# Software Product Architect

## Purpose

Create product architecture artifacts for the `software-product` route.

## Inputs

- `prd.md`
- `project-context.md`
- `.bawe/build-directives.json`
- `.agents/schemas/app-structure.schema.json`
- `.agents/schemas/role-matrix.schema.json`
- `.agents/visual-references/VISUAL_INDEX.md` when present.
- `.agents/visual-references/VISUAL_PATTERN_ADDENDUM.md` when present.

## Outputs

- `.bawe/app-structure.json`
- `.bawe/role-matrix.json`

## Idempotency Preflight

Before doing architecture work, visual reference selection or image inspection,
check whether both outputs already exist:

```text
[PROJECT_ROOT]/.bawe/app-structure.json
[PROJECT_ROOT]/.bawe/role-matrix.json
```

If both files exist:

1. Read only the minimal fields needed to validate that they are real outputs,
   not placeholders:
   - `app-structure.json`: schema/version marker when present, `project_id`,
     `source_structure`, `module_boundaries`, `surfaces` or `route_map`,
     `data_flow_contracts`, `design_system` when UI exists, and
     `visual_architecture` when UI exists.
   - `role-matrix.json`: schema/version marker when present, `project_id`,
     roles and permissions/surfaces.
2. If both parse, are not `NOT_READY`, and contain the required minimum for the
   product route, do not regenerate them.
3. Do not read `VISUAL_INDEX.md`, `VISUAL_PATTERN_ADDENDUM.md` or inspect visual
   reference images during this idempotency pass.
4. Report that architecture artifacts are already valid and route to
   `component-queue-generator/SKILL.md` when queue generation is still pending.

Regenerate only when an output is missing, invalid, marked `NOT_READY`, or
structurally inconsistent with the required software-product blueprint.

## Software Blueprint

`.bawe/app-structure.json` is the implementation map. It should let the
developer LLM start coding with a clear product structure instead of repeatedly
rediscovering architecture from source files.

Write a compact but useful blueprint. Prefer specific responsibilities over long
explanations.

Expected software sections:

- `application_strategy`: whether the product is one role-aware app, multiple
  physical apps, or a hybrid, with short rationale.
- `source_structure`: expected folders/files by runtime boundary.
- `module_boundaries`: domain modules, what each owns, and what each must not
  contain.
- `route_map`: user-facing routes/views, roles allowed, primary surface, and
  empty/error/loading/success states.
- `surface_contracts`: screen-level contract joining role, workflow, data,
  actions and visual intent.
- `data_flow_contracts`: actions that create/read/update data, the expected
  persistence/API path, and failure behavior.
- `runtime_state`: non-persistent concepts needed by the app, such as session,
  active role, tokens, filters, form drafts and UI-only state.
- `data_placement_rules`: classify product/domain data as DB-backed from the
  first objective that uses it. Initial editable/searchable/publishable product
  data must be modeled as seed data and queried through the API, not hardcoded
  in frontend/API code. Stable UI labels, static navigation, design tokens,
  local assets and runtime-only UI state may remain code/assets.
- `api_contract_plan`: API areas likely needed by the active objectives without
  inventing endpoints beyond product scope.
- `state_management_plan`: where UI state, server state, form state and auth
  state should live.
- `design_system`: shared visual token contract for the whole product. It must
  define the reusable visual language before any UI objective is queued.
- `responsive_contract`: desktop/tablet/mobile behavior for navigation, tables,
  forms, panels and actions.
- `implementation_constraints`: anti-monolith, anti-dead-code and refactor
  constraints the developer must preserve.
- `professional_self_check`: questions the developer must answer before asking
  for closure.
- `traceability`: short mapping from surface/module/data-flow ids to PRD
  requirement or flow ids. Keep it compact.

The blueprint must be traceable to product authority and build directives, but
it must not become a documentation package. Do not create additional planning
files.

### Internal Consistency

Before writing outputs, check the blueprint against itself:

- Every non-empty `route_map[].primary_surface` must exist in `surfaces[].id`.
- Every `surface_contracts[].surface_id` must exist in `surfaces[].id`.
- Every `visual_architecture.surface_contracts[].surface_id` must exist in
  `surfaces[].id`.
- Every product UI surface in `surfaces[].id` must have one
  `visual_architecture.surface_contracts[]` entry unless the surface is
  explicitly classified as `non_visual`, `redirect`, `system`, or `api_only`.
- If the product has product UI surfaces, `design_system` must exist and include at
  least palette, typography, spacing scale, radius, borders, shadows, icons,
  motion, component primitives, state styles, one signature element and
  restraint rules.
- Every role surface in `.bawe/role-matrix.json` must exist in `surfaces[].id`.
- Every `data_flow_contracts[].reads[]` and `writes[]` item must exist in either
  `data_entities[].id` or `runtime_state[].id`.
- Every `api_contract_plan[]` area must map to at least one module, surface or
  data flow.
- If a concept is not persisted, put it in `runtime_state`, not
  `data_entities`.
- If a concept is product/domain data that users/admins can create, edit, hide,
  publish, search, filter or relate to roles, put it in `data_entities` and
  require DB seed/query behavior when initial data is needed. Do not leave it as
  hardcoded frontend/API data for later migration.
- If a route is only a redirect or internal routing helper, model that behavior
  explicitly and do not leave a missing surface id.
- If a route helper such as role-based home routing has no standalone UI, do
  not model it as a product UI surface. Use `route_behavior` and point downstream
  queue objectives to the real destination surfaces or auth surface.

If the internal consistency check fails, fix the blueprint before writing it.
Do not write a separate validation report.

### Required Professional Self Check

Include these questions in `professional_self_check`:

- Would I deliver this objective to a paying client under my name?
- Does each UI surface look like a finished product screen rather than a raw
  form, spreadsheet, CRUD skeleton or generic admin template?
- Does every visible control do something real in the delivered scope?
- Can a future change find the relevant code without reading unrelated screens?
- Is UI, domain logic, data/API access and styling separated enough to maintain?
- Does the product work on desktop and mobile for the intended workflow?
- Are loading, empty, error, validation and success states handled where they can
  occur?
- Are visible labels, roles, headings, actions and messages polished for the
  user's language and locale?
- Are expected interaction details planned for the surface, including hover,
  focus, disabled, loading, validation, success, error, reveal/confirm/undo and
  restrained transitions where useful?
- Did I leave any fake data, zombie route, unused function or decorative control?
- Did I build the active objective, not a scaffold and not future scope?

## Visual Architecture

When visual references are installed, enrich `.bawe/app-structure.json` before
queue generation.

Procedure:

1. Read `VISUAL_INDEX.md` safely. Do not load the whole index in one unbounded
   read for reference selection. Use targeted search by `REF-*`, category,
   family id, route/surface keyword or pattern keyword; then read only the
   relevant bounded rows/ranges. If a selected reference comes from a family
   summary, look up and read its exact row before using it.
   Read `VISUAL_PATTERN_ADDENDUM.md` when its patterns apply.
2. Select 3 to 6 candidate `REF-*` ids using product intent, Visual DNA, route,
   roles, surface purpose and required UI pattern.
3. Before recording a selected `REF-*`, verify that its exact row was read and
   that the referenced filename exists in `.agents/visual-references/`. If the
   row or image file cannot be confirmed, do not infer a filename from similar
   names; choose another confirmed reference or record a blocker.
4. Do not select by historical filename, brand, palette, copy, product domain or
   image attractiveness alone.
5. Inspect only the selected candidate images when visual inspection is available.
6. Extract transferable structure only:
   - shell/navigation anatomy;
   - content zones;
   - table, form, card, modal and drawer composition;
   - density and scan rhythm;
   - thin-line/panel separation;
   - primary and secondary action placement;
   - state and feedback placement.
   - expected interaction polish and microinteraction opportunities;
   - professional copy tone and labeling patterns;
   - product-specific visual identity cues that do not copy brand assets.
7. Do not transfer colors, fonts, brand, text, icons, exact layout, exact data,
   image assets or domain-specific concepts.
8. Record rejected references when a plausible reference was intentionally not
   used.

Also read `.bawe/build-directives.json.visual_product_standard` when present.
Use it as the product-level visual standard for all UI surfaces. The architect
must turn that standard into surface-specific contracts; do not leave the
developer with generic words such as "professional", "clean" or "modern" unless
they are tied to concrete hierarchy, composition, feedback, copy and interaction
expectations for that surface.

Expected `.bawe/app-structure.json` enrichment:

- `visual_reference_selection`
- `design_system`
- `visual_architecture.overall_direction`
- `visual_architecture.product_visual_standard`
- `visual_architecture.surface_contracts[]`

Coverage rule:

- Create one visual contract for every product UI surface in `surfaces[]`.
- Create one shared `design_system` before surface contracts. It is the product
  skin and must be reused across every UI objective so login, dashboards, forms,
  tables and public links feel like the same product.
- Reuse selected visual references when a surface shares a pattern with another
  surface.
- Every product UI surface contract must carry the product visual standard into that
  specific screen: perceived quality bar, product identity cues, copy quality,
  state feedback and interaction polish.
- If no selected reference maps cleanly to a surface, still write a visual
  contract from product intent, Visual DNA and the overall direction; set
  `selected_refs` to an empty array and make the reason explicit in
  `visual_intent`.
- Do not create visual contracts for ids that are not present in `surfaces[]`.
- Do not create a fake `surfaces[]` entry only to satisfy a visual contract.

Each surface contract should include:

- `surface_id`
- `selected_refs`
- `visual_intent`
- `perceived_quality_bar`
- `density`
- `layout_anatomy`
- `interaction_patterns`
- `microinteractions`
- `copy_quality`
- `state_feedback`
- `product_identity_cues`
- `extract`
- `avoid`
- `responsive_expectations`

The `design_system` should include:

- `source`: product authority and visual standard used to derive the system.
- `identity`: short description of product personality. When product authority
  or Visual DNA signals a tone (warmth, playfulness, care, seriousness,
  corporate restraint...), state it explicitly here — it is the anchor the
  rest of `design_system` must stay coherent with.
- `signature_element`: one memorable product-specific visual pattern tied to
  real domain information, to the declared `identity` tone, or both. It must
  make the product recognizable without becoming decoration disconnected from
  that tie. Use exactly one primary signature pattern.
- `palette`: semantic tokens with concrete values or implementation-ready color
  references for background, surface, text, muted text, primary action,
  secondary action, border, focus ring and status colors.
- `typography`: font family strategy, size scale, heading/body/label treatment
  and visible locale rules.
- `spacing_scale`: reusable spacing rhythm for shell, panels, forms, tables and
  compact controls.
- `radius`, `borders`, `shadows`: consistent shape and depth rules.
- `icons`: icon library or style family and usage rules.
- `motion`: transition rules coherent with `identity`. Restrained and purely
  functional by default; when `identity` declares warmth, playfulness or care,
  motion may also carry that register (a softer entrance, a gentle hover lift)
  instead of marking only hover/focus/validation state — still one intentional
  set of rules, not decoration added for its own sake.
- `component_primitives`: button, input, panel, table/card, badge, modal/drawer,
  toast/alert and navigation primitives expected by the first UI objective.
- `state_styles`: loading, empty, error, success, warning, disabled, focus,
  hover and selected states.
- `restraint_rules`: explicit limits that prevent visual excess, such as maximum
  accent-color usage per screen, no decorative gradients, no decorative icons,
  no random status colors and no elements disconnected from real product
  information or the declared `identity` tone.
- `cross_objective_coherence`: rule that later objectives must reuse the same
  tokens and primitives, extending them only when the current objective exposes
  a real missing state.

## Rules

- Represent roles, permissions, modules, workflows and data surfaces.
- Preserve the Complete product scope from the PRD. That boundary limits
  unsupported features; it must not be interpreted as permission to reduce
  usability, visual quality, client-presentable wording, state coverage or
  professional finish.
- Preserve Visual DNA from product authority. Visual references are pattern
  evidence, not product authority.
- Keep all ids stable, lowercase and reusable by component queue and autonomous
  development.
- Plan responsive behavior explicitly for every UI surface.
- Plan professional perceived quality explicitly for every UI surface: hierarchy,
  composition, state feedback, interaction polish, copy quality and product
  identity cues.
- Plan one shared `design_system` for the whole product. Do not let each
  objective choose an independent palette, typography, icon style, shadow system
  or interaction language.
- Give the design system one product-specific signature element, not a handful
  of gimmicks. The signature must encode domain state, workflow context, the
  declared `identity` tone, or a combination — not become a generic decorative
  motif disconnected from all three.
- Add restraint rules so the UI can have personality without becoming noisy or
  decorative. A warm or playful `identity` is not an excuse for visual excess,
  but restraint must not flatten every product back to the same operational
  register regardless of what `identity` declares.
- Do not let the first UI objective start from a generic shell. The architecture
  must make clear which shared visual foundation the first objective must create:
  layout shell, navigation, buttons, inputs, panels, tables/cards, status badges,
  feedback states, responsive behavior and motion coherent with `identity`.
- Plan source structure so implementation does not collapse into `App`, `index`,
  one route file or one mixed helper file.
- Mark dead controls, fake affordances, unused routes and placeholder behavior
  as forbidden from the start.
- Do not assign implementation owners.
- Do not write application source code.

## Exit

Exit when app structure, visual architecture, software blueprint and role matrix
are valid for component queue generation.

When stopping at this stage, the final assistant message must be exactly:

```text
Parcial completado. Espero "continuar" para proseguir.
```
