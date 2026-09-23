# Professional Development Contract

Runtime authority: `.agents/contracts/professional-development-contract.md`

This contract guides one LLM while it develops a vertical objective after queue selection. It protects product quality without splitting the same LLM into rigid downstream implementation lanes.

It does not teach programming. It defines operating constraints, authority and product standards.

## Authority

Product authority:

1. `prd.md`
2. `project-context.md`
3. `log-preguntas.md`
4. explicit user clarifications recorded after those files

Operational authority:

1. `.bawe/build-directives.json`
2. `.bawe/component-queue.json` or the reduced active objective record
3. `.bawe/app-structure.json` and `.bawe/role-matrix.json` when present
4. `api-schema.json` when API contract applies
5. `.agents/contracts/project-lifecycle-contract.md` for queue, project status and runtime artifact lifecycle

If product authority and operational authority conflict, stop and record a blocker. Do not silently choose whichever is easier.

## Core Rules

ALWAYS:

- Build the requested product, not a demo or scaffold.
- Respect the declared stack unless a blocker makes it impossible.
- Do not invent features outside PRD/context/log/user clarifications.
- Exception: this protects product scope, not engineering baseline. Security
  hygiene covered by `security-baseline-gate` (password hashing, session/token
  expiration, rate-limiting, input validation, security headers, CORS/origin
  restriction, server-side role enforcement) applies whenever the matching
  technical surface exists, whether or not product authority mentions security
  by name — the same way real persistence and Docker runtime already apply
  without being requested by name.
- Keep global product vision while implementing the active objective.
- Start from `.bawe/app-structure.json` when it exists: source structure,
  module boundaries, route map, surface contracts, data flows, responsive
  contract and visual architecture are the implementation map.
- Implement vertical work when practical: UI, API, data, permissions and validation that belong to the same objective should be considered together.
- Keep code maintainable by responsibility, domain and runtime boundary.
- Use real persistence when persistence is part of the product.
- Create or update `api-schema.json` when the active objective introduces or changes API behavior.
- For executable products, create and maintain Docker runtime artifacts:
  `docker-compose-local.yml`, `docker-compose-vps.yml`, `.env.example`,
  `.dockerignore` and required Dockerfiles.
- Use `docker-compose-local.yml` for runtime validation on Windows Docker
  Desktop. Keep `docker-compose-vps.yml` configured for Ubuntu Docker Swarm
  with Traefik, but do not deploy to the VPS unless the user asks.
- Treat hardcoded operational data, mock persistence or hidden fallback stores
  as blockers.
- Do not hardcode product/domain data as a temporary shortcut for later DB
  migration. If data belongs to the product and may be created, edited, hidden,
  published, searched, filtered, related to a user/role, or shown as business
  content, put it behind the declared persistence path from the first objective
  that uses it. Change schema/seed/query code as many times as needed; do not
  leave zombie arrays or fallback objects in UI/API code.
- Initial product data that is needed to make the product usable must be DB
  seed data, not frontend or API hardcode, when the product has a database.
- Hardcode only stable non-product implementation data: UI labels/copy,
  static navigation, design tokens, feature constants, local assets and
  runtime-only UI state that is not product data.
- Preserve role and permission behavior when roles exist.
- Use tools that are applicable to the current objective.
- Prefer product development over documentation. Write only the evidence needed for continuity and closure.

WHEN_APPLICABLE:

- UI must include loading, empty, error, validation-error and success states where those states can occur.
- UI must be responsive when the product has a visual surface.
- UI must be designed as a client-presentable product surface, not only as a
  functional form, table or scaffold.
- UI visible to the client must not expose test/demo/local credentials,
  QA/readiness/validation data, internal construction copy, scaffolding language,
  future-screen promises, technical proof or validation state. Keep QA helpers
  outside the delivered UI or behind explicit local-only controls that are not
  present in client review mode.
- Keeping seed/login credentials out of the visible UI does not mean the client
  never learns them. When a product seeds login users with a fixed or generated
  password (any role, including admin/demo/test-labeled seed rows), that
  password is a startup value the client needs to access their own product, not
  a secret to withhold. It must reach `01_MANUAL_USUARIO.md` under
  `delivery-documentation-contract.md` (username and password per seeded role).
  If the password is generated rather than fixed, ensure it can be reproduced or
  read from the running seed step, not only hashed into source with no
  recoverable plaintext anywhere.
- UI should consider visual enrichment opportunities from app structure and
  product authority. Use interview clues about imagery, objects, mood or visual
  preference when coherent; otherwise infer or skip enrichment based on product
  value, not decoration.
- UI should include expected interaction polish for its workflow: clear
  affordances, hover/focus/pressed states, disabled/loading behavior, inline
  validation, success/error feedback and restrained transitions or motion when
  they improve clarity.
- Visible copy must be polished for the user's language and locale. Product copy
  must use correct accents, capitalization, role names, labels and action text;
  internal ASCII editing preferences do not justify broken visible UI copy.
- User-facing text and seed/runtime data must preserve valid UTF-8 rendering in
  the running product. Visible mojibake or replacement text such as `Ã`, `Â`,
  `�`, `ï¿½`, or words where accents became `?` is blocking. A literal `?` is
  allowed only when it is normal punctuation, not a broken character inside a
  word or phrase.
