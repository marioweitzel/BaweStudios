---
name: delivery-package-preparation
description: Prepare a clean client delivery package and zip after client-facing review passes.
---

# Delivery Package Preparation

## Purpose

Create a clean client-facing delivery folder and zip without exposing BaWe motor
state, internal traces, validation evidence or construction process.

This stage does not modify the source workspace except to create delivery
outputs, write `.bawe/delivery-package.json`, update `.bawe/component-queue.json`
to the final project state when successful, and append minimal continuity to
`task-log.md`.

## Entry Condition

Run only when:

```text
[PROJECT_ROOT]/.bawe/component-queue.json
project_status = AWAITING_DELIVERY_PREPARATION
next_node = delivery-package-preparation

[PROJECT_ROOT]/.bawe/client-facing-product-review.json
status = PASS
client_ready_verdict = true
```

If either condition is missing, do not package. Record the blocker in
`.bawe/delivery-package.json` with `status = BLOCKED`, leave
`.bawe/component-queue.json` non-final, and respond with the partial message.

## Required Inputs

- `.bawe/component-queue.json`
- `.bawe/client-facing-product-review.json`
- `.agents/schemas/delivery-package.schema.json`
- `task-log.md` only for operational facts such as preview/runtime URL, commands
  and current ports
- `prd.md` and `project-context.md` only as internal source material when needed
  to understand the delivered product; never copy them into the delivery package
  and never mention those file names in client docs
- product source folders/files in `[PROJECT_ROOT]`
- `.agents/contracts/delivery-documentation-contract.md`
- `.agents/contracts/runtime-environment-contract.md`

Do not use internal planning files as direct delivery documents. If product
details are needed for clean documentation, infer them from the finished app
structure, runtime files, API schema and client-facing product behavior.

## Clean Package Location

Create:

```text
[PROJECT_ROOT]/delivery/[project_name]/
[PROJECT_ROOT]/delivery/[project_name].zip
[PROJECT_ROOT]/DELIVERY_ZIP_PASSWORD.txt
```

Do not delete or sanitize the source workspace. The source workspace remains the
internal construction/audit workspace.

`[PROJECT_ROOT]/DELIVERY_ZIP_PASSWORD.txt` is an internal handoff file for
BaweStudios. It must stay outside `delivery/` and must never be copied into the
delivery folder or zip.

## Classification Rules

Before copying, classify root-level files and directories.

Never include:

```text
.bawe/
log-preguntas.md
project-context.md
prd.md
task-log.md
scratch/
delivery/
node_modules/
.git/
rollouts
sessions
chrome-profile*/
*.log
*.zip
DELIVERY_ZIP_PASSWORD.txt
```

Never include internal files whose names contain:

```text
component-queue
build-directives
app-structure
role-matrix
prd-validation-gate
client-facing-product-review
delivery-package
```

Include when present and part of the delivered product:

```text
frontend/
backend/
mobile/
admin/
shared/
packages/
public/
assets/
logo or brand assets
docker-compose*.yml
.env.example
.dockerignore
.gitignore
package manifests
api-schema.json when API exists
```

For source folders, copy source and required config, not dependency caches:

```text
exclude node_modules/
exclude build caches
exclude temporary screenshots
exclude local logs
```

`frontend/dist/` may be included only when the project is intentionally delivered
as static built output. Otherwise omit it and document the build/run command.

## Documentation

Read `.agents/contracts/delivery-documentation-contract.md` and generate the
required clean docs inside the delivery package:

```text
LEEME.md
docs/01_MANUAL_USUARIO.md
docs/02_INSTALACION.md
docs/03_GUIA_TECNICA.md
docs/04_ESTRUCTURA_DEL_PROYECTO.md
docs/05_SOLUCION_PROBLEMAS.md
docs/06_API.md when API exists
```

The docs must not mention BaWe, motor, LLM, PRD, queues, `.bawe`, task-log,
internal gates, objective ids or construction evidence.

The docs must not contain the zip password or any real secret. They may say that
the delivery system provides the zip password separately.

## Protected Zip

Generate a strong random zip password and write it to:

```text
[PROJECT_ROOT]/DELIVERY_ZIP_PASSWORD.txt
```

Use this exact file shape:

```text
ZIP_PATH=delivery/[project_name].zip
ZIP_PASSWORD=<generated_password>
PASSWORD_DELIVERY=bawe_studios_external
```

Password rules:

- generate a new password for each delivery package;
- minimum 24 characters;
- use letters, numbers and safe symbols;
- do not reuse project names, user ids, emails or predictable words;
- do not write the password into `.bawe/delivery-package.json`;
- do not write the password into any file inside `delivery/`.

