# Professional Closure Contract

Runtime authority: `.agents/contracts/professional-closure-contract.md`

This contract defines when an objective may be called ready. It replaces a global final validator workflow with a concise professional closure decision.

## Closure States

Use these states:

- `IN_PROGRESS`: work is still being implemented.
- `BLOCKED`: meaningful progress is blocked by a concrete condition.
- `NEEDS_CORRECTION`: validation found issues that can be fixed.
- `READY_FOR_CLIENT_REVIEW`: the objective meets professional product criteria.
- `NOT_APPLICABLE`: the objective was skipped for a documented reason.

Avoid `COMPLETED` unless the dispatcher needs that exact word internally. User-facing closure should be `READY_FOR_CLIENT_REVIEW`.

## Hard Rule

Technical success is not professional closure.

The following never close an objective by themselves:

- build PASS;
- tests PASS;
- HTTP 200;
- Docker healthy;
- login works;
- screenshots exist;
- one happy path works;
- "prototipo tecnico";
- "85%";
- "falta una pasada";
- "solo falta pulir".

## Ready For Client Review

`READY_FOR_CLIENT_REVIEW` is allowed only when all applicable conditions are true:

- PRD/context/log/user-clarification scope for the active objective is complete.
- The delivered surface passes `CLIENT_PRESENTATION_PASS`.
- Declared stack is respected or a recorded blocker/approved exception exists.
- Persistence is real when the product requires persistence.
- Critical flows work end to end.
- Auth, roles and permissions work when present.
- UI is responsive when present.
- Screenshots show expected states, not just any rendered page.
- Visual quality is professional for the product type.
- User-visible copy is polished for the product language, including labels,
  roles, headings, action text, capitalization and locale-specific characters.
- UI surfaces show product-specific identity, clear hierarchy, intentional
  composition and expected interaction polish rather than generic generated
  layout.
- Relevant visual enrichment opportunities were implemented, coherently
  replaced or skipped for a product reason, especially when product authority
  hinted at imagery, objects, mood or visual preference.
- Relevant states and microinteractions are present where the workflow needs
  them: hover/focus/pressed, disabled/loading, validation, error, success,
  reveal/confirm/undo or equivalent affordances.
- There are no critical console/runtime errors.
- There are no dead controls, zombie routes or fake UI affordances in the delivered scope.
- Applicable self-validations were run after final corrections.
- Applicable checks were selected by surface and risk; skipped checks have a
  reason when the risk exists.
- Any applicable tool that could not run has equivalent evidence or the objective remains blocked.
- Docker validation ran through `docker-compose-local.yml` for executable
  products; `docker-compose-vps.yml` is configured for Ubuntu Swarm/Traefik.
  If Docker is unavailable, closure is blocked or marked `NEEDS_VALIDATION`.
- The LLM does not know of blocking debt.
- The LLM would deliver this objective to a paying client under its name.

## Client Presentation Pass

`CLIENT_PRESENTATION_PASS` is mandatory before `READY_FOR_CLIENT_REVIEW`.

The running product, delivered UI and screenshots must look like a real product
for the target business, not a local test harness, demo scaffold or internal
engineering review.

Block readiness when any delivered UI or screenshot contains:

- visible test, demo or local credentials;
- QA, readiness, validation, test or demo seed data;
- internal construction copy;
- references to reusable components, future screens, scaffolding, technical
  proof, validation state or implementation progress;
- product wording that speaks to the developer, builder, QA process or engine
  instead of the business user or client.

Visible QA or client-presentation debt cannot be recorded as non-blocking known
debt. Reopen the relevant objective as `NEEDS_CORRECTION`, fix the visible
surface or data state, recapture evidence and revalidate before readiness.

## Blocking Conditions

BLOCKING:

- scope from PRD/context/log is not implemented;
- feature invented outside authority is required for the result to make sense;
- stack is wrong without justification;
- DB/persistence is simulated while real persistence is required;
- product/domain data is hardcoded in UI/API code when the product has a DB path
  for it, including temporary arrays, fake catalog objects, fallback records or
  sample content that should be seed/query data;
