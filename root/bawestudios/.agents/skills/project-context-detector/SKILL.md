---
name: project-context-detector
description: Detecta entrada comenzar/continuar/eliminar, resuelve workspace/proyecto y emite la proxima accion exacta.
allowed-tools: [read_file, grep_search, file_search, create_directory, delete_directory]
---

# PROJECT STAGE DETECTOR

## Responsabilidad unica

Resolver la entrada inicial `comenzar <workspace_user_id>`, `continuar <workspace_user_id> <project_name>` o `eliminar <workspace_user_id> <project_name>`.
Para `continuar`, detectar el marcador de etapa mas avanzado existente dentro de `[PROJECT_ROOT]` y cortar la busqueda en el primer marcador valido.

No interpreta producto. Solo reporta estado, puntero y regla de lectura minima.
La unica escritura permitida en este detector es crear `[USER_WORKSPACE_ROOT]` cuando recibe `comenzar <workspace_user_id>` y ese directorio no existe.
La unica eliminacion permitida en este detector es eliminar `[PROJECT_ROOT]` cuando recibe `eliminar <workspace_user_id> <project_name>`.

El dispatcher enruta `comenzar`, `continuar` y `eliminar` a este detector. Desde ahi, este archivo es el mapa de capas del motor.

---

## Principio de corte temprano

Buscar marcadores de mayor a menor madurez. En cuanto un marcador valido exista, detener la busqueda de capas inferiores.

`Buscar` incluye comprobar existencia con `Test-Path`, globbing, file search,
listado de directorios o cualquier inventario de marcadores. No consultar el
siguiente marcador hasta haber descartado el marcador actual como inexistente o
invalido.

Un marcador valido no es solo "archivo existe". Debe parsear y contener los
campos minimos de listo para esa etapa. Si un archivo existe pero esta vacio,
marcado `NOT_READY`, o le faltan campos minimos, tratarlo como placeholder
legacy y continuar con la siguiente capa inferior.

No leer `log-preguntas.md`, `project-context.md`, `prd.md` ni cola completa si un marcador superior valido ya decide el siguiente paso.

Orden de capas:

```text
1. Desarrollo operativo:        .bawe/component-queue.json
2. Directivas PRE_QUEUE:        .bawe/build-directives.json
3. PRD validado:                .bawe/prd-validation-gate.json
4. PRD creado no validado:      prd.md
5. Contexto canonico creado:    project-context.md
6. Entrevista o contexto pendiente: log-preguntas.md
7. Sin contexto:                `comenzar` -> bootstrap A1; `continuar` -> estado faltante
```

---

## Protocolo

### 0. Resolver entrada inicial

#### Entrada `comenzar <workspace_user_id>`

Resolver:

```text
[USER_WORKSPACE_ROOT] = [WORKSPACE_ROOT]/[workspace_user_id]/
```

Si `[USER_WORKSPACE_ROOT]` no existe, crear solo ese directorio.
Si `[USER_WORKSPACE_ROOT]` ya existe, no crear otro workspace y no tocar proyectos existentes.

Despues emitir `NO_CONTEXT` y leer `bawe-initialization-logic/SKILL.md`.
En este punto todavia no existe `[PROJECT_ROOT]`: A1 capturara `[project_name]` y `bawe-initialization-logic` creara el proyecto en:

```text
[PROJECT_ROOT] = [USER_WORKSPACE_ROOT]/[project_name]/
```

No buscar proyectos existentes para decidir routing durante `comenzar`.

#### Entrada `eliminar <workspace_user_id> <project_name>`

Resolver exactamente:

```text
[USER_WORKSPACE_ROOT] = [WORKSPACE_ROOT]/[workspace_user_id]/
[PROJECT_ROOT] = [USER_WORKSPACE_ROOT]/[project_name]/
```

Eliminar solo `[PROJECT_ROOT]`.
No eliminar `[USER_WORKSPACE_ROOT]`.
No buscar ni eliminar el mismo `[project_name]` en otros workspaces de usuario.
No eliminar archivos ubicados directamente en `[WORKSPACE_ROOT]`.
No eliminar archivos dentro de `[WORKSPACE_ROOT]/.agents/`, `[WORKSPACE_ROOT]/.bawe/` ni `[WORKSPACE_ROOT]/.github/`.
Despues de eliminar `[PROJECT_ROOT]`, responder exactamente:

```text
Eliminado.
```

No agregar explicaciones, rutas, resumen ni texto adicional.

Si no se pudo eliminar el proyecto exacto indicado, responder exactamente:

