# Project Lifecycle Contract

Runtime authority: `.agents/contracts/project-lifecycle-contract.md`

This contract defines runtime lifecycle rules that are broader than one objective: operational artifact creation, queue advancement, whole-project closure, API contract ownership and unavailable validation semantics.

It keeps lifecycle control minimal. It does not install separate implementation owners, transition packages or parallel state files.

## Runtime Artifacts

The runtime artifact directory is:

```text
.bawe/
```

Creator: `bawe-initialization-logic`.

Creation timing: during project initialization, inside `[PROJECT_ROOT]`, before
any runtime operational output is written.

`bawe-initialization-logic` creates only the `.bawe/` directory when a later
runtime artifact needs it. It must not create placeholder runtime files during
intake.

Runtime files are created only by the stage that owns them:

- `.bawe/build-directives.json`: `adn-translator`.
- `.bawe/app-structure.json`: `architecture` or `software-product-architect`.
- `.bawe/role-matrix.json`: `software-product-architect` when roles apply.
- `.bawe/component-queue.json`: `component-queue-generator`.
- `.bawe/client-facing-product-review.json`: `client-facing-product-review`.
- `.bawe/delivery-package.json`: `delivery-package-preparation`.
- `Dockerfile` artifacts, `docker-compose-local.yml`, `docker-compose-vps.yml`,
  `.env.example` and `.dockerignore`: the active autonomous development LLM
  when executable runtime or delivery requires them.

## Runtime JSON Encoding

All runtime JSON state files written by the motor must be valid UTF-8 without
BOM. This applies at least to:

```text
.bawe/build-directives.json
.bawe/app-structure.json
.bawe/role-matrix.json
.bawe/component-queue.json
.bawe/client-facing-product-review.json
.bawe/delivery-package.json
api-schema.json
```

When writing JSON from PowerShell, do not use `Set-Content -Encoding UTF8` or
`Out-File -Encoding UTF8` for runtime JSON state. In Windows PowerShell 5.1 they
write UTF-8 with BOM.

Use an explicit UTF-8-no-BOM writer, for example:

```powershell
$json = $object | ConvertTo-Json -Depth 20
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($path, $json, $utf8NoBom)
```

If PowerShell 7+ is known to be active, `Set-Content -Encoding utf8NoBOM` is
acceptable. Otherwise prefer the explicit `.NET` writer above.

Before closing a stage that creates or updates runtime JSON, verify that the
JSON parses strictly and does not start with a BOM. If a pre-existing state JSON
has BOM and the stage updates that same file, rewrite it without BOM as part of
the normal update. Do not create a separate cleanup artifact.

If legacy placeholders exist, they must be explicitly marked `NOT_READY` or
missing required ready fields. Detectors must not treat placeholder existence as
stage completion.

Do not create:

- `BAWE_PHASE_STATE.json`
- `BAWE_BUILD_LOG.md`
- `.bawe/continuity.json`

Continuity remains in `task-log.md`.

## Docker Runtime Artifacts

BaWe executable products use Docker as the runtime contract.

Required project-root artifacts:

```text
docker-compose-local.yml
docker-compose-vps.yml
.env.example
.dockerignore
```

Required runtime-specific artifacts:

```text
Dockerfile files for backend/frontend/runtime boundaries
nginx config when a static frontend container needs it
```

Rules:

- Windows local execution uses Docker Desktop and `docker-compose-local.yml`.
- Ubuntu VPS delivery uses Docker Swarm with Traefik and
  `docker-compose-vps.yml`.
- The local compose file is the required runtime validation target.
- The VPS compose file is kept configured and current for the user, but the LLM
  does not deploy to a VPS unless explicitly asked.
- Host runtime execution may support syntax checks, unit tests, package
  installation and debugging, but it is not a substitute for required Docker
  runtime validation.
- Do not create `.env` or `.env.local`; use `.env.example` with placeholders.
- Do not hardcode production secrets in compose files.

## API Schema

Runtime path:

```text
api-schema.json
```

Owner: the single LLM running `autonomous-product-development`.

`api-schema.json` is an incremental shared product contract. The same LLM may create it when the first active objective needs API behavior, extend it incrementally, correct inconsistencies and keep frontend/backend compatibility.

Rules:

- Do not invent endpoints outside the active objective.
- Do not let frontend and backend drift from the schema.
- If an API already exists, preserve compatibility unless the active objective and product authority require a breaking change.
- If API validation applies and `api-schema.json` is missing, create it from product authority, `.bawe/app-structure.json` and the active objective before closing the objective.
- Do not assign `api-schema.json` outside the single LLM vertical development flow.

## Queue Advancement

Queue file:

```text
.bawe/component-queue.json
```

Minimal algorithm after an objective receives `READY_FOR_CLIENT_REVIEW`:

