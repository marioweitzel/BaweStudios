---
name: extension-context-detector
description: Layered-marker detector for one Extensión item's pipeline, from interview through queued development. Clone of project-context-detector retargeted at extension-* files.
---

# Extension Context Detector

## Responsabilidad única

Resolver en qué capa está el procesamiento de UN item Extensión activo,
buscando marcadores de mayor a menor madurez dentro de `[PROJECT_ROOT]` y
cortando en el primero válido — igual que `project-context-detector`, pero
sobre los archivos `extension-*`, nunca sobre `prd.md`,
`project-context.md`, `.bawe/app-structure.json` ni
`.bawe/component-queue.json`.

Solo se llega acá desde `edit-intake` (primera vez) o desde el propio
`cambios <workspace_user_id> <project_name>` en una reanudación (vía el
chequeo de `edit-intake`'s Entry). No interpreta producto; solo reporta
estado, puntero y regla de lectura mínima.

## Capas, de mayor a menor madurez

1. `.bawe/extension-queue.json` existe
   → estado `EXTENSION_DEVELOPMENT_IN_PROGRESS`
   → leer `extension-product-development/SKILL.md`.

2. `.bawe/extension-app-structure.json` existe
   (y no se cumplió la capa 1)
   → estado `EXTENSION_ARCHITECTURE_READY`
   → leer `extension-queue-generator/SKILL.md`.

3. `.bawe/extension-build-directives.json` existe
   (y no se cumplieron las capas 1–2)
   → estado `EXTENSION_NEXO_READY`
   → leer `extension-architecture/SKILL.md`.

4. `.bawe/extension-prd-validation-gate.json` existe con `status: PASS`
   (y no se cumplieron las capas 1–3)
   → estado `EXTENSION_PRD_VALIDATED`
   → leer `extension-adn-translator/SKILL.md`.

5. `.bawe/extension-prd.md` existe
   (y no se cumplieron las capas 1–4, o el gate existe pero no es `PASS`)
   → estado `EXTENSION_PRD_CREATED`
   → leer `extension-prd-validation-gate/SKILL.md`.

6. `.bawe/extension-context.md` existe
   (y no se cumplieron las capas 1–5)
   → estado `EXTENSION_CONTEXT_READY`
   → leer `extension-prd-generator/SKILL.md`.

7. `.bawe/extension-log-preguntas.md` existe
   (y no se cumplieron las capas 1–6)
   → leer solo el bloque `Estado de entrevista` de ese archivo:
   - si `Siguiente pregunta pendiente = EXTENSION_CONTEXT_GENERATOR`
     → estado `EXTENSION_CONTEXT_GENERATION_PENDING`
     → leer `extension-context-generator/SKILL.md`;
   - si no, es una pregunta de la entrevista (`E2`–`E7`)
     → estado `EXTENSION_INTAKE_IN_PROGRESS`
     → leer `extension-initialization-logic/SKILL.md`.

8. Ningún archivo `extension-*` existe
   → esto no debería pasar (`edit-intake` siempre crea
   `extension-log-preguntas.md` antes de derivar acá) — reportar blocker en
   `task-log.md` y detener.

Regla clave: si se encuentra un marcador superior, no leer las capas
inferiores para decidir routing — igual que el detector del producto
original.

## Reglas

- No interpretar producto; solo estado y puntero.
- No leer `prd.md`, `project-context.md`, `.bawe/app-structure.json` ni
  `.bawe/component-queue.json` para decidir la capa — esos archivos no
  forman parte de este árbol de estado.
- No crear ni eliminar archivos. Ese trabajo es de las skills a las que se
  deriva.
