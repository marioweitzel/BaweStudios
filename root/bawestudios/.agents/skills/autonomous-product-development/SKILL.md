---
name: autonomous-product-development
description: Develop one active objective vertically with one LLM, using runtime contracts and applicability-based tools.
---

# Autonomous Product Development

## Purpose

Develop the active objective as a vertical product slice with one LLM. The LLM keeps the full product in view, implements the needed frontend, backend, database, infrastructure, roles and validation surfaces when they apply, then self-validates and requests professional closure.

This skill defines operating constraints. It does not teach programming.

## Required Inputs

- `.agents/contracts/professional-development-contract.md`
- `.agents/contracts/self-validation-contract.md`
- `.agents/contracts/professional-closure-contract.md`
- `.agents/contracts/continuity-contract.md`
- `.agents/contracts/project-lifecycle-contract.md`
- `.agents/contracts/runtime-environment-contract.md`
- `task-log.md`
- active objective from `.bawe/component-queue.json`

## When Applicable Inputs

- `prd.md`
- `project-context.md`
- `log-preguntas.md`
- `.bawe/build-directives.json`
- `.bawe/app-structure.json`
- `.bawe/role-matrix.json`
- `api-schema.json`

## Optional Inputs

- explicit user clarifications recorded after the product authority files;
- existing validation summaries;
- runtime URL;
- screenshots or tool outputs produced naturally by applicable validations.
- installed visual reference images only when the active objective touches UI
  and `.bawe/app-structure.json` selected explicit `REF-*` ids.

Do not block only because an optional input is absent.

## Authority Model

Product authority:

1. `prd.md`
2. `project-context.md`
3. `log-preguntas.md`
4. explicit user clarifications

Operational authority:

1. `.bawe/build-directives.json`
2. active objective from `.bawe/component-queue.json`
3. `.bawe/app-structure.json` when applicable
4. `.bawe/role-matrix.json` when applicable
5. `api-schema.json` when applicable
6. `.agents/contracts/project-lifecycle-contract.md`

If product authority and operational authority conflict, record a blocker in `task-log.md`, do not choose silently, and continue only with independent work that does not depend on the conflict.

## Blueprint Reading

Use `.bawe/component-queue.json` as the resume pointer and reading index.

For the active objective:

1. Read `surface_refs`, `module_refs`, `data_flow_refs` and
   `visual_contract_refs` when present.
2. Read the matching sections from `.bawe/app-structure.json` and
   `.bawe/role-matrix.json`.
3. Do not reread unrelated surfaces, modules or visual references unless a real
   dependency appears while coding.
4. If a referenced id is missing, record a blocker in `task-log.md` instead of
   guessing a new architecture.

## Visual Contract

When the active objective touches UI:

1. Read `.bawe/build-directives.json.visual_product_standard` when present.
2. Read `.bawe/app-structure.json.design_system`.
3. Read the relevant `visual_architecture.surface_contracts[]` from
   `.bawe/app-structure.json`.
4. Use `visual_contract_refs` from the active objective when present.
5. Read relevant
   `.bawe/app-structure.json.visual_architecture.visual_enrichment_opportunities[]`
   when the active objective includes `visual_enrichment_refs` or when a touched
   surface has a matching opportunity.
6. If interview, PRD or project context gives a concrete clue about desired
   imagery, domain objects, mood or visual preference, prefer that clue when it
   is coherent with the surface and product workflow.
7. If no explicit visual clue exists and enrichment is recommended, decide the
   smallest useful implementation: provided asset, generated/illustrative image,
   licensed/reference image, icon system, pattern, microinteraction or no asset.
   The decision must improve identity, trust, comprehension, emotional fit or
   perceived value; do not add visuals only to fill space.
8. If image generation or external asset access is unavailable, use a coherent
   fallback such as product-specific iconography, a domain pattern, composed UI
   illustration or restrained motion when that still serves the intended value.
   Do not block closure only because an optional visual asset could be nicer.
9. Any generated, selected or inferred visual asset must avoid fake client
   identity, real-world claims, invented locations, staff, customers, pets,
   products, logos or approved brand colors. Use alt text where applicable and
   keep performance, readability and task focus intact.