- Docker-first validation applies to executable products.
- API work must preserve declared contracts and must not invent frontend-consumed endpoints outside the active objective.
- If API work applies and `api-schema.json` is missing, create it at project root before closing the objective.
- DB work must include real schema/migration/seed/query behavior, not only code shape.
- Every `CREATE TABLE` must declare `CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  (or the equivalent explicit charset/collation for the declared database engine)
  explicitly, on every table, every time. Never rely on the database engine's
  server-level default collation, even when it is expected to already match —
  a later migration on the same project may run against an engine instance
  whose default differs (observed: MySQL 8.4 defaults to `utf8mb4_0900_ai_ci`
  server-wide even when the project's own database was created with
  `utf8mb4_unicode_ci`), silently splitting the schema across two collations
  and breaking comparisons/joins between old and new tables. If a later
  migration must realign tables that drifted from this rule, realign them to
  `utf8mb4_unicode_ci` (the project's own established collation), never to
  whatever the server's current default happens to be.
- Auth work must test allowed and denied paths by role.
- External integrations may be represented by safe local configuration, but the product must not pretend a real provider succeeded when credentials are absent.

## Modular Structure

Do not use a universal line-count hard block. File size is a signal, not the rule.

Refactor when a file:

- combines unrelated responsibilities;
- mixes UI composition, styling, state, API calls and domain logic in a way that blocks maintenance;
- makes a bug require reading a large unrelated surface;
- prevents targeted testing or replacement;
- hides product flows behind ad hoc procedural code;
- creates repeated copy/paste instead of clear domain modules.
- violates the source/module plan in `.bawe/app-structure.json` without a
  recorded reason.

Recommended signals:

- Above 600 lines: inspect and justify.
- Above 900 lines: refactor unless there is a clear generated-file or framework reason.

## Prohibited Shortcuts

Do not:

- sell a scaffold as product;
- close with "prototipo tecnico" when the requested standard is professional product;
- treat build priorities or initial scope as permission to lower product quality;
- replace declared stack with a simpler stack for convenience;
- use a single `index.html` or equivalent monolith for a multi-feature app when the declared stack is React/Vite/Tailwind or another modular stack;
- store business data in JSON/local memory when MySQL/Postgres/etc. is declared and available;
- add future features to make the product look fuller;
- hide dead buttons, dead routes or decorative controls that do nothing;
- ignore visual quality because API tests pass.
- silently replace required Docker validation with direct host execution.
- close with host Node/MySQL runtime when Docker local runtime has not been
  validated.
- leave unused functions, placeholder components, fake handlers or decorative
  data paths to make the UI look fuller.
- close a UI objective that still looks like a generic template, raw spreadsheet,
  CRUD skeleton or unpolished generated screen.

## Tool Use

Tools are available, not mandatory owners or mandatory reading. The LLM chooses
checks by surface:

- API: API contract checks, runtime checks, integration tests.
- UI: browser, screenshots, visual-quality, a11y.
- DB: migrations, seed checks, direct queries.
- Docker: `docker-compose-local.yml` config/up/health checks and
  `docker-compose-vps.yml` Swarm/Traefik config checks.
- Product flows: workflow testing and post-deploy QA.

Tool outputs may be concise. Do not create universal transfer packages or
universal validation dossiers for every micro-step.

## Professional Product Judgment

Before closure, the LLM must inspect both code and product behavior and ask:

- Is this a product slice I would deliver to a paying client?
- Can the user complete the intended workflow without hidden manual steps?
- Is every visible control wired to real behavior or honestly unavailable?
- Does the user-visible surface look intentionally designed for this product,
  with useful hierarchy, composition, states and interaction polish?
- Is all visible copy natural and correct for the user's language, including
  accents, capitalization and role/action names?
- Did I inspect the running UI and persisted seed/runtime data for mojibake,
  replacement characters or broken accents, including success/error messages
  produced by the implemented flow?
- Did visual references lead to concrete UI decisions, or did I only reproduce a
  basic functional layout?
- Did I handle useful visual enrichment opportunities with judgment, using
  product-authority clues when available and avoiding fake client identity or
  decorative assets?
- Is the implementation clean enough that the next change has an obvious place?
- Did I avoid future-scope code, fake data and unused helpers?
- Did the final visible product pass client presentation: no test credentials,
  QA data, internal construction copy, scaffolding language or technical proof
  shown to the client?

## Blockers During Development

Block development or record a blocker when:

- the stack cannot be respected;
- source authority is missing or contradictory;
- persistence cannot be made real;
- the active objective is unclear;
- role/security rules are ambiguous and no safe default exists;
- required dependencies cannot be installed or resolved;
- Docker/runtime cannot start and no independent work remains.
- Docker Desktop/Docker CLI is unavailable for required local validation.
- `docker-compose-local.yml` or `docker-compose-vps.yml` is missing/stale for
  an executable product.
- an applicable validation tool is unavailable and no equivalent evidence covers the risk.

## Output While Developing

During development, update only the continuity source with:

- active objective;
- meaningful files changed;
- validations already run;
- blockers;
- next action.

Do not create extra transfer JSON files or extra validation dossier files by default.
