---
name: a11y-validation-gate
description: Validate accessibility risks for UI surfaces when accessibility-relevant UI changed.
---

# A11Y Validation Gate

## Purpose

Check accessibility blockers in changed UI surfaces.

## Applicability

Use this tool when:

- UI changed;
- forms, navigation, buttons, modals, auth or role flows changed;
- closure requires keyboard, focus, labels or contrast confidence.

Skip when the objective has no UI.

## Inputs

- UI code.
- Runtime URL or screenshots when available.
- Active objective.
- Expected routes and states.
- Existing accessibility audit output when present.

## Procedure

1. Check semantic structure and headings.
2. Check interactive accessible names.
3. Check keyboard navigation and visible focus.
4. Check color contrast for normal and large text.
5. Check form labels, errors and disabled states.
6. Check reduced motion expectations when motion exists.

## Minimal Output

- `findings`
- `blockers`

## Blocking Errors

- Essential control has no accessible name.
- Keyboard navigation cannot reach or operate a critical flow.
- Focus is invisible or trapped incorrectly.
- Text contrast blocks reading.
- Form error or validation state is inaccessible.

## Rules

- Do not evaluate aesthetic polish as accessibility.
- Do not approve closure by accessibility alone.