1. Read `active_objective_id`.
2. Mark the active objective as `READY_FOR_CLIENT_REVIEW`.
3. Find the next `PENDING` objective whose dependencies are satisfied.
4. A dependency is satisfied when the referenced objective is `READY_FOR_CLIENT_REVIEW` or `SKIPPED` with justification.
5. If a next objective exists, set it to `ACTIVE`.
6. Set `active_objective_id` to that next objective id.
7. Keep project status as `IN_PROGRESS`.
8. Update `task-log.md` with current objective, status, validations, blockers and next action.
9. If the current session stops after updating the queue, the final assistant
   message must be exactly:

```text
Parcial completado. Espero "continuar" para proseguir.
```

If no next objective exists:

1. Set `active_objective_id` to `null`.
2. Set `project_status` to `AWAITING_CLIENT_FACING_REVIEW`.
3. Set `next_node` to `client-facing-product-review`.
4. Set `next_skill` to `client-facing-product-review/SKILL.md`.
5. Set queue `status` to `READY_FOR_CLIENT_REVIEW` only to indicate that all
   development objectives are ready for independent review; this is not final
   project readiness.
6. Update `task-log.md`.
7. Stop the session with the exact final line:

```text
Parcial completado. Espero "continuar" para proseguir.
```

Do not create transition reports or parallel state files for queue advancement.

## Client-Facing Product Review Handoff

When the last reachable objective reaches `READY_FOR_CLIENT_REVIEW` and no next
objective exists, the developer LLM must not perform the client-facing review in
the same development posture. It must hand off to
`client-facing-product-review` through `.bawe/component-queue.json`.

This is a session boundary for BaweStudio automation:

```json
{
  "project_status": "AWAITING_CLIENT_FACING_REVIEW",
  "active_objective_id": null,
  "next_node": "client-facing-product-review",
  "next_skill": "client-facing-product-review/SKILL.md"
}
```

The developer response must be exactly:

```text
Parcial completado. Espero "continuar" para proseguir.
```

BaweStudio can then close that session and open a new one with:

```text
continuar <workspace_user_id> <project_name>
```

The new session must route to
`.agents/skills/client-facing-product-review/SKILL.md`.

That review evaluates the product as one deliverable, not as isolated
objectives. It must review at least:

- end-to-end product flow across the main user roles;
- client presentation pass across the running product and screenshots;
- full client-facing surface inventory derived from routes, navigation, guards,
  role matrix, app structure and renderable surfaces/components;
- unauthenticated user, each business role, restricted routes/direct URL
  behavior, normal/empty/error/success states and desktop/mobile coverage when
  applicable;
- visual coherence across all primary UI surfaces;
- first viewport, auth, dashboards/workspaces, forms, empty/error/success
  states and mobile behavior when present;
- copy quality across the delivered product, including accents, capitalization,
  labels, role names and action text;
- shared component consistency: buttons, inputs, cards, tables, badges,
  navigation, modals, feedback and spacing should feel like one product;
- dead controls, placeholder screens, zombie routes, fake actions and unused UI;
- known debt from prior objectives that affects client delivery.

`CLIENT_PRESENTATION_PASS` blocks delivery preparation when any reachable
client-facing UI or screenshot shows test/demo/local credentials,
QA/readiness/validation data, internal construction copy, scaffolding language,
future-screen promises, technical proof or validation state. Visible
client-presentation debt must be fixed before delivery preparation; it cannot
remain as non-blocking known debt.

The reviewer cannot close by reviewing only remembered, recently touched or
already captured screens. It must derive and record the client-facing surface
inventory before verdict.

The mandatory review question is:

```text
If the client opens any reachable surface of this system, does the client see an
operational finished product inside the contracted scope, or traces of the
construction process?
```

If the answer is not a clear operational finished product, set project status to
`NEEDS_CORRECTION` or `BLOCKED`, record the reason in
`.bawe/client-facing-product-review.json` and `task-log.md`, and prepare
correction objectives.

For `NEEDS_CORRECTION`, keep continuation clear:

- group findings into correction objectives such as `CFPR-FIX-001`;
- make the first correction objective `ACTIVE`;
- set `active_objective_id` to that objective;
- set `next_node` to `autonomous-product-development`;
- do not invent new business features; correction objectives may only remove
  client-visible review failures or restore professional product quality inside
  existing scope.

For `BLOCKED`, `active_objective_id` may remain `null` only when no code change
can make progress without external input or runtime availability.

Record the review concisely in `task-log.md` and fully enough in
`.bawe/client-facing-product-review.json`:

```text
client_facing_product_review:
artifact:
surface_inventory_complete:
reviewed_as_paid_product:
internal_build_language_found:
demo_artifacts_visible:
unfinished_surface_found:
client_ready_verdict:
next_node:
```

The review session response must be exactly:

```text
Parcial completado. Espero "continuar" para proseguir.
```

