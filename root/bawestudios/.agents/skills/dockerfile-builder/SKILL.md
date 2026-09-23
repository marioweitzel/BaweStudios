---
name: dockerfile-builder
description: Generate Dockerfile and nginx configuration artifacts when runtime or delivery needs them.
---

# Dockerfile Builder

## Purpose

Prepare Dockerfile artifacts for the declared frontend and backend stack.

For executable BaWe products, Dockerfiles are required before Docker Compose
runtime validation or delivery packaging.

## Inputs

- `project-context.md`
- `.bawe/build-directives.json`
- `.bawe/app-structure.json`
- `assets/nginx-conf-pattern.md`

## Outputs

- Frontend Dockerfile when applicable.
- Backend Dockerfile when applicable.
- Nginx config when the selected frontend stack needs it.

## Rules

- Follow the declared package manager and runtime when known.
- Keep generated files build-oriented but do not run the build.
- Reuse `assets/nginx-conf-pattern.md` for static frontend serving patterns.
- Support both `docker-compose-local.yml` and `docker-compose-vps.yml`.
- Do not hardcode secrets or environment-specific hostnames.
- Use stable names such as `backend/Dockerfile` and `frontend/Dockerfile` when
  the project has those runtime boundaries.

## Exit

Exit when Dockerfile artifacts match the planned stack.
