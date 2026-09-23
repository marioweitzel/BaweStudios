---
name: workflow-testing
description: Validate multi-step user journeys when the product objective depends on them.
---

# Workflow Testing

## Purpose

Verify complete user journeys across screens, API and persistence when those journeys are part of the active objective.

## Applicability

Use this tool when:

- a PRD flow has multiple dependent steps;
- auth, cart, checkout, CRUD, approval, role or lifecycle flows changed;
- closure depends on proving a full journey rather than an isolated route.

Skip when the objective is a single static or non-interactive surface.

## Inputs

- PRD acceptance criteria.
- `project-context.md`.
- `.bawe/build-directives.json`.
- Active objective.
- Running app or test harness when execution is allowed.
- Existing journey tests when present.

## Procedure

1. Define the journey from product authority.
2. Identify expected start state, steps, data changes and final state.
3. Execute existing workflow tests or manually verify the journey when allowed.
4. Record failures with the exact step that breaks.

## Minimal Output

- `journey`
- `result`
- `failures`

## Blocking Errors

- A critical journey cannot reach its expected final state.
- State is not preserved across steps.
- Error recovery path is broken when required.
- Required data changes are not persisted.

## Rules

- Do not assume an e-commerce journey unless the product actually has one.
- Do not write generic sample tests into the product unless requested by implementation work.