On `PASS`, set `project_status` to `AWAITING_DELIVERY_PREPARATION` and
`next_node` to `delivery-package-preparation`, with `next_skill` set to
`delivery-package-preparation/SKILL.md`. That later delivery/package stage is
separate from this review.

## Delivery Package Preparation Handoff

When `project_status = AWAITING_DELIVERY_PREPARATION` and `next_node =
delivery-package-preparation`, the next session must read:

```text
.agents/skills/delivery-package-preparation/SKILL.md
```

That stage creates a clean client package and zip from a classified copy of the
product source. It must not delete or sanitize the source workspace.

It writes:

```text
.bawe/delivery-package.json
delivery/[project_name]/
delivery/[project_name].zip
DELIVERY_ZIP_PASSWORD.txt
```

BaweStudios reads `.bawe/delivery-package.json` for:

- download link: `zip_path`;
- preview link: `preview.url`.
- password handoff file: `password_file`.

The delivery zip must be password-protected. The password must be stored only in
`[PROJECT_ROOT]/DELIVERY_ZIP_PASSWORD.txt`, outside `delivery/` and outside the
zip. `.bawe/delivery-package.json` may record `zip_encrypted`, `encryption` and
`password_file`, but must not contain the password value.

On success, delivery package preparation sets `project_status =
READY_FOR_CLIENT_REVIEW`, clears `next_node` and `next_skill`, and responds
exactly:

```text
Finalizado.
```

## Resume Pointers

After PRE_QUEUE reaches development, resume from exactly one operational pointer:

```text
.bawe/component-queue.json
```

It must contain:

- `active_objective_id`;
- objective statuses;
- blockers;
- blueprint refs needed by the active objective;
- project status.
- `next_node` and `next_skill` when the project is between stages or needs a
  structured repair route.

During active development, continuity lives only in:

```text
task-log.md
```

`task-log.md` records the current objective, meaningful changed files, checks run,
blockers, known debt and next action. It is not a duplicate queue and not a
validation dossier.

## Project Status

Project status is distinct from objective status.

Allowed project statuses:

- `IN_PROGRESS`
- `AWAITING_CLIENT_FACING_REVIEW`
- `BLOCKED`
- `NEEDS_CORRECTION`
- `AWAITING_DELIVERY_PREPARATION`
- `READY_FOR_CLIENT_REVIEW`

The project may be `READY_FOR_CLIENT_REVIEW` only when all conditions are true:

- no objective is `ACTIVE`;
- no reachable objective remains `PENDING`;
- every required objective is `READY_FOR_CLIENT_REVIEW` or `SKIPPED` with justification;
- no blocker affects the requested product outcome;
- final applicable validations ran or have equivalent evidence;
- `.bawe/client-facing-product-review.json` exists with `status = PASS` and
  `client_ready_verdict = true`;
- `.bawe/delivery-package.json` exists with `status = READY`, `zip_path` and
  `preview.url`;
- `.bawe/delivery-package.json.zip_encrypted = true`;
- `[PROJECT_ROOT]/DELIVERY_ZIP_PASSWORD.txt` exists outside `delivery/` and is
  not included in the zip;
- `CLIENT_PRESENTATION_PASS` passed for the running product and final screenshots;
- delivery preparation/final packaging stage has completed when that stage is
  installed;
- `task-log.md` records the final project state, validations, evidence, blockers, known debt and next action.

When the project reaches `READY_FOR_CLIENT_REVIEW`, the final assistant message
must be exactly:

```text
Finalizado.
```

Do not use `COMPLETED` as an automatic synonym for project readiness.

## Docker Unavailable

If the product is executable and Docker is available, Docker validation through
`docker-compose-local.yml` is mandatory before client review.

If Docker is unavailable, Docker Desktop is not running on Windows, or
`docker-compose-local.yml` cannot run, the LLM must:

- set the objective or project to `BLOCKED` or `NEEDS_VALIDATION`;
- record evidence of unavailability;
- continue independent work only when it does not depend on Docker runtime proof;
- avoid silently replacing Docker validation with direct host execution;
- avoid `READY_FOR_CLIENT_REVIEW`.

Only non-executable/static artifacts may mark Docker `NOT_APPLICABLE`, and the
reason must be explicit in `task-log.md`.

## Applicable Tool Unavailable

When an applicable tool cannot execute:

1. Identify the product risk that made the tool applicable.
2. Record why the tool is unavailable.
3. Search for equivalent evidence.
4. Run a valid alternative if one exists.
5. Block closure if the risk remains uncovered.

Unavailable tool is never a reason to skip validation silently.

## Roles And Permissions

When roles exist and the objective touches auth, navigation, protected data or role behavior, validate at least:

- one allowed flow;
- one denied flow;
- backend enforcement;
- UI affordance or routing behavior;
- direct URL access denial when applicable.

Record the minimal result in `task-log.md`.

Do not require an exhaustive permission matrix for an objective that does not touch permissions.
