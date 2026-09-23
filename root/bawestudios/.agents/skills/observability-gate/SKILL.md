---
name: observability-gate
description: Validate health, logging and operational visibility when backend, API or integration scope makes it necessary.
---

# Observability Gate

## Purpose

Check that critical backend, API, integration or background work has enough health and logging visibility to support a professional product.

## Applicability

Use this tool when:

- critical API or backend behavior changed;
- integrations, payments, background jobs or persistent services changed;
- production-like operation requires health checks or structured logging.

Do not require this tool for:

- static landing pages;
- frontend-only prototypes without backend runtime;
- purely visual changes without operational risk.

## Inputs

- Active objective.
- `.bawe/build-directives.json`.
- API or backend implementation files.
- Integration adapters or background process files.
- Runtime logs or health endpoints when execution is allowed.

## Procedure

1. Identify operationally critical surfaces.
2. Check for health endpoint or equivalent readiness signal when backend applies.
3. Check structured error logging for critical paths.
4. Check integration failure visibility when integrations apply.
5. Classify gaps as blockers or warnings based on product risk.

## Minimal Output

- `health/logging findings`

## Blocking Errors

- Critical backend has no health/readiness signal.
- Critical failure path has no useful logging.
- Integration errors are swallowed silently.
- Runtime logs show critical repeated failures.

## Rules

- Applicability is `WHEN_APPLICABLE`.
- Do not block frontend-only or static work by default.
- Do not require observability for every objective.