10. Record the visual enrichment decision concisely in `task-log.md` when it
   materially affects the delivered UI: source clue used, asset strategy,
   implemented surface and reason for skipping if a recommended opportunity was
   not implemented.
11. A new session may reread `VISUAL_INDEX.md` or
   `VISUAL_PATTERN_ADDENDUM.md` to confirm that the prior selected references
   still fit the active objective, but it must inspect only relevant images and
   apply concrete decisions from them.
12. Inspect only the selected or newly justified reference images if visual
   inspection is available.
13. Start UI implementation from the product visual standard, shared design
   system and extracted surface contract:
   - palette and semantic colors;
   - typography;
   - signature element;
   - restraint rules;
   - spacing/radius/border/shadow rhythm;
   - icon style;
   - shared component primitives;
   - layout anatomy;
   - density;
   - panel/table/form/modal composition;
   - action placement;
   - state and feedback treatment;
   - responsive expectations.
14. When the active objective is the first UI objective or owns the app shell,
   establish the reusable visual foundation before closing: layout shell,
   navigation, buttons, inputs, panels, tables/cards, badges, feedback states,
   focus/hover/disabled/loading behavior, responsive breakpoints and restrained
   transitions. Later objectives must inherit a finished product language, not a
   generic scaffold.
15. Later UI objectives must reuse the same design system. Extend tokens or
   primitives only when the current objective exposes a missing real state, and
   keep the extension coherent with previous surfaces instead of restyling the
   objective independently.
16. Do not copy reference colors, fonts, brand, copy, icons, exact layout, exact
   data, imagery or product/domain concepts.

Visual references are a starting point for professional composition. Product
authority remains `prd.md` and `project-context.md`.

## Perceived Product Quality Standard

For every objective that changes a user-visible surface, build and review the
surface as a product screen, not as a working form or table.

Before closure, the LLM must inspect the real rendered UI and improve it when
it feels generic, raw, spreadsheet-like, scaffold-like or obviously generated.
This judgment is mandatory even when tests, Docker, API calls and screenshots
pass.

Before `READY_FOR_CLIENT_REVIEW`, the delivered UI must pass
`CLIENT_PRESENTATION_PASS`: no visible test/demo/local credentials,
QA/readiness/validation data, internal construction copy, scaffolding language,
future-screen promises, technical proof or validation state. Keep developer
helpers, demo credentials and validation data outside client-visible UI, or make
them unavailable in client review mode.

Evaluate the surface across these dimensions:

- product-specific identity: the screen should feel made for this product,
  audience and workflow, not for a generic admin template;
- visual hierarchy: the user's eye should understand priority, grouping,
  primary action and next step quickly;
- composition: spacing, borders, panels, tables, forms, navigation and side
  regions should look intentional and balanced;
- interaction quality: expected affordances, hover/focus/pressed/loading states,
  inline validation, success/error feedback and useful microinteractions should
  exist where the workflow naturally needs them;
- motion and refinement: use restrained transitions or animated feedback when
  they clarify state, action or continuity; avoid decorative motion that harms
  an operational product;
- visible copy quality: labels, roles, headings, actions and messages must use
  correct user-facing language, capitalization and locale-specific characters;
  internal ASCII editing preferences do not justify broken product copy;
- responsive craft: mobile/tablet/desktop must look deliberately designed, not
  merely stacked;
- paid-client judgment: if the LLM would hesitate to show the screen to a paying
  client without apology, continue improving before requesting closure.
- client-presentation judgment: if the screen reveals test accounts, QA data,
  internal build language or proof-of-validation wording, reopen correction
  instead of treating it as non-blocking debt.

Do not create a separate UI audit document. Apply the corrections directly and
record only concise evidence in `task-log.md`.

## Development Cycle

Use this cycle:

```text
UNDERSTAND
-> INSPECT
-> PLAN LOCALLY
-> IMPLEMENT
-> REVIEW CODE STRUCTURE
-> RUN THE APP OR RELEVANT CHECKS
-> NAVIGATE THE REAL FLOW WHEN UI EXISTS
-> CORRECT
-> REVALIDATE
-> PROFESSIONAL SELF CHECK
-> REQUEST PROFESSIONAL CLOSURE
-> UPDATE CONTINUITY
```

