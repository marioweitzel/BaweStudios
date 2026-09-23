# BAWE INTERVIEW — Router de Ejecución
# bawe-initialization-logic | Motor v4.7
# LEER ESTE ARCHIVO PRIMERO solo cuando no haya una ruta de reanudacion emitida por project-context-detector.
# Seguir el orden exacto en bootstrap nuevo. En reanudacion, seguir "REANUDACION CORTA".

---

## ORDEN DE EJECUCIÓN

| Paso | Archivo a leer | Qué hace el agente | Output |
|------|----------------|--------------------|--------|
| 1 | `interview-questions-a.md` | 6 preguntas core del cliente | retener en memoria |
| 2 | `interview-questions-a-defaults.md` | Asunciones por tipo — confirmar o ajustar | Sección A cerrada en `log-preguntas.md` |
| 3 | `interview-questions-b.md` | B1 integraciones + inferencias tecnicas declarativas | retener en memoria |
| 4 | `interview-questions-b-defaults.md` | B_EXTRA + defaults BaWe — confirmar o ajustar | Sección B completa + Métricas en `log-preguntas.md` |
| 5 | — | invocar `project-context-generator` | `project-context.md` |

---

## REANUDACION CORTA

Cuando `project-context-detector` emite `INTAKE_IN_PROGRESS`:

1. No reiniciar el router completo.
2. Leer solo el bloque `Estado de entrevista` de `[PROJECT_ROOT]/log-preguntas.md`.
3. Usar `Siguiente pregunta pendiente` como autoridad.
4. Leer unicamente el asset exacto que contiene esa pregunta.
5. Formular una sola pregunta o ejecutar el cierre indicado por ese asset.
6. Despues de recibir respuesta, actualizar `log-preguntas.md` segun las reglas del asset actual.
7. No leer defaults, templates ni assets posteriores hasta que `Siguiente pregunta pendiente` lo indique.

Cuando `project-context-detector` emite `CONTEXT_GENERATION_PENDING`, la entrevista ya esta completa. No leer assets de entrevista; leer `[WORKSPACE_ROOT]/.agents/skills/project-context-generator/SKILL.md`.

Mapa de pregunta pendiente a asset:

| Siguiente pregunta pendiente | Asset a leer |
|---|---|
| `A1` a `A_PRIORITIES` | `interview-questions-a.md` |
| `A_DEFAULTS` o `Cierre Seccion A` | `interview-questions-a-defaults.md` |
| `B1` | `interview-questions-b.md` |
| `B_EXTRA` o `Cierre Seccion B` | `interview-questions-b-defaults.md` |
| `PROJECT_CONTEXT_GENERATOR` | `[WORKSPACE_ROOT]/.agents/skills/project-context-generator/SKILL.md` |

Ejemplo: si `Siguiente pregunta pendiente = A7`, leer solo `interview-questions-a.md`, hacer A7 y esperar respuesta.

Ejemplo: si `Siguiente pregunta pendiente = PROJECT_CONTEXT_GENERATOR`, no emitir `INTAKE_IN_PROGRESS`; emitir `CONTEXT_GENERATION_PENDING` y pasar a `project-context-generator/SKILL.md`.

---

## CONTEXTO DE DIRECTORIOS

[WORKSPACE_ROOT] contiene el motor BaWe y los workspaces de usuario.

Ejemplo:

bawestudios/
+-- .agents/
+-- [workspace_user_id_1]/
¦   +-- [project_name_1]/
¦   +-- [project_name_2]/
¦   +-- [project_name_N]/
+-- [workspace_user_id_2]/
¦   +-- [project_name_1]/
¦   +-- [project_name_N]/
+-- [workspace_user_id_N]/
    +-- [project_name_N]/

Las carpetas `.agents`, `.bawe` y `.github` pertenecen al motor y son SOLO LECTURA.

Las SKILLS y assets de entrevista viven dentro del motor:

[WORKSPACE_ROOT]/.agents/

Los archivos generados para un proyecto nunca deben escribirse dentro del motor.

Cuando A1 capture el nombre del proyecto:

[USER_WORKSPACE_ROOT] = [WORKSPACE_ROOT]/[workspace_user_id]/
[PROJECT_ROOT] = [USER_WORKSPACE_ROOT]/[project_name]/

Todos los outputs de este router deben generarse dentro de [PROJECT_ROOT].
No escribir ningun archivo antes de A1 y de crear/verificar [PROJECT_ROOT].

---

## REGLAS DE SECUENCIA

- **Leer completo antes de actuar**: cada archivo se lee COMPLETO antes de hacer la primera pregunta de esa sección.
- **Log al cerrar**: escribir el log AL TERMINAR cada paso, antes de leer el siguiente archivo. La unica excepcion es el bootstrap inicial: antes de A1 no existe [PROJECT_ROOT], por lo tanto no se escribe nada.
- **Retorno**: en bootstrap lineal, al terminar cada paso volver aquí y avanzar al siguiente. En `REANUDACION CORTA`, no volver aquí salvo que el asset actual lo pida.
- **Sin salteos**: si falta project-context.md y existe `log-preguntas.md`, aplicar `REANUDACION CORTA` solo si el puntero es una pregunta de entrevista. Si el puntero es `PROJECT_CONTEXT_GENERATOR`, pasar a `project-context-generator/SKILL.md`. Si no existe `log-preguntas.md`, ir al Paso 1.
- **Salida**: Paso 5 entrega control a `project-context-generator`. `bawe-initialization-logic` no genera `project-context.md` ni `prd.md`.