```text
Eliminacion fallida.
```

Dejar la causa solo en el rollout/contexto interno. Detener.

#### Entrada `continuar <workspace_user_id> <project_name>`

Resolver exactamente:

```text
[USER_WORKSPACE_ROOT] = [WORKSPACE_ROOT]/[workspace_user_id]/
[PROJECT_ROOT] = [USER_WORKSPACE_ROOT]/[project_name]/
```

El detector puede ejecutarse cuando aun no existe `[PROJECT_ROOT]`.

Verificacion de existencia de `[PROJECT_ROOT]`:

- Verificar con una consulta acotada a la ruta exacta ya resuelta (`[PROJECT_ROOT]` completo). No usar patrones amplios sobre `[USER_WORKSPACE_ROOT]` ni sobre `[WORKSPACE_ROOT]` para esta verificacion.
- Usar `[project_name]` exactamente como fue recibido en la entrada, sin alterar mayusculas/minusculas ni adivinar variantes del nombre.
- Si la primera herramienta de verificacion no devuelve resultados, repetir la verificacion de esa misma ruta exacta con una herramienta distinta (listado de directorio o comando de sistema) antes de concluir que no existe. No emitir `NO_ACTIVE_PROJECT` a partir de un unico intento con una sola herramienta.

- No hay proyecto activo identificable tras ese doble intento -> emitir `NO_ACTIVE_PROJECT` y terminar.
- Hay proyecto activo identificable -> continuar con la busqueda por capas.

`NO_ACTIVE_PROJECT` no es error. En `continuar`, detener y reportar que no existe el proyecto exacto indicado.

Nunca buscar ni crear archivos de proyecto directamente en `[WORKSPACE_ROOT]`.
Nunca buscar ni crear archivos de proyecto dentro de `.agents`, `.bawe` o `.github` del motor.
No buscar el proyecto directamente debajo de `[WORKSPACE_ROOT]`.
No buscar el mismo `[project_name]` en otros workspaces de usuario.

---

### 1. Capa desarrollo operativo

Marcador:

```text
[PROJECT_ROOT]/.bawe/component-queue.json
```

Si existe:

- leer solo el encabezado operativo necesario de `component-queue.json`;
- validar que no sea placeholder y que contenga:
  - `schema_version`
  - `project_id`
  - `objectives`
  - `active_objective_id`
  - `status`
  - `project_status`
  - `blockers`
  - `next_action`
- leer `next_node` y `next_skill` solo si existen; son punteros estructurados de
  reparacion o handoff de etapa, no campos obligatorios para colas previas;
- si falta alguno o `status = NOT_READY`, ignorar esta capa y continuar;
- si `project_status = BLOCKED` o `status = BLOCKED`:
  - si `next_node = architecture`, emitir `PRE_QUEUE_REPAIR_ROUTED` y leer
    `architecture/SKILL.md`;
  - si `next_node = software-product-architect`, emitir
    `PRE_QUEUE_REPAIR_ROUTED` y leer `software-product-architect/SKILL.md`;
  - compatibilidad con colas previas al puntero estructurado: si `next_action`
    menciona exactamente `architecture/SKILL.md`, emitir
    `PRE_QUEUE_REPAIR_ROUTED` y leer `architecture/SKILL.md`;
  - compatibilidad con colas previas al puntero estructurado: si `next_action`
    menciona exactamente `software-product-architect/SKILL.md`, emitir
    `PRE_QUEUE_REPAIR_ROUTED` y leer `software-product-architect/SKILL.md`;
  - si no hay puntero de reparacion ejecutable, emitir `DEVELOPMENT_BLOCKED`,
    reportar blockers y `next_action`, y detener;
- si `project_status = NEEDS_CORRECTION` o `status = NEEDS_CORRECTION`:
  - si `next_node = autonomous-product-development` y `active_objective_id`
    contiene un objetivo, emitir `DEVELOPMENT_IN_PROGRESS` y leer
    `autonomous-product-development/SKILL.md`;
  - si `next_node = architecture`, emitir `PRE_QUEUE_REPAIR_ROUTED` y leer
    `architecture/SKILL.md`;
  - si `next_node = software-product-architect`, emitir
    `PRE_QUEUE_REPAIR_ROUTED` y leer `software-product-architect/SKILL.md`;
  - si falta `next_node`, emitir `PROJECT_NEEDS_CORRECTION`, reportar
    `next_action` y detener;