- API contract missing or inconsistent when API applies;
- `api-schema.json` missing when API behavior applies and no schema was created from authority;
- browser flow fails;
- role denial/allowance is wrong;
- critical console error exists;
- UI state shown does not match expected flow state;
- visual quality is acknowledged as not client-presentable;
- user-visible copy has obvious spelling, accent, capitalization, locale or
  role-name errors;
- UI lacks expected affordances or feedback for common user actions in the
  delivered surface;
- UI looks like a raw scaffold, spreadsheet, CRUD skeleton, placeholder dashboard
  or generic template instead of a finished product surface;
- UI ignores a relevant visual/image clue or app-structure enrichment
  opportunity without a product reason, or uses fake/unrelated assets to appear
  more designed;
- responsive layout fails for normal viewport sizes;
- code structure is monolithic enough to block maintenance;
- visible controls, routes or functions do not represent real delivered behavior;
- user-visible data is demo/fake beyond approved seed/config;
- delivered UI or screenshots expose test/demo/local credentials, QA/readiness/
  validation data, internal construction copy, scaffolding language, future-screen
  promises, technical proof or validation state;
- Docker/runtime validation through `docker-compose-local.yml` is required and
  not run;
- Docker is unavailable and no Docker runtime proof exists;
- `docker-compose-vps.yml` is missing or stale for a deliverable executable
  product;
- applicable tool unavailable with uncovered product risk;
- any previous blocker remains unresolved.

## Conditional Closure Checks

WHEN_APPLICABLE:

- UI: desktop/mobile screenshots, console, visual-quality, a11y.
- API: contract and runtime route checks.
- DB: migration/schema/query/seed check.
- Auth: role matrix checks.
- Auth/roles: at least one allowed and one denied flow when the objective touches permissions.
- Docker: `docker-compose-local.yml` config/up/health for runtime.
- VPS compose: `docker-compose-vps.yml` static/config check for Swarm/Traefik
  readiness.
- Integration: failure handling and honest provider state.
- Product workflow: end-to-end flow test.

## Expected Comparison

Every closure must compare against:

1. PRD acceptance criteria or product requirements.
2. `project-context.md` product intent and stack.
3. `log-preguntas.md` and later user clarifications.
4. NEXO/build-directives operational constraints.
5. Visual references when UI quality is in scope.

The comparison must be semantic, not just textual. Example: a login flow screenshot must show login before authentication, not a dashboard.

## Closure Output

Closure output should be short:

```text
status:
objective:
scope_checked:
validations_run:
evidence:
blockers:
known_debt:
next_action:
```

No extra closure dossier schema is required by default.

`evidence` may be a concise command/browser/screenshot summary in `task-log.md`.
Do not create separate validation reports unless a tool naturally produces one
or a blocker requires durable detail.

## Reopen Rule

If the user challenges closure with a product-quality issue and the issue is valid, reopen to `NEEDS_CORRECTION`. Do not defend a technical PASS as product-ready.

## Non-Goals

This contract does not replace product judgment with a numeric score. Scores like 85% are not closure states.

## Whole Project Closure

Whole-project readiness is governed by `.agents/contracts/project-lifecycle-contract.md` and is separate from objective readiness.

When the last development objective reaches `READY_FOR_CLIENT_REVIEW`, the
developer LLM must hand off to `client-facing-product-review` instead of marking
the project ready. It must set `project_status =
AWAITING_CLIENT_FACING_REVIEW`, set `next_node =
client-facing-product-review`, update `task-log.md`, and end with:

```text
Parcial completado. Espero "continuar" para proseguir.
```

The project reaches `READY_FOR_CLIENT_REVIEW` only after the independent
client-facing product review passes and any later delivery/package preparation
stage required by `.agents/contracts/project-lifecycle-contract.md` has
completed.

At that final project-ready state, the final assistant message must be exactly:

```text
Finalizado.
```
