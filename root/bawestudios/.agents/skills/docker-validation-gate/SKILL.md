---
name: docker-validation-gate
description: Validate Docker and Compose configuration when containerized runtime applies.
---

# Docker Validation Gate

## Purpose

Check Dockerfile, Compose and environment configuration for containerized projects.

## Applicability

Use this tool when:

- the product is executable;
- `docker-compose-local.yml` or `docker-compose-vps.yml` exists;
- Dockerfiles exist;
- closure depends on containerized runtime confidence.

Skip only for explicitly non-executable/static deliverables, and record why.

## Inputs

- `docker-compose-local.yml`.
- `docker-compose-vps.yml`.
- Dockerfiles.
- `.env.example` and relevant env templates.
- `.bawe/build-directives.json`.
- Docker CLI availability when execution is allowed.

## Procedure

1. Check `docker-compose-local.yml` YAML structure.
2. Check `docker-compose-vps.yml` YAML structure.
3. Check required services for the declared stack.
4. Check referenced environment variables are declared in `.env.example`, and
   that every secret-bearing variable in the delivery compose files uses the
   `${VAR:?clear message}` form (no default value).
5. Check local volumes, ports and health checks when applicable.
6. Check VPS Swarm `deploy` blocks and Traefik labels/network when web runtime
   is exposed.
7. Run `docker compose -f <file> config` for each compose file this project
   uses when execution is allowed, with the project's exhibition `.env` already
   created by `env-generator` (without it, `${VAR:?...}` variables stop
   `config` by design). The delivery VPS file (`docker-compose-vps.yml`) is only
   validated statically (structure, `config`, labels/network); do not deploy it
   to Swarm as a validation step — if it fails on the client's side, support
   handles it.
8. Run runtime up/health when runtime validation is required and Docker is
   available, following "Compose Target" in `runtime-environment-contract.md`:
   - `topology` local or absent: bring up `docker-compose-local.yml` and leave
     it up — it is what the client sees.
   - `topology` `remote-hosted`: first validate the delivered
     `docker-compose-local.yml` as is, transiently, on a free host port passed
     from the command line (`FRONTEND_PORT=<free port>`, no file edit), check
     it on `localhost:<port>`, then `docker compose down -v` it. Then bring up
     `docker-compose-preview.yml` and leave it up. Never run both at once.
   - `topology` `remote-hosted` and `docker-compose-preview.yml` absent
     (project built before the preview existed): do not run any compose; mark
     runtime validation `NEEDS_VALIDATION` and say the preview compose is
     missing.
9. Summarize runtime blockers and config warnings.

## Minimal Output

- `compose/config/runtime summary`

## Blocking Errors

- `docker-compose-local.yml` is missing for an executable product.
- `docker-compose-vps.yml` is missing for an executable product.
- Compose file is invalid.
- Required service is missing.
- Required env var is undeclared.
- Secret is hardcoded in config — this includes a `${VAR:-value}` shell-default
  fallback for a secret-bearing variable (JWT_SECRET, DB_PASSWORD, session
  secret, seeded/initial admin password), not only a literal with no `${}`
  indirection at all. If `.env` is absent, that default becomes the real
  secret at runtime, so secret-bearing variables must have no default.
- VPS web service lacks Traefik/Swarm deployment configuration.
- Docker config command fails when it is required and allowed.

## Rules

- Executable BaWe products require Docker local validation before client review.
- When BaweStudio is `remote-hosted` (see `runtime-environment-contract.md`),
  the project is shown through `docker-compose-preview.yml` (no host ports,
  Traefik routes to it). Validate the preview without `localhost:port`: health
  and API through `docker compose -f docker-compose-preview.yml exec`, and the
  UI flow through its public URL `https://<id>.bawestudio.com.ar` once it
  responds. The delivered local compose is validated transiently as described
  in step 8; the delivered VPS compose is never deployed here.
- Do not deploy to a VPS unless explicitly asked.
- Do not start containers unless the current task allows runtime validation.
- Do not treat host Node/MySQL execution as equivalent Docker runtime evidence.