- si `active_objective_id = null` y `project_status =
  AWAITING_CLIENT_FACING_REVIEW`:
  - si `next_node = client-facing-product-review`, emitir
    `CLIENT_FACING_REVIEW_ROUTED` y leer
    `client-facing-product-review/SKILL.md`;
  - si falta ese puntero, emitir `QUEUE_ADVANCEMENT_NEEDED`, reportar puntero
    incompleto y detener;
- si `active_objective_id` contiene un objetivo activo, emitir
  `DEVELOPMENT_IN_PROGRESS`;
- reportar `active_objective_id`, estado del objetivo, blockers si existen y
  `next_action`;
- siguiente skill: `autonomous-product-development/SKILL.md` cuando hay objetivo
  activo;
- si `active_objective_id = null` y `project_status = READY_FOR_CLIENT_REVIEW`,
  emitir `PROJECT_READY_FOR_CLIENT_REVIEW` y detener con el mensaje final
  exacto `Finalizado.`;
- si `active_objective_id = null` y `project_status =
  AWAITING_DELIVERY_PREPARATION`, emitir
  `PROJECT_AWAITING_DELIVERY_PREPARATION`;
  - si `next_node = delivery-package-preparation`, leer
    `delivery-package-preparation/SKILL.md`;
  - si falta ese puntero, detener con el mensaje final exacto
    `Parcial completado. Espero "continuar" para proseguir.`;
- si `active_objective_id = null` y `project_status = NEEDS_CORRECTION`, emitir
  `PROJECT_NEEDS_CORRECTION`, reportar `next_action` y detener;
- si `active_objective_id = null` y `project_status = IN_PROGRESS`, emitir
  `QUEUE_ADVANCEMENT_NEEDED`, reportar que la cola no tiene objetivo activo y
  detener;
- cortar busqueda.

No leer `prd.md`, `project-context.md` ni `log-preguntas.md` para decidir routing. Esos archivos son materia prima de ejecucion posterior, no estado para routing.

---

### 2. Capa directivas PRE_QUEUE

Marcador:

```text
[PROJECT_ROOT]/.bawe/build-directives.json
```

Si existe y no existe `[PROJECT_ROOT]/.bawe/component-queue.json` valido:

- leer solo los campos minimos de `build-directives.json`:
  - `schema_version`
  - `project_id`
  - `routing.selected_route`
  - `routing.next_node`
  - `conflicts`
- validar que no sea placeholder y que `routing.selected_route` exista;
- si falta `schema_version`, `project_id` o `routing.selected_route`, ignorar
  esta capa y continuar con PRD gate;
- no leer `prd.md`, `project-context.md`, `log-preguntas.md` ni gate PRD para decidir routing;
- si `conflicts` contiene elementos, emitir `BUILD_DIRECTIVES_BLOCKED` y detener;
- si `routing.next_node = software-product-architect`, emitir `PRE_QUEUE_ROUTED` y leer `software-product-architect/SKILL.md`;
- si `routing.next_node = architecture`, emitir `PRE_QUEUE_ROUTED` y leer `architecture/SKILL.md`;
- si `routing.next_node = component-queue-generator`, emitir `ARCHITECTURE_READY` y leer `component-queue-generator/SKILL.md`;
- si falta `routing.next_node`, usar default segun `routing.selected_route` y reportar que el puntero esta incompleto:
  - `software-product` -> `software-product-architect/SKILL.md`;
  - `app-web` -> `architecture/SKILL.md`;
  - `blocked` o ausente -> `BUILD_DIRECTIVES_BLOCKED`.
- cortar busqueda.

`build-directives.json` es estado PRE_QUEUE, no producto. El PRD y el contexto siguen siendo materia prima para las skills posteriores.

---

### 3. Capa PRD validado

Marcador:

```text
[PROJECT_ROOT]/.bawe/prd-validation-gate.json
```

Si existe, leer solo ese archivo.

Estados esperados:

| status | Estado emitido | Siguiente paso |
|---|---|---|
| `PASS` | `PRD_VALIDATED` | leer `adn-translator/SKILL.md` |
| `NEEDS_CORRECTION` | `PRD_NEEDS_REPAIR` | leer `prd-spec-generator/SKILL.md` en modo repair |
| `BLOCKED` | `PRD_BLOCKED` | detener y reportar bloqueo |

El archivo debe contener `next_node`. Si falta `next_node`, usar el default segun `status` y reportar que el puntero esta incompleto.

Si `status = PASS`, no leer `prd.md` para decidir routing. El PRD ya fue validado; `prd.md` sera materia prima de `adn-translator`.

Cortar busqueda.

---

