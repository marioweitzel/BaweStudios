# Delivery Documentation Contract

Runtime authority: `.agents/contracts/delivery-documentation-contract.md`

This contract defines the clean client-facing documentation generated during
`delivery-package-preparation`.

The documentation must explain the delivered product and how to use, install
and maintain it. It must not expose how the BaWe motor produced the product.

## Required Output

Inside the clean delivery package, create:

```text
LEEME.md
docs/
  01_MANUAL_USUARIO.md
  02_INSTALACION.md
  03_GUIA_TECNICA.md
  04_ESTRUCTURA_DEL_PROYECTO.md
  05_SOLUCION_PROBLEMAS.md
  06_API.md when API exists
```

`LEEME.md` is mandatory and must explain what each document is for.

## Audience Split

- `LEEME.md`, `01_MANUAL_USUARIO.md` and the opening of
  `02_INSTALACION.md` must be understandable by a non-technical client.
- `03_GUIA_TECNICA.md`, `04_ESTRUCTURA_DEL_PROYECTO.md`,
  `05_SOLUCION_PROBLEMAS.md` and `06_API.md` may address a developer or support
  person, but must stay practical and project-specific.

## Forbidden Content

Do not mention:

- BaWe, BaWeStudio or motor;
- LLM, Codex, agent, skill, prompt or rollout;
- PRD, `log-preguntas`, `project-context`, `task-log`, queue, objective ids,
  `component-queue`, `build-directives`, `app-structure`, `role-matrix`,
  `.bawe` or internal validation gates;
- internal screenshots, validation evidence paths or construction process.

Do not include real secrets, local private paths, developer-only commentary or
claims that a feature exists unless it is present in the delivered product.

Do not include delivery zip passwords, runtime secrets, private keys or real
`.env` values in any document inside the zip. If the delivery zip is protected,
the password is delivered outside the zip by the delivery system.

Carve-out: seeded application login credentials (the username/password a
seeded role needs to log into the delivered product itself) are not covered by
the two paragraphs above. They are a required part of `01_MANUAL_USUARIO.md`,
not a forbidden secret — the client cannot use the product without them. Only
infrastructure/runtime secrets (DB passwords, JWT secrets, third-party API
keys, zip passwords) stay out of the documentation.

## Required Content

`LEEME.md` must include:

- product name;
- one paragraph explaining the package;
- list of included documents and what each is for;
- a short visual tree of the delivered package at a high level;
- quick start pointer to installation;
- support/maintenance pointer to technical docs.

`01_MANUAL_USUARIO.md` must include:

- roles and what each role can do;
- main workflows;
- common user actions;
- limitations that matter to the client;
- when the product seeds login users (any role), a "Primer acceso" /
  "Acceso inicial" section with the actual username and password for each
  seeded role, so the client can log in without asking. This is a startup
  value the client needs, not a secret to withhold — see the carve-out under
  Forbidden Content.

`02_INSTALACION.md` must include:

- requirements;
- environment setup using `.env.example`;
- how to run locally with Docker when Docker artifacts exist;
- expected preview URL when known;
- how to stop/restart the app.

`03_GUIA_TECNICA.md` must include:

- stack summary;
- frontend/backend/database/runtime overview;
- important commands;
- where to extend common behavior.

`04_ESTRUCTURA_DEL_PROYECTO.md` must include:

- a visual tree of the delivered project folders and important files;
- clean explanation of delivered folders and important files;
- no internal motor files;
- what belongs to frontend, backend, runtime config and docs.

The visual tree must reflect the actual delivered package. Do not include
folders or files that were excluded from the zip. Keep the tree client-facing
and product-only, for example:

```text
proyecto/
+-- frontend/
|   +-- src/
|   +-- public/
|   +-- package.json
|   +-- Dockerfile
+-- backend/
|   +-- src/
|   +-- db/
|   +-- package.json
|   +-- Dockerfile
+-- docs/
+-- docker-compose-local.yml
+-- docker-compose-vps.yml
+-- .env.example
+-- api-schema.json
+-- LEEME.md
```

Adapt or omit entries based on the real delivered files.

`05_SOLUCION_PROBLEMAS.md` must include:

- common install/runtime issues;
- ports and environment variables;
- database reset/seed guidance when applicable;
- build and Docker troubleshooting.

`06_API.md` must exist when `api-schema.json` is delivered. It must summarize
API areas and point to `api-schema.json` as the technical contract without
mentioning internal generation.
