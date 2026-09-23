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
4. Check referenced environment variables are declared in `.env.example`.
5. Check local volumes, ports and health checks when applicable.
6. Check VPS Swarm `deploy` blocks and Traefik labels/network when web runtime
   is exposed.
7. Run `docker compose -f docker-compose-local.yml config` when execution is
   allowed.
8. Run local compose up/health when runtime validation is required and Docker is
   available.
9. Summarize runtime blockers and config warnings.

## Minimal Output

- `compose/config/runtime summary`

## Blocking Errors

- `docker-compose-local.yml` is missing for an executable product.
- `docker-compose-vps.yml` is missing for an executable product.
- Compose file is invalid.
- Required service is missing.
- Required env var is undeclared.
- Secret is hardcoded in config.
- VPS web service lacks Traefik/Swarm deployment configuration.
- Docker config command fails when it is required and allowed.

## Rules

- Executable BaWe products require Docker local validation before client review.
- Do not deploy to a VPS unless explicitly asked.
- Do not start containers unless the current task allows runtime validation.
- Do not treat host Node/MySQL execution as equivalent Docker runtime evidence.
