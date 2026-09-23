---
name: testing-gate
description: Run or inspect applicable automated tests for changed executable code.
---

# Testing Gate

## Purpose

Validate executable code with the tests and build checks that apply to the changed surface.

## Applicability

Use this tool:

- before closure when executable code changed;
- when package scripts, test files or build commands exist;
- after correcting a blocker that automated tests can cover.

Skip only when no executable code or testable surface exists.

## Inputs

- Active objective.
- Changed files.
- Package manifests and test configuration.
- Existing unit, integration or end-to-end tests.
- Prior command summaries when revalidating.

## Procedure

1. Discover available scripts and test files.
2. Select the smallest command set that covers the changed surface.
3. Run syntax, build or test commands when runtime execution is allowed by the current task.
4. Summarize pass/fail results and failures.
5. Identify missing tests that block professional closure.

## Minimal Output

- `commands`
- `pass/fail summary`
- `failures`

## Blocking Errors

- Tests fail for changed or critical code.
- Build/syntax validation fails.
- Required critical flow has no automated or manual equivalent validation.
- A previous failing validation was not rerun after correction.

## Rules

- Do not require every possible test on every objective.
- Do not generate administrative reports by default.
- Do not update runtime state files outside normal continuity.
