---
name: docker-compose-generator
description: Generate required local and VPS Docker Compose artifacts for executable BaWe products.
---

# Docker Compose Generator

## Purpose

Prepare the Docker Compose runtime artifacts promised by BaweStudios.

For executable products, this helper is mandatory before runtime validation or
delivery packaging. It is not a planning dossier; it creates real runnable
artifacts.

## Inputs

- `project-context.md`
- `.bawe/build-directives.json`
- `.bawe/app-structure.json`

## Outputs

- `docker-compose-local.yml`
- `docker-compose-vps.yml`
- `.env.example`
- `.dockerignore`

## Rules

- Generate both compose files together. Do not generate a generic
  `docker-compose.yml` as the primary runtime file.
- `docker-compose-local.yml` is for Windows Docker Desktop and local developer
  validation. It may use `build`, named volumes, published localhost ports and
  `.env.example` values.
- `docker-compose-vps.yml` is for Ubuntu VPS Docker Swarm with Traefik. It must
  be suitable for `docker stack deploy`, use Swarm-compatible `deploy` labels,
  use the declared Traefik external network, and avoid localhost-only bindings.
- The VPS file is configured and kept current for user deployment, but the LLM
  does not deploy to a VPS unless explicitly asked.
- Use the frontend port from `project-context.md` when present.
- Backend defaults to port `3000` unless product authority says otherwise.
- Database defaults to port `3306` only when MySQL or compatible DB is selected.
- Declare required environment variables in `.env.example`; never create
  `.env`, `.env.local` or real secrets.
- Include health checks for backend and database when practical.
- Keep service names stable across local and VPS files.
- Do not run Docker in this generator. Runtime execution belongs to
  autonomous development or validation.

## Exit

Exit when `docker-compose-local.yml`, `docker-compose-vps.yml`, `.env.example`
and `.dockerignore` are structurally coherent with the declared stack.
