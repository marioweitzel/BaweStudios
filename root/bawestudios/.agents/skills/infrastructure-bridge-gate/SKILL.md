---
name: infrastructure-bridge-gate
description: Perform structural runtime artifact checks when Docker/env delivery artifacts exist.
---

# Infrastructure Bridge Gate

## Purpose

Check that optional runtime or delivery artifacts are internally consistent when they exist.

This helper is optional. It is not a PRE_QUEUE routing stage.

## Inputs

- `project-context.md`
- `prd.md`
- `.bawe/build-directives.json`
- `.bawe/app-structure.json`
- `.bawe/role-matrix.json` when applicable.
- Compose, Dockerfile and env artifacts when generated.

## Output

Return one of:

- `PASS`
- `NEEDS_CORRECTION`
- `BLOCKED`

## Rules

- Validate structure and cross-file consistency only.
- Do not run Docker, package installation, tests, browser checks or deployment.
- If a blocker affects runnable delivery, return `BLOCKED`.

## Exit

Exit when runtime artifacts are coherent or not applicable.
