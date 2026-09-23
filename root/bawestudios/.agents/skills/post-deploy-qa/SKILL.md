---
name: post-deploy-qa
description: Actively verify a running app against product expectations before professional closure.
---

# Post Deploy QA

## Purpose

Validate a running application from the user's point of view: routes, flows, console/runtime behavior and expected states.

## Applicability

Use this tool before closure when:

- the app can run locally or in a deployed environment;
- UI or product workflows changed;
- the objective claims user-visible readiness.

Skip only when there is no runnable app target for the objective.

## Inputs

- Runtime URL.
- PRD acceptance criteria.
- `project-context.md`.
- `.bawe/build-directives.json`.
- Expected routes and critical flows.
- Browser capability when execution is allowed.

## Procedure

1. Confirm the app responds at the runtime URL.
2. Navigate expected routes.
3. Exercise critical interactions and flows.
4. Capture screenshots when useful.
5. Collect console, page and request failures.
6. Compare observed behavior with product authority.

## Minimal Output

- `routes checked`
- `flows checked`
- `console/runtime findings`

## Blocking Errors

- App does not respond.
- Planned route is missing or broken.
- Critical flow fails.
- Critical console or runtime error exists.
- UI state contradicts the expected product flow.

## Rules

- Do not modify implementation code.
- Do not close by HTTP 200 alone.
- Do not require this tool when no runtime target exists.