The local plan may be short and internal. Do not create a long planning artifact by default.

## Docker Runtime Contract

Executable BaWe products must run through Docker for runtime validation.

For Windows, local runtime means Docker Desktop with:

```text
docker-compose-local.yml
```

For Ubuntu VPS delivery, the project must keep an updated Swarm/Traefik file:

```text
docker-compose-vps.yml
```

Before the first runtime validation of an executable product, create or update:

- Dockerfiles needed by frontend/backend/runtime boundaries;
- `docker-compose-local.yml`;
- `docker-compose-vps.yml`;
- `.env.example`;
- `.dockerignore`.

Use `docker-compose-local.yml` to run, inspect and validate the app locally.
Host `node`, `npm`, database or framework commands are allowed for install,
syntax, unit tests and builds, but they do not replace Docker runtime
validation for readiness.

Do not deploy to the VPS during autonomous development unless the user
explicitly asks. Keep `docker-compose-vps.yml` configured and current for the
user's later use.

If Docker Desktop or Docker CLI is unavailable when runtime validation is
required, record the blocker in `task-log.md` and `.bawe/component-queue.json`.
Do not mark the objective `READY_FOR_CLIENT_REVIEW`.

## Allowed Decisions

The LLM may decide:

- internal module structure;
- components and services;
- repositories and adapters;
- migrations and queries;
- state management;
- testing strategy;
- local implementation order;
- refactor scope;
- applicable tools.

The LLM must block or ask for approval before:

- changing the declared stack;
- changing product scope;
- removing a PRD requirement;
- replacing real persistence with mocks;
- hardcoding product/domain data that should live in DB, seed or API-backed
  persistence;
- skipping applicable validation without equivalent proof;
- declaring readiness with known blocking debt.

## Vertical Development

For each active objective, consider together when applicable:

- UI;
- API;
- DB;
- auth;
- roles;
- permissions;
- Docker/runtime through `docker-compose-local.yml`;
- errors;
- loading, empty, success and validation states;
- responsive behavior;
- tests;
- observability.

This does not mean all surfaces are always implemented. It means the LLM must not split one product objective into artificial ownership lanes.

## Refactor Rule

Refactor when a unit mixes responsibilities enough to block maintenance, testing, navigation or evolution.

File size is a signal, not a universal rule. Use the professional-development contract for judgment.

## Tool Integration

Tools are optional validation aids, not mandatory reading material.

For each objective, decide from the changed surface:

1. Identify changed surfaces.
2. Run the app through `docker-compose-local.yml` when the objective has
   executable runtime behavior; run tests or browser checks that prove the
   objective works.
3. Read a tool skill only when the surface makes that specific tool useful.
4. Do not read every validation tool or registry by default.
5. Record only minimal continuity in `task-log.md`.

Do not create validation dossiers or extra handoff files.

## Professional Self Check

Before asking for closure, inspect the code and the running product where
possible. Answer with judgment, not a long essay:

- Would I deliver this objective to a paying client under my name?
- Does the user-visible UI look like a finished product rather than a raw
  scaffold, spreadsheet or generic admin template?
- Did I apply visual-reference patterns as concrete UI decisions instead of only
  mentioning that references were read?
- If the interview or product authority hinted at a useful image, object, mood
  or visual preference, did I use it coherently or record why it was not right
  for this surface?
- If the surface would benefit from more product-specific life, did I add or
  deliberately skip visual enrichment based on identity, trust, comprehension,
  emotional fit or perceived value rather than decoration?
- Did I reuse the shared design system so this objective looks like the same
  product as previous and future objectives?
- Did I use the product signature element where it encodes real domain
  information, and avoid decoration where it does not?
- Did I respect the restraint rules instead of adding extra colors, icons,
  gradients, badges or motion just to make the screen look more designed?
- Is visible copy polished for the user's language, with correct accents,
  capitalization, role names, labels and action text?
