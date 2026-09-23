# SECCIÓN B — Defaults BaWe

# bawe-initialization-logic | No es una entrevista — es una confirmación.

# Al cerrar: escribir Sección B completa + Métricas en [PROJECT_ROOT]/log-preguntas.md → leer `project-context-generator/SKILL.md`

---

## INSTRUCCIÓN DE EJECUCIÓN

Leer este archivo solo cuando `Siguiente pregunta pendiente` sea `B_EXTRA` o `Cierre Seccion B`.
Si la pregunta pendiente es `B1`, volver a `interview-questions-b.md`.
Si `project-context.md` ya existe y es valido, no leer este archivo.

Registrar internamente todos los defaults funcionales. Los defaults visuales prescriptivos sin razon autorizada se registran como MODEL_DECISION, no como valores impuestos.

No mostrar tablas técnicas.
No mostrar arquitectura interna.
No mostrar configuraciones de desarrollo.

Hacer UNA sola pregunta, registrada como `B_EXTRA` y origen `USER_EXPLICIT`:

> "¿Hay algo importante de tu forma de trabajar que no te haya preguntado? También podés aclarar alguna preferencia técnica si ya tenés una, como tecnologías, base de datos, integraciones o puertos. Si no, lo decidimos por defecto y después queda documentado en las instrucciones del proyecto."

Si responde:

* No
* Nada
* Todo bien
* Continuemos
* Seguí

→ registrar todos los defaults como confirmados y continuar.

Si agrega información:

→ aplicar protocolo de validación.

---

## DEFAULTS BAWE (SOLO MEMORIA INTERNA)

| Campo           | Valor                   |
| --------------- | ----------------------- |
| frontend_stack  | React + Vite + Tailwind |
| frontend_port   | 10040                   |
| deletion_policy | logical                 |
| backend         | Node.js + Express       |
| database        | MySQL                   |
| backend_port    | 3000                    |
| database_port   | 3306                    |
| proxy           | Traefik                 |
| auth            | JWT — 24h               |
| rate_limiting   | 100 req/min por IP      |
| migrations      | automáticas             |
| backup          | diario 2 AM UTC         |
| cache           | Redis (solo producción) |
| logging         | stdout + archivos       |
| monitoring      | health checks + alertas |
| testing         | Jest                    |
| i18n            | ES / EN / PT            |
| visual_theme     | MODEL_DECISION (no imponer light/dark universal) |
| vps             | pending_product_approval    |

### Variables y secretos requeridos

Registrar como contrato declarativo. No generar valores reales.

```yaml
db_password:
  required: true
  generation_policy: "strong random secret"
  generation_phase: "env-generator"
  storage_target: ".env"
  generated_now: false
jwt_secret:
  required: true
  generation_policy: "strong random secret"
  generation_phase: "env-generator"
  storage_target: ".env"
  generated_now: false
```

No crear `.env`.
No crear `.env.example`.

---

## PROTOCOLO DE VALIDACIÓN

Solo si el usuario menciona explícitamente un requerimiento técnico:

1. Validar coherencia con Sección A.

2. Si es compatible:

   * registrar override.

3. Si tiene riesgo:

   * hacer UNA sola advertencia.

4. Si el usuario insiste:

   * registrar override;
   * registrar nota de advertencia.

Nunca mostrar el análisis al usuario.
Nunca explicar arquitectura interna salvo que el usuario lo pregunte explícitamente.

---

## CIERRE

1. Registrar defaults confirmados.

2. Registrar overrides aceptados.

3. Escribir Sección B completa en:

[PROJECT_ROOT]/log-preguntas.md

Actualizar el `log-preguntas.md` existente. No leer `log-preguntas.template.md` salvo que el log falte, este corrupto o no tenga estructura suficiente para append.

4. Escribir bloque de métricas en:

[PROJECT_ROOT]/log-preguntas.md

5. Actualizar `[PROJECT_ROOT]/log-preguntas.md`:

- `Ultima pregunta completada`: `B_EXTRA`
- `Siguiente pregunta pendiente`: `PROJECT_CONTEXT_GENERATOR`

6. Leer e invocar:

[WORKSPACE_ROOT]/.agents/skills/project-context-generator/SKILL.md

No volver a `interview-questions.md` despues de cerrar Seccion B.
No generar archivos intermedios de contexto PRD; la materia prima cruda queda en `log-preguntas.md` y el siguiente paso genera `project-context.md` directamente.

