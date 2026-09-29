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
- Every served output that runs in a browser from this product's own
  infrastructure — the web frontend, and any `mobile/` output, since in this
  engine "mobile" always means a responsive web build (e.g. an Expo web
  export served by nginx), never a native app installed outside a web page —
  must proxy every backend-facing route (`/api/`, `/uploads/`, or any other
  prefix the product uses) through its own nginx internally. Extend
  `assets/nginx-conf-pattern.md`'s pattern to cover all of them, not only
  `/api/`. The browser must never call the backend directly: no CORS-based
  direct access, no absolute backend URL baked into a build. This is
  mandatory, with no exception — this engine does not produce a build
  distributed outside a web page, so there is no case where direct backend
  access would be unavoidable.
- Support both `docker-compose-local.yml` and `docker-compose-vps.yml`.
- Do not hardcode secrets or environment-specific hostnames.
- Use stable names such as `backend/Dockerfile` and `frontend/Dockerfile` when
  the project has those runtime boundaries.
- If a Dockerfile `COPY`s a script it later runs directly (`ENTRYPOINT`,
  `CMD` or an internal call), add an explicit `RUN chmod +x <script>` for it.
  Do not rely on the executable bit surviving the host checkout — Windows/NTFS
  has no Unix executable bit, so a script authored or checked out on Windows
  can silently lose it before it ever reaches the image.
- Any `.sh` script this skill generates must use LF line endings only. A
  CRLF line ending (common when a script is touched with Windows tools)
  makes the interpreter fail on Linux with a "bad interpreter" error.

## Exit

Exit when Dockerfile artifacts match the planned stack.
