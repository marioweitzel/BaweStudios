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
- `docker-compose-preview.yml` (only when `[WORKSPACE_ROOT]/.bawe-runtime/runtime-context.json` has `topology: "remote-hosted"` — see Rules)
- `.env.example`
- `.dockerignore`

## Rules

- Generate both compose files together. Do not generate a generic
  `docker-compose.yml` as the primary runtime file.
- `docker-compose-local.yml` is for local developer validation. It may use
  `build`, named volumes, published ports and `.env.example` values. Publish
  ports as `"${PORT_VAR}:CONTAINER_PORT"` — do not prefix with `127.0.0.1:`.
  BaweStudio may be running on a remote host with a `remote-hosted` topology
  (see `.agents/contracts/runtime-environment-contract.md`); a loopback-only
  bind makes the preview unreachable for anyone not on that host.
- `docker-compose-vps.yml` is for Ubuntu VPS Docker Swarm with Traefik. It must
  be suitable for `docker stack deploy`, use Swarm-compatible `deploy` labels,
  use the declared Traefik external network, and avoid localhost-only bindings.
- The VPS file is configured and kept current for user deployment, but the LLM
  does not deploy to a VPS unless explicitly asked.
- Read `deployment_topology` (`single_host` or `domain_hosted`) and
  `deployment_domain` from `project-context.md`/`log-preguntas.md` (set during
  the `B_DEPLOY` interview question). Still generate both compose files either
  way — this only decides which one `delivery-package-preparation` treats as
  the primary one to hand to the client. When `deployment_domain` is a real
  value (not `pending_client_input`), use it to fill the Traefik domain label
  in `docker-compose-vps.yml` instead of leaving a placeholder.
- **`docker-compose-preview.yml`** — a third, separate concern from
  `deployment_topology`/`B_DEPLOY` above; do not confuse the two fields, they
  drive different things:
  - This one is driven by `[WORKSPACE_ROOT]/.bawe-runtime/runtime-context.json`'s
    `topology` field (whether *this BaweStudio instance* is `local` or
    `remote-hosted` — see `runtime-environment-contract.md`), not by
    `deployment_topology` (which is about the *client's own future
    deployment* and only affects `docker-compose-vps.yml`/what
    `delivery-package-preparation` ships in the ZIP).
  - Only generate this file when `topology` is `"remote-hosted"`. Skip it
    entirely when `topology` is `"local"` or the file is absent.
  - Same services as `docker-compose-local.yml`, but: no service publishes a
    port to the host — not the frontend, not the backend, not the database.
    Multiple different clients' previews run concurrently on the same shared
    VPS, so nothing here should claim a host port at all; only Traefik needs
    to reach the frontend, over the `bawepreview` external network.
  - Compute a 13-digit id: the last 10 digits of `workspace_user_id` followed
    by `project.preview_subdomain_seq` from `project-context.md` (3 digits),
    concatenated with no separator — e.g. `8872745701002`.
  - Name every container/service in this file with that id as the prefix
    (e.g. `<id>_app`, `<id>_db`), not the project slug. The slug is not
    unique across different users, and these containers may run at the same
    time as another user's on the same host — the id is.
  - The frontend service joins the `bawepreview` external network (an
    attachable overlay, separate from `bawenet`, which is not attachable and
    is reserved for Swarm stacks) and carries
    Traefik labels: `traefik.enable=true`, `traefik.docker.network=bawepreview`,
    a router named `preview_<id>` (not the project name) with
    `` rule=Host(`<id>.bawestudio.com.ar`) ``, `entrypoints=websecure`,
    `tls.certresolver=letsencryptresolver`, and a
    `loadbalancer.server.port` pointing at the frontend's internal container
    port.
  - Plain Compose, no `deploy:` block — this is not a Swarm stack.
  - When `docker-compose-preview.yml` exists for a project, it replaces
    `docker-compose-local.yml` as the runtime validation target for that
    project (see `docker-validation-gate` and `project-lifecycle-contract`) —
    do not bring up both; they are the same stack, just exposed differently,
    and running both would duplicate every container.
- Use the frontend port from `project-context.md` when present.
- Backend defaults to port `3000` unless product authority says otherwise.
- Database defaults to port `3306` only when MySQL or compatible DB is selected.
- Declare required environment variables in `.env.example`; never create
  `.env`, `.env.local` or real secrets.
- Do not give a secret-bearing variable (JWT_SECRET, DB_PASSWORD, any seeded
  or initial admin password) a `${VAR:-value}` shell-default fallback in
  either compose file. Reference it as `${VAR}` with no default. A missing
  `.env` must make the container fail to start with a clear error, not run
  silently on a predictable placeholder — a fallback like
  `${JWT_SECRET:-change-me}` is exactly what turned into the real signing key
  for a delivered project when `.env` was never created, and two different
  real projects have already been found sharing the exact same fallback
  literal because the "placeholder" text is not actually random.
- Include health checks for backend and database when practical.
- Keep service names stable across local and VPS files.
- Do not run Docker in this generator. Runtime execution belongs to
  autonomous development or validation.

## Exit

Exit when `docker-compose-local.yml`, `docker-compose-vps.yml`, `.env.example`
and `.dockerignore` are structurally coherent with the declared stack, and
`docker-compose-preview.yml` too when `topology` is `remote-hosted`.
