# Self Validation Contract

Runtime authority: `.agents/contracts/self-validation-contract.md`

This contract activates when the LLM believes an objective, feature or product slice is ready. The LLM must select applicable checks, run or inspect them, correct issues and use professional judgment before asking for closure.

It replaces mandatory gate chains with applicability-based validation.

## Central Rule

The LLM cannot declare completion from code written, build PASS, HTTP 200 or Docker healthy alone.

It must answer:

- What surfaces changed?
- Which checks apply to those surfaces?
- Which checks were run or inspected?
- What minimal evidence exists?
- What failed and was corrected?
- What remains blocked?
- Would I deliver this to a paying client?

## Applicability Levels

ALWAYS:

- syntax or build validation for changed executable code;
- inspect changed files for obvious dead code, placeholders and unintended mocks;
- compare implementation against PRD/context/log/NEXO for the active objective;
- verify no blocking debt is being knowingly deferred.

WHEN_APPLICABLE:

- API changed: API contract, route checks and error-path checks.
- DB changed: migration/schema/seed/query validation with real DB when available.
- Auth/roles changed: allowed and denied role flows.
- Auth, credential storage or a write-capable backend endpoint changed:
  security baseline checks (password hashing, session/JWT expiration,
  rate-limiting, input validation, security headers, CORS, server-side role
  enforcement, hardcoded secrets in source).
- UI changed: browser, console, screenshots, responsive checks and expected-state comparison.
- Visual surface changed: visual-quality review against product intent and visual references.
- Accessibility-relevant UI changed: a11y checks.
- Executable product: Docker Compose local config and runtime validation with
  `docker-compose-local.yml`.
- VPS delivery artifact: `docker-compose-vps.yml` exists and is structurally
  current for Ubuntu Docker Swarm with Traefik.
- Docker unavailable: record unavailable evidence, set `BLOCKED` or
  `NEEDS_VALIDATION`, and do not request `READY_FOR_CLIENT_REVIEW`.
- Critical backend/integration changed: health/logging/observability checks.
- Multi-step user journey changed: workflow testing or equivalent end-to-end flow.

PRE_CLOSE:

- run the applicable set again after corrections;
- check the user-visible result, not only implementation internals;
- for UI, review perceived product quality before closure: copy, hierarchy,
  composition, interaction details, state feedback, responsive craft and whether
  the surface feels deliverable to a paying client;
- for UI, extract or inspect visible text from every reviewed/captured screen
  and check for mojibake, replacement characters and broken accents. This
  includes copy rendered from source files, API responses, seed data, DB rows and
  success/error messages created during the flow;
- for UI, run `CLIENT_PRESENTATION_PASS`: final delivered screenshots and the
  running product must not expose test/demo/local credentials, QA/readiness/
  validation data, internal construction copy, scaffolding language, future-screen
  promises, technical proof or validation state;
- for UI, verify that relevant visual enrichment opportunities were implemented,
  coherently replaced or skipped for a product reason, especially when product
  authority hinted at imagery, objects, mood or visual preference;
- capture evidence for UI flows;
- ensure the continuity record says what was validated.

BLOCKING:

- required validation cannot run and no equivalent evidence exists;
- applicable tool cannot execute and no equivalent evidence covers the product risk;
- API or UI consumes undeclared contracts;
- runtime fails for a critical flow;
- console has critical errors;
- Docker Desktop/Docker CLI or DB container is required but unavailable;
- screenshots show the wrong state;
- visual quality is below professional standard;
- UI visible copy has obvious language, spelling, accent, capitalization or
  role-name mistakes;
- UI, screenshots, API-fed text or persisted seed/runtime data show mojibake,
  replacement characters or broken accents. Treat patterns such as `Ã`, `Â`,
  `�`, `ï¿½`, or `?` inside a word where an accented character belongs as
  blocking visible copy, not cosmetic debt;
- UI lacks expected interaction affordances or state feedback for the workflow;
- UI looks like a generic template, raw spreadsheet, CRUD skeleton or unfinished
  generated screen;
