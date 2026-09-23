---
name: api-contract-testing
description: Validate API implementation against api-schema.json when API scope applies.
---

# API Contract Testing

## Purpose

Verify that implemented API routes, request bodies, response bodies and error paths match `api-schema.json`.

## Applicability

Use this tool when:

- an objective changes API routes;
- frontend code consumes API routes;
- `api-schema.json` exists or the objective requires an API contract;
- closure needs proof that API behavior matches declared contracts.

Skip when the objective has no API surface.

## Inputs

- Active objective from `.bawe/component-queue.json`.
- `.bawe/build-directives.json`.
- `api-schema.json` when API applies.
- Relevant backend and frontend implementation files.
- Existing test commands from package manifests.

## Procedure

1. Identify the API surfaces touched by the active objective.
2. Compare implemented routes with `api-schema.json`.
3. Check request, response, status and error contracts.
4. Run existing API contract tests when available.
5. If tests are missing but API scope applies, report that as a validation gap.

## Minimal Output

- `summary`
- `failures`
- optional artifact path when a test runner produces one

## Blocking Errors

- API contract is required but missing.
- Implemented route is absent from `api-schema.json`.
- Frontend calls an undeclared route.
- Response or error shape contradicts the contract.
- Required API test cannot run and no equivalent validation exists.

## Rules

- Do not modify `api-schema.json`.
- Do not create implementation code.
- Do not mark an objective ready by this tool alone.
