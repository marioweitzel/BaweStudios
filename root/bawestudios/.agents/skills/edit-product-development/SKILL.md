---
name: edit-product-development
description: Low-impact development cycle for a single Ajuste item from the edit queue on an already-delivered project; adapted from autonomous-product-development for minimal-footprint fixes.
---

# Edit Product Development

## Purpose

Implement ONE Ajuste item from `.bawe/edit-queue.json` on an already
delivered, real product. This is not a build cycle: the goal is the
smallest correct change that satisfies the item, with the existing
product's design system, architecture and data model left untouched unless
the item is explicitly about exactly that surface.

This skill is not client-facing. It is reached only through
`edit-intake/SKILL.md`'s Entry logic, never directly from the dispatcher.

Once reached, work silently — do not send any conversational message to
whoever is watching this session until the queue is fully processed or
work must pause. The only two valid outputs are the exact pause phrase and
the exact completion phrase defined under Queue Advancement below; nothing
else should reach the caller in between.

## Required Inputs

- `.bawe/edit-queue.json`
- `.bawe/app-structure.json` (read-only reference; never modify
  `design_system`)
- `.bawe/build-directives.json`
- `task-log.md`

## Entry

1. If no item in `.bawe/edit-queue.json` has `status: ACTIVE`, select the
   oldest item with `status: PENDING`, read its `surface_refs` and set it
   to `ACTIVE`.
2. Read only the referenced surface(s) from `.bawe/app-structure.json` and
   the actual source files under those surfaces — do not reread unrelated
   modules or surfaces.
3. If `reference_assets` includes an image, look at it before implementing;
   it is the client's own marking of what to change.

## Low-Impact Rules

- Before changing any file for the first time in this edit-queue run, copy
  it to `.bawe/edit-backups/<item_id>/<same relative path>`, using the
  `item_id` that first touches it, so the pre-edit-session version is
  recoverable. If a later item in the same run touches a file an earlier
  item already backed up, do not back it up again under the later item —
  the earlier backup already preserves the true original; a second copy
  would only capture an already-edited state, not the original. Do not use
  git for this — git is not used in this workspace unless the user
  explicitly authorized it.
- Touch only the files needed for this item's `surface_refs`. Do not
  refactor, rename or "clean up" unrelated code while in there.
- Do not modify `.bawe/app-structure.json.design_system` (palette,
  typography, signature_element, motion, restraint_rules,
  component_primitives, radius, icons). Reuse it exactly as it already is.
- Do not add a new surface, new role, new integration or new data entity.
  If implementing the item turns out to need one, stop, set the item's
  `status` to `BLOCKED` with a short reason in `task-log.md`: it was
  misclassified as Ajuste and needs to go back through `edit-intake` as an
  Extensión instead.
- Do not modify `prd.md` or `project-context.md`. Those stay the historical
  record of the original build; `.bawe/edit-queue.json` and `task-log.md`
  are the record for this change.
- Never expand scope beyond the item's own `summary`. If the client's
  original words (`client_request_raw`) suggest more than the item
  captured, that is a new item for a future `cambios` call, not silent
  extra work here.

## Validation

Select applicable checks by the surface actually touched, same
applicability logic as `.agents/contracts/self-validation-contract.md` —
read it if unfamiliar, it already applies regardless of whether the change
came from original construction or an edit. For a typical small Ajuste this
usually means: `visual-quality-gate` if a visual surface changed,
`a11y-validation-gate` if UI changed, `security-baseline-gate` if
auth/credentials/write endpoints changed. Do not run checks the touched
surface does not need, and do not reopen `software-product-architect` or
`architecture` — there is no new architecture to plan here.

## Refreshing Delivery

Once the item is implemented and validated:

1. Read and execute
   `[WORKSPACE_ROOT]/.agents/skills/delivery-package-preparation/SKILL.md`
   to refresh `delivery/[project_name]/` and its zip from the updated
   source — the client's delivered package must reflect the fix, not just
   the working source tree.
2. Set the item's `status` to `DONE` in `.bawe/edit-queue.json`.
3. Record what changed, what was validated and that delivery was refreshed
   in `task-log.md`, tagged `[cambios]`, and update its `Current State`
   header block (`current_objective`, `project_status`, `next_action`,
   `last_updated`) — do not leave it showing the state from before this
   edit session.

## Queue Advancement

After marking an item `DONE`:

- If another `PENDING` item remains in `.bawe/edit-queue.json`, select it
  as `ACTIVE` and continue in the same session, or pause here if the
  session needs to end.
- If no `PENDING` item remains, set the file's own `status` to `DONE`.

### Signaling The Result

Writing a summary of what was built and validated in your final response is
normal and expected — do not suppress it. But BaweStudio detects the
outcome mechanically, by searching the raw response for one exact marker,
not by reading your summary. Include the correct marker verbatim, on its
own line, anywhere in the response — before, after or in the middle of your
summary does not matter, as long as the exact bracketed text is present
unmodified (no markdown bold around it, no translation, no paraphrase):

- Work must pause, another `PENDING` item remains and the session ends
  here:

```text
[[BAWE_CAMBIOS_EDICION_PARCIAL]]
```

  This means still in progress, not finished — a later
  `cambios <workspace_user_id> <project_name>` call resumes it (never
  `continuar`, that routes to the original build pipeline).

- Every item in `.bawe/edit-queue.json` is `DONE`:

```text
[[BAWE_CAMBIOS_EDICION_FINALIZADA]]
```

  This means the entire request is finished — BaweStudio uses it to notify
  the client, with no further `cambios` call needed.

Never write both markers in the same response. Never write a marker whose
condition is not actually true. These are deliberately different tokens
from `Parcial completado.`/`Finalizado.` (the original pipeline's signals)
— the two tracks must stay distinguishable even if a response gets
truncated or reordered.

## Rules

- Never touch `.bawe/component-queue.json` or any build-pipeline state —
  edits and original construction stay on separate tracks.
- Do not require Docker validation for changes that do not touch runtime
  configuration, but do still confirm an executable product actually
  builds and runs for the touched surface when applicable.
- Do not close an item as `DONE` without having refreshed the delivery
  package — a fix the client cannot see is not finished.