- UI or screenshots expose test/demo/local credentials, QA/readiness/validation
  data, internal construction copy, scaffolding language, future-screen promises,
  technical proof or validation state;
- UI ignores a relevant visual/image clue or app-structure enrichment
  opportunity without a product reason, or uses fake/unrelated assets to appear
  more designed;
- the LLM itself says another pass is needed.

## Validation Matrix

| Surface | Minimum validation | Evidence |
|---|---|---|
| Code only | syntax/build and targeted tests if present | command result summary |
| API | contract/routes/status/body/errors | API test/report or command summary |
| DB | migration/schema/seed/query | DB command summary |
| Auth/roles | role matrix allowed/denied | flow result summary |
| Security baseline | password hashing, token expiration, rate-limiting, input validation, headers, CORS, server-side role enforcement | security findings summary |
| UI | browser, console, screenshots | screenshot paths and console summary |
| Responsive UI | desktop and mobile viewports | screenshot paths |
| Visual quality | compare against PRD/context/log and visual references | visual findings summary |
| Docker local | `docker compose -f docker-compose-local.yml config` and runtime up/health | compose result summary |
| Docker VPS | static/config check of `docker-compose-vps.yml` for Swarm/Traefik readiness | config summary |
| Workflow | end-to-end critical flows | workflow result summary |
| Observability | health/logging for critical backend | check summary |

## Check Decisions

Choose checks by changed surface. Read a tool skill only when that specific tool
is useful for the risk being checked:

- `api-contract-testing`: WHEN_APPLICABLE for API contracts.
- `testing-gate`: PRE_CLOSE when tests/builds exist or changed code is executable.
- `workflow-testing`: WHEN_APPLICABLE for multi-step critical flows.
- `ui-screenshot-capture`: WHEN_APPLICABLE for UI.
- `visual-quality-gate`: PRE_CLOSE for product UI intended for client review.
- `a11y-validation-gate`: WHEN_APPLICABLE for UI.
- `observability-gate`: WHEN_APPLICABLE for critical backend/API/integration.
- `post-deploy-qa`: PRE_CLOSE for running apps.
- `docker-validation-gate`: WHEN_APPLICABLE for executable products and delivery
  packages.
- `security-baseline-gate`: WHEN_APPLICABLE for auth, credential storage or a
  write-capable backend endpoint.

Do not read or execute all tools by default. The LLM may use direct equivalent
checks when they prove the same product risk with less ceremony.

Host `node`, `npm`, database or framework commands can support fast checks, but
they are not equivalent evidence for Docker runtime readiness when the product
is executable.

If an applicable tool is unavailable, the LLM must record why, seek equivalent evidence, run a valid alternative when one exists, and block closure when the risk remains uncovered.

## API Contract Ownership

`api-schema.json` lives at project root and is maintained by the single LLM running the active objective. If API validation applies and the schema is absent, create or update it from PRD/context/NEXO/app-structure and the active objective before closure.

## Role Validation Minimum

When roles exist and the objective touches auth, navigation, protected data or role behavior, validate at least one allowed flow and one denied flow. Cover backend enforcement and UI or routing behavior. Check direct URL denial when applicable.

## Evidence Rules

Evidence can be concise and local to the tool or continuity record.

Required evidence is not a universal evidence JSON. It is the minimum artifact that proves the validation:

- command result;
- test result;
- screenshot;
- visible text extraction or screenshot text review for UI surfaces;
- console summary;
- API response summary;
- DB query result;
- visual finding.

## Failure Handling

If validation fails:

1. classify the failure as blocker, warning or informational;
2. fix blockers before closure;
3. rerun the relevant validation;
4. record what changed and what passed;
5. do not mark closure if the fix was not revalidated.

## Non-Goals

This contract must not:

- force every tool on every feature;
- force a registry read before coding or validation;
- create extra transfer files;
- create extra validation dossier files by default;
- duplicate PRD or NEXO;
- turn validation into more work than the product change.
