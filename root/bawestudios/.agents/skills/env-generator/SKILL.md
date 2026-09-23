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

- Never invent production secrets.
- Use placeholders for sensitive values.
- Keep variable names stable across frontend, backend and compose artifacts.
- Do not connect to external services.
- Do not create `.env` or `.env.local` during PRE_QUEUE.
- Create real local env files only during implementation or delivery when the app must run and the values are safe placeholders or explicit user-provided values.
- If another artifact already owns `.env.example`, update that file instead of creating a competing env template.
- Include variables referenced by `docker-compose-local.yml` and
  `docker-compose-vps.yml`.
- Include Traefik/VPS placeholders such as hostnames, external network name and
  image tags when the VPS compose file references them.

## Exit

Exit when required variables are declared in one consistent template.
