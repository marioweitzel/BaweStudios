---
name: ui-screenshot-capture
description: Capture real UI states and console summary when UI validation applies.
---

# UI Screenshot Capture

## Purpose

Capture actual UI states for changed or client-facing screens. This tool records what rendered; it does not judge visual quality.

## Applicability

Use this tool when:

- UI changed;
- responsive behavior must be verified;
- closure needs proof of expected screen states;
- visual-quality or accessibility review needs current screenshots.

Skip when the objective has no UI.

## Inputs

- Runtime URL.
- Expected routes and states.
- Active objective.
- PRD or build-directives expected UI states.
- Browser or screenshot capability when execution is allowed.

## Procedure

1. Open the relevant route.
2. Capture desktop and mobile states when applicable.
3. Capture expected states such as empty, loading, error, success or unauthorized when applicable.
4. Record console errors and page errors.
5. Report empty or wrong-state screenshots as blockers.

## Minimal Output

- `screenshot paths`
- `console summary`

## Blocking Errors

- Route does not render.
- Screenshot is blank or shows the wrong state.
- Critical console or page error occurs.
- Required responsive state cannot be captured.

## Rules

- Do not approve visual quality.
- Do not copy catalog colors, brand, copy, assets, prices or map tiles.
- Do not mark closure by screenshot existence alone.