### 4. Capa PRD creado, no validado

Marcador:

```text
[PROJECT_ROOT]/prd.md
```

Si existe y no existe `.bawe/prd-validation-gate.json` valido:

- emitir `PRD_CREATED`;
- siguiente skill: `prd-validation-gate/SKILL.md`;
- cortar busqueda.

No leer `log-preguntas.md` ni assets de entrevista. `prd.md` existe, pero todavia no esta aprobado.

---

### 5. Capa contexto canonico creado

Marcador:

```text
[PROJECT_ROOT]/project-context.md
```

Si existe y no existe `prd.md`:

1. Leer solo lo necesario para validar schema minimo.
2. Validar que existan y no sean placeholder:

```text
__metadata.schema_version
project.name
project.slug
project.pipeline
project.type
section_a.status
section_b.status
```

3. `section_a.status` y `section_b.status` deben indicar entrevista completa (`complete` o equivalente canonico documentado).

Si el schema es valido:

- emitir `CONTEXT_READY`;
- siguiente skill: `prd-spec-generator/SKILL.md`;
- cortar busqueda.

Si contiene claves flat legacy en raiz como `project_name`, `project_slug` o `project_type`, emitir `LEGACY_SCHEMA` y detener. No migrar automaticamente.

Si estructura minima falta o es placeholder, emitir `CONTEXT_INCOMPLETE` con causa concreta.

---

### 6. Capa entrevista o contexto pendiente

Marcador:

```text
[PROJECT_ROOT]/log-preguntas.md
```

Si existe y no existe `project-context.md`:

- leer solo el bloque `Estado de entrevista`;
- reportar `Ultima pregunta completada`;
- reportar `Siguiente pregunta pendiente`;
- si `Siguiente pregunta pendiente = PROJECT_CONTEXT_GENERATOR`, emitir `CONTEXT_GENERATION_PENDING` y reportar `project-context-generator/SKILL.md`;
- si `Siguiente pregunta pendiente` corresponde a una pregunta de entrevista, emitir `INTAKE_IN_PROGRESS` y reportar el asset exacto segun mapa;
- cortar busqueda.

Lectura obligatoria del bloque de estado:

