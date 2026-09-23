---
name: bawe-initialization-logic
description: Initialize the product intake for PRE_QUEUE using the interview assets.
---

# BaWe Initialization Logic

## Purpose

Create the initial intake artifacts required before PRD generation.

## Outputs

- `log-preguntas.md`


## Rules

- `comenzar <workspace_user_id>` already provides the user workspace. Resolve it as `[USER_WORKSPACE_ROOT] = [WORKSPACE_ROOT]/[workspace_user_id]/`.
- During A1, create the new project as `[PROJECT_ROOT] = [USER_WORKSPACE_ROOT]/[project_name]/`.
- Work only inside the selected project root.
- Preserve user-provided facts as product authority.
- Mark missing or contradictory facts explicitly instead of inventing them.
- Do not start project implementation.
- Do not create runtime state outside the artifacts listed above.

## Next Step

- Bootstrap nuevo: read and follow `assets/interview-questions.md`.
- Reanudacion desde `project-context-detector` con estado `INTAKE_IN_PROGRESS`: leer solo el bloque `Estado de entrevista` de `[PROJECT_ROOT]/log-preguntas.md` y despues el asset indicado por `Siguiente pregunta pendiente`.
- Si `project-context-detector` emite `CONTEXT_GENERATION_PENDING`, no leer esta skill ni assets de entrevista; leer `project-context-generator/SKILL.md`.

No leer defaults, templates ni assets posteriores para formular una pregunta pendiente. Leerlos solo cuando el asset actual lo ordene como cierre.

## Exit

Exit when the initial intake is explicit enough for `project-context-generator`.