- Are expected interaction details present for the surface, such as reveal,
  confirm, undo, loading, disabled, hover, focus, error and success behavior
  where they naturally apply?
- Does the implemented flow work from the user's point of view?
- Does every visible button, link, route, input and action do something real in
  the delivered scope?
- Is there any fake persistence, placeholder behavior, unused function, zombie
  route or decorative control?
- Is any product/domain data hardcoded in frontend/API code when it should be
  DB-backed or seeded? If yes, move it to schema/seed/query code before
  readiness, even if that requires changing the DB again.
- Is there any visible test credential, QA/readiness/validation data, internal
  construction copy, scaffolding language, future-screen promise, technical
  proof or validation state in the delivered UI?
- Is the code split by responsibility enough that the next fix will not require
  reading unrelated screens?
- Does the UI respect the visual and responsive contracts in
  `.bawe/app-structure.json`?
- Are errors, empty states, loading, validation and success states handled where
  they can happen?

## Self Validation And Closure

When the LLM believes the objective is ready:

1. Activate `self-validation-contract`.
2. Run applicable validations or equivalent direct checks.
3. Correct blockers.
4. Revalidate corrected surfaces.
5. Activate `professional-closure-contract`.
6. Produce a short closure decision.
7. If the objective reaches `READY_FOR_CLIENT_REVIEW`, apply the queue advancement algorithm in `project-lifecycle-contract`.
8. Update `task-log.md`.

Allowed objective statuses:

- `IN_PROGRESS`
- `NEEDS_VALIDATION`
- `NEEDS_CORRECTION`
- `BLOCKED`
- `READY_FOR_CLIENT_REVIEW`
- `SKIPPED`

Do not use `COMPLETED` as professional closure.

## Continuity

Update only `task-log.md`.

Record:

- current objective;
- status;
- meaningful files changed;
- validations run;
- evidence available;
- blockers;
- known debt;
- next action;
- last updated.

Do not duplicate the queue in continuity.

## API Schema

Use project-root `api-schema.json` as the shared API contract.

When the active objective needs API behavior and `api-schema.json` does not exist, create it before closure from product authority, `.bawe/build-directives.json`, `.bawe/app-structure.json` and the active objective. Extend it incrementally as API behavior grows. Do not invent endpoints outside the active objective.

## Queue And Project Lifecycle

After objective closure:

1. mark the current objective `READY_FOR_CLIENT_REVIEW` in `.bawe/component-queue.json`;
2. select the next dependency-satisfied `PENDING` objective;
3. set it to `ACTIVE` and update `active_objective_id`;
4. if none exists, set `active_objective_id` to `null`;
5. only when no next objective exists, set `project_status` to
   `AWAITING_CLIENT_FACING_REVIEW`, set `next_node` to
   `client-facing-product-review`, set `next_skill` to
   `client-facing-product-review/SKILL.md`, and stop this development session;
6. after updating `.bawe/component-queue.json`, if the current session stops
   before continuing implementation, end the final response with exactly
   `Parcial completado. Espero "continuar" para proseguir.`;
7. evaluate `project_status` separately from objective status;
8. update `task-log.md`.

Do not create transition artifacts or parallel state files.

## Unavailable Runtime Or Tool

For executable BaWe products, Docker validation through
`docker-compose-local.yml` is mandatory before client review. If Docker is
unavailable, record the evidence, set `BLOCKED` or `NEEDS_VALIDATION`, continue
only independent work and do not mark ready.

If an applicable tool cannot execute, record why, seek equivalent evidence, run a valid alternative if one exists and block closure when the risk remains uncovered.

## Role Validation

When roles exist and the objective touches auth, protected data, navigation or role behavior, validate at least one allowed flow and one denied flow. Cover backend enforcement and UI/routing behavior, including direct URL denial when applicable.

## Prohibited Behavior

- Do not delegate development outside the single LLM vertical development flow.
- Do not write old phase or build state files.
- Do not use lab or pause/restart control.
- Do not use runtime identity stamps.
- Do not depend on external agent instruction files.
- Do not close by build pass, HTTP 200, Docker healthy, screenshots existing or one happy path alone.
- Do not implement features outside the active objective.