```text
Leer solamente desde `## Estado de entrevista` hasta el siguiente separador `---` o hasta el siguiente heading `##`.
Extraer unicamente:
- `Ultima pregunta completada`
- `Siguiente pregunta pendiente`
```

No buscar patrones de IDs posibles dentro de todo `log-preguntas.md` para detectar estado. En particular, no usar busquedas amplias con `A1`, `A_PRIORITIES`, `B1`, `B_EXTRA` u otros IDs. Primero se extrae el puntero exacto; despues se consulta el mapa.

Mapa de reanudacion:

| Siguiente pregunta pendiente | Asset exacto a leer |
|---|---|
| `A1` a `A_PRIORITIES` | `bawe-initialization-logic/assets/interview-questions-a.md` |
| `ANx-y` | `bawe-initialization-logic/assets/interview-questions-a.md` |
| `A_DEFAULTS` o `Cierre Seccion A` | `bawe-initialization-logic/assets/interview-questions-a-defaults.md` |
| `B1` | `bawe-initialization-logic/assets/interview-questions-b.md` |
| `B_EXTRA` o `Cierre Seccion B` | `bawe-initialization-logic/assets/interview-questions-b-defaults.md` |
| `PROJECT_CONTEXT_GENERATOR` | `project-context-generator/SKILL.md` |

`ANx-y` representa una pregunta dinamica derivada de cualquier pregunta de
Seccion A. `AN` es la pregunta base de Seccion A y `x-y` es la resolucion
dinamica creada por un gap de informacion detectado.

Regla de lectura minima:

- Para detectar estado, leer solo el bloque `Estado de entrevista` de `log-preguntas.md`.
- Despues de extraer el puntero, leer solo el asset exacto indicado por `Siguiente pregunta pendiente`.
- No leer templates, defaults ni assets posteriores para formular una pregunta pendiente.
- Leer templates solo cuando el asset de cierre lo ordene explicitamente.

---

### 7. Sin contexto

Si no existe ningun marcador anterior durante `continuar <workspace_user_id> <project_name>`:

- emitir `PROJECT_STATE_MISSING`;
- reportar que `[PROJECT_ROOT]` existe pero no contiene puntero de estado;
- detener.

`NO_CONTEXT` solo se emite para `comenzar <workspace_user_id>` antes de A1.

---

## Estados de salida

| Estado | Significa | El agente hace |
|---|---|---|
| `DEVELOPMENT_IN_PROGRESS` | Existe cola operativa valida | Leer cola minima y seguir objetivo activo |
| `DEVELOPMENT_BLOCKED` | Cola o proyecto bloqueado | Detener y reportar blockers/next_action |
| `CLIENT_FACING_REVIEW_ROUTED` | Desarrollo completo espera revision independiente como cliente | Leer `client-facing-product-review/SKILL.md` |
| `PROJECT_AWAITING_DELIVERY_PREPARATION` | Revision cliente-facing aprobada y falta tramo posterior de paquete/puente | Leer `delivery-package-preparation/SKILL.md` si el puntero existe |
| `PROJECT_READY_FOR_CLIENT_REVIEW` | No hay objetivo activo y el proyecto completo esta listo para revision | Detener con `Finalizado.` |
| `PRE_QUEUE_REPAIR_ROUTED` | Cola detecta artefacto PRE_QUEUE corregible por el motor | Leer skill indicada por `next_node` |
| `PROJECT_NEEDS_CORRECTION` | No hay objetivo activo pero el proyecto requiere correccion sin puntero ejecutable | Detener y reportar next_action |
| `QUEUE_ADVANCEMENT_NEEDED` | La cola esta en progreso pero no declara objetivo activo | Detener y reportar puntero incompleto |
| `PRE_QUEUE_ROUTED` | Existe ruta PRE_QUEUE seleccionada y falta arquitectura | Leer `software-product-architect/SKILL.md` o `architecture/SKILL.md` segun ruta |
| `ARCHITECTURE_READY` | Existe arquitectura PRE_QUEUE y falta cola | Leer `component-queue-generator/SKILL.md` |
| `BUILD_DIRECTIVES_BLOCKED` | Directivas PRE_QUEUE tienen conflicto o ruta ausente | Detener y reportar conflicto/puntero incompleto |
| `PRD_VALIDATED` | PRD aprobado por gate | Leer `adn-translator/SKILL.md` |
| `PRD_NEEDS_REPAIR` | PRD generado pero gate pide correccion | Leer `prd-spec-generator/SKILL.md` en modo repair |
| `PRD_BLOCKED` | PRD no puede validarse con fuentes actuales | Detener y reportar bloqueo |
| `PRD_CREATED` | Existe `prd.md` sin gate PASS | Leer `prd-validation-gate/SKILL.md` |
| `CONTEXT_READY` | Existe `project-context.md` valido y falta PRD | Leer `prd-spec-generator/SKILL.md` |
| `CONTEXT_INCOMPLETE` | `project-context.md` existe pero no alcanza schema minimo | Reparar o regenerar contexto desde fuentes disponibles |
| `LEGACY_SCHEMA` | `project-context.md` usa schema obsoleto | No migrar automaticamente; reportar reparacion necesaria |
| `CONTEXT_GENERATION_PENDING` | Entrevista completa; falta `project-context.md` | Leer `project-context-generator/SKILL.md` |
| `INTAKE_IN_PROGRESS` | Falta una pregunta o cierre de entrevista | Leer asset exacto indicado por el log |
| `NO_CONTEXT` | Entrada `comenzar`; todavia no existe proyecto | Leer `bawe-initialization-logic/SKILL.md` |
| `NO_ACTIVE_PROJECT` | No existe el proyecto exacto indicado en `continuar` | Detener y reportar ruta faltante |
| `PROJECT_STATE_MISSING` | El proyecto indicado existe pero no contiene puntero de estado | Detener y reportar estado faltante |

---

## Materia prima vs estado

Este detector decide estado. No carga materia prima completa.

Las skills que ejecutan una etapa pueden leer la materia prima que necesitan:

- `prd-spec-generator`: `project-context.md` + `log-preguntas.md`.
- `adn-translator`: `prd.md` + `project-context.md`.
- Arquitectura PRE_QUEUE: `.bawe/build-directives.json` + materia prima segun contrato de la skill.
- desarrollo de features: cola operativa + materia prima base segun contrato de la skill.
- `delivery-package-preparation`: cola operativa + review client-facing PASS +
  archivos de producto necesarios para crear paquete limpio.

El detector no crea archivos de proyecto ni modifica estado. La unica excepcion
de creacion es crear `[USER_WORKSPACE_ROOT]` cuando recibe
`comenzar <workspace_user_id>` y ese directorio no existe. La unica excepcion de
eliminacion es eliminar `[PROJECT_ROOT]` cuando recibe
`eliminar <workspace_user_id> <project_name>`.