Create `[PROJECT_ROOT]/delivery/[project_name].zip` as a password-protected zip.
Use AES-capable zip encryption. Prefer `7z` on PATH. If unavailable, resolve the
workspace runtime binary via the `7zip-bin` package's JS API (it ships separate
binaries per OS/arch — do not hardcode a path), as described in
`.agents/contracts/runtime-environment-contract.md`:

```js
require('7zip-bin').path7za
```

Create the zip from inside the clean package directory. The internal zip root
must not expose `[WORKSPACE_ROOT]`, `[workspace_user_id]`, `[PROJECT_ROOT]`,
`delivery/` or any BaWeStudio workspace path. The client must see only the
delivered project contents at zip root, such as `LEEME.md`, `docs/`, `frontend/`
and `backend/`.

Example command:

```text
cd [PROJECT_ROOT]/delivery/[project_name]
7z a -tzip -mem=AES256 -p<password> ../[project_name].zip ./*
cd -
```

Do not rely on a `Compress-Archive`-style tool for final delivery packages that
require a password; it does not create encrypted zips. If no AES-capable zip
tool is available, set `.bawe/delivery-package.json.status = BLOCKED`, record
the missing encryption tool as `blocking_reason`, keep the project non-final
and respond with the partial message.

After creating the zip, verify:

- the zip file exists;
- `DELIVERY_ZIP_PASSWORD.txt` exists outside `delivery/`;
- the password file is not inside the zip;
- the zip listing does not contain `[workspace_user_id]`, `[PROJECT_ROOT]`,
  `[WORKSPACE_ROOT]`, `delivery/` or absolute/local workspace path prefixes;
- the zip can be listed or tested with the generated password when the chosen
  tool supports validation.

## Preview URL

Determine the preview host from
`[WORKSPACE_ROOT]/.bawe-runtime/runtime-context.json`, per
`.agents/contracts/runtime-environment-contract.md`:

- If the file is absent, or `topology` is `"local"`: the preview host is
  `localhost`.
- If `topology` is `"remote-hosted"`: the preview host is `public_base_url`
  from that file. Do not fall back to `localhost` in this case — a
  `remote-hosted` preview pointing at `localhost` is broken for anyone who is
  not on the machine running BaweStudio.

Take the frontend port from `task-log.md` (or from the project's generated
`docker-compose-local.yml` when `task-log.md` does not record it) — the same
port a human would open to see the running product.

Build `preview.url` as `<host>:<port>` (for example `http://localhost:5173`
or `http://164.68.109.5:5173`), unless `public_base_url` already contains an
explicit port, in which case use `public_base_url` as-is without appending
another one.

Set `preview.type` to the `topology` value actually used (`"local"` or
`"remote-hosted"`) — do not hardcode `"local"` regardless of topology.

## Delivery Pointer

Write:

```text
[PROJECT_ROOT]/.bawe/delivery-package.json
```

The JSON must conform to:

```text
.agents/schemas/delivery-package.schema.json
```

Use this shape:

```json
{
  "schema_version": "1.0",
  "status": "READY",
  "project_id": "",
  "package_dir": "delivery/[project_name]",
  "zip_path": "delivery/[project_name].zip",
  "zip_encrypted": true,
  "password_file": "DELIVERY_ZIP_PASSWORD.txt",
  "encryption": {
    "enabled": true,
    "method": "zip-aes",
    "password_delivery": "bawe_studios_external"
  },
  "preview": {
    "type": "local",
    "url": ""
  },
  "included": [],
  "excluded_internal": [],
  "docs": [],
  "created_at": ""
}
```

If the package cannot be completed, use `status = BLOCKED`, include a
`blocking_reason`, keep `project_status = AWAITING_DELIVERY_PREPARATION` or
`BLOCKED` as appropriate, and do not set final readiness.

## Queue Update

On successful package creation and zip creation:

- confirm the zip is password-protected;
- confirm `DELIVERY_ZIP_PASSWORD.txt` exists at `[PROJECT_ROOT]` and is not
  included in the zip;

- set `.bawe/component-queue.json.active_objective_id` to `null`;
- set `.bawe/component-queue.json.status` to `READY_FOR_CLIENT_REVIEW`;
- set `.bawe/component-queue.json.project_status` to `READY_FOR_CLIENT_REVIEW`;
- set `.bawe/component-queue.json.next_node` to `null`;
- set `.bawe/component-queue.json.next_skill` to `null`;
- set `.bawe/component-queue.json.next_action` to say the clean delivery package
  is ready and points to `.bawe/delivery-package.json`.

BaweStudios reads `.bawe/delivery-package.json` to show:

- download link from `zip_path`;
- preview link from `preview.url`.
- password handoff location from `password_file`, then reads that file from
  `[PROJECT_ROOT]` and delivers the password outside the zip.

## Exit

After successful delivery packaging, the final assistant message must be exactly:

```text
Finalizado.
```

If blocked or incomplete, the final assistant message must be exactly:

```text
Parcial completado. Espero "continuar" para proseguir.
```
