---
name: env-generator
description: Generate environment variable templates when runtime or delivery needs them.
---

# Env Generator

## Purpose

Create environment variable templates required by the planned stack.

For executable BaWe products, `.env.example` is required by local Docker Desktop
runtime and VPS Swarm/Traefik delivery. This helper is not a PRE_QUEUE planning
stage; it creates a real runtime template.

## Inputs

- `project-context.md`
- `.bawe/build-directives.json`
- `.bawe/app-structure.json`

## Outputs

- `.env.example`
- `.gitignore` updates when needed.

## Rules

- Never invent production secrets in `.env.example` — it is a template that
  ships with the project, so every sensitive value there must be an obvious
  human-readable placeholder (e.g. `changeme_before_running`), never a value
  that could pass as a real secret.
- The real `.env` created for local runtime validation is different: it is
  the file the container actually reads. For JWT_SECRET, DB_PASSWORD and any
  seeded/initial admin password, generate a genuinely random, unique value
  per project — not a memorable phrase, not a value copied from another
  project or from `.env.example`. This is not "inventing a production
  secret" in the sense this rule restricts; every running instance needs its
  own unpredictable signing key and password regardless of what product
  authority says, the same way real persistence and Docker runtime already
  apply without being requested by name.
- Keep variable names stable across frontend, backend and compose artifacts.
- Do not connect to external services.
- Do not create `.env` or `.env.local` during PRE_QUEUE.
- Create the real local `.env` only during implementation or delivery, when
  the app must actually run. Non-secret values may still be safe placeholders
  or explicit user-provided values; secret values follow the random-generation
  rule above, not this one.
- That real `.env` is the exhibition `.env`: the one read by the compose that
  shows the project inside BaweStudio. Rules:
  - One per project. Create it only when it does not exist; never regenerate or
    overwrite an existing one (new credentials against an existing database
    volume break the backend with "Access denied").
  - If the product has several roles, seed one user per role, each with its
    own random password; the delivered documentation lists exactly those same
    test credentials (they are test-environment credentials, not production).
  - On Linux create it with mode 600, owned by the user running the LLM.
  - Never print its secret values in chat or in logs, never include it in the
    delivery package, and never write it to any file under `delivery/`.
    It lives only inside BaweStudio and goes away with the project.
  - The client's own `.env` for their deployment is a different file: they
    create it by copying `.env.example` (see Delivery Compose Variables).
- Delivery Compose Variables: `docker-compose-local.yml` and
  `docker-compose-vps.yml` carry no default values for passwords or secrets, so
  `.env.example` must declare every such variable with an obvious placeholder
  (`changeme_before_running`) and the client must copy it to `.env` and fill it
  in before running anything.
- If another artifact already owns `.env.example`, update that file instead of creating a competing env template.
- Include variables referenced by `docker-compose-local.yml` and
  `docker-compose-vps.yml`.
- Include Traefik/VPS placeholders such as hostnames, external network name and
  image tags when the VPS compose file references them.

## Exit

Exit when required variables are declared in one consistent template.
