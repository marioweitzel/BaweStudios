# log-preguntas.md — Templates de Sección A y B + Métricas
# USAR: copiar al proyecto al cerrar cada sección de la entrevista.
# Generado por: bawe-initialization-logic

---

## ORIGENES VALIDOS

Cada respuesta o campo debe declarar exactamente un origen:

```text
USER_EXPLICIT
ENGINE_DEFAULT
ENGINE_INFERENCE
LLM_INTERPRETATION
```

`USER_EXPLICIT` es una respuesta directa del usuario. `ENGINE_DEFAULT` es un default fijo del motor. `ENGINE_INFERENCE` es una deduccion por regla. `LLM_INTERPRETATION` es una interpretacion semantica del LLM y no debe mezclarse con reglas deterministicas.

---

## TEMPLATE SECCIÓN A (escribir al cerrar PASO 2 — interview-questions-a-defaults.md)

```markdown
# 📋 Interview Log — [A1: project name]
> Motor versión: [MOTOR_VERSION]
> Sesión iniciada: [ISO8601]
> Generado por: bawe-initialization-logic

---

## Estado de entrevista

- Ultima pregunta completada: [ULTIMA_PREGUNTA_COMPLETADA]
- Siguiente pregunta pendiente: [SIGUIENTE_PREGUNTA_PENDIENTE]

---

## SECCIÓN A — Perfil Cliente

| ID | Pregunta/Campo | Valor | Origen | Notas |
|----|----------------|-------|--------|-------|
| A1 | Nombre del proyecto | [respuesta] | USER_EXPLICIT | define slug |
| A2 | Intencion del proyecto | [respuesta] | USER_EXPLICIT | ALWAYS_REQUIRED / DO_NOT_SKIP; fuente de project.description y visual_dna.product_context.primary_goal |
| A2b-[N] | Aclaracion dinamica de proceso | [respuesta o NO_APLICA] | USER_EXPLICIT | OPTIONAL / GAP_DRIVEN / REPEATABLE; registrar solo si existe clarification_request vinculada a gap |
| A3 | Tipo de web | [respuesta o inferencia] | [USER_EXPLICIT o ENGINE_INFERENCE] | RAMIFICACIÓN → asunciones en a-defaults |
| A4 | Audiencia | [respuesta] | USER_EXPLICIT | — |
| A4b | Proto-persona | [respuesta] | USER_EXPLICIT | — |
| A5 | Acciones principales | [respuesta] | USER_EXPLICIT | — |
| A6 | Comercio | [respuesta o OMITIDA] | [USER_EXPLICIT o ENGINE_INFERENCE] | OMITIDA si tipo=SaaS/Landing/Blog |
| A7 | Carga de archivos | [respuesta] | USER_EXPLICIT | CONTEXTUAL; no se omite por tipo salvo regla futura explicita |
| A8 | Redes sociales | [respuesta o OMITIDA] | [USER_EXPLICIT o ENGINE_INFERENCE] | OMITIDA si tipo=SaaS |
| A9 | Promociones | [respuesta o OMITIDA] | [USER_EXPLICIT o ENGINE_INFERENCE] | OMITIDA si tipo=SaaS/Landing/Blog/Portal |
| A_BRAND | Identidad visual | [respuesta] | USER_EXPLICIT | — |
| A10 | Paleta colores | [respuesta o OMITIDA] | [USER_EXPLICIT o ENGINE_INFERENCE] | OMITIDA si A_BRAND tiene colores definidos |
| A11 | Estilo visual | [respuesta] | USER_EXPLICIT | contexto visual; la solucion final puede ser MODEL_DECISION |
| A_REF | URL referencia | [respuesta o ninguna] | USER_EXPLICIT | opcional |
| A_PRIORITIES | 3 Funciones prioritarias | [respuesta] | USER_EXPLICIT | OBLIGATORIA — no omitir |


### Clasificacion estructurada de informacion
| Campo | Valor | Clasificacion | Source facts | Confidence | Justificacion |
|---|---|---|---|---:|---|
| [campo] | [valor] | KNOWN/INFERRED/MODEL_DECISION/SAFE_UNKNOWN/CLIENT_REQUIRED/CONTRADICTORY | [ids] | [0.0-1.0] | [texto breve] |

### Inferencias trazables
| Campo | Valor inferido | Based on | Confidence | Justificacion |
|---|---|---|---:|---|
| [campo] | [valor] | [A2, A2b-[N], A5...] | [0.0-1.0] | [texto breve] |

### Gaps detectados
| ID | Field | Process name | Classification | Impact | Source | Status | Action |
|---|---|---|---|---|---|---|---|
| gap-[N] | [campo] | [proceso o null] | CLIENT_REQUIRED/CONTRADICTORY/SAFE_UNKNOWN/INFERRED/MODEL_DECISION | [alcance/regla/permisos/calculo/datos/flujo] | [A2/A3/A5/etc.] | PENDING/ASKED/RESOLVED/DEFERRED | INFER/MODEL_DECIDES/DEFER_SAFE/ASK_CLIENT/RESOLVE_CONTRADICTION |

### Clarification requests
| ID | Gap ID | Process name | Question | Reason | Impact | Answer | Resolved status |
|---|---|---|---|---|---|---|---|
| clarification-[N] | gap-[N] | [proceso concreto] | [pregunta dinamica con proceso concreto] | [motivo] | [impacto] | [respuesta del cliente o pendiente] | PENDING/RESOLVED/UNRESOLVED |

Reglas:
- `clarification_requests` es lista; no sobrescribir entradas previas.
- Hacer una sola aclaracion por iteracion.
- Tras cada respuesta, revaluar todos los gaps y actualizar `Status` y `Resolved status`.
### Defaults por tipo confirmados (de a-defaults)
| ID | Pregunta/Campo | Valor | Origen | Notas |
|---|---|---|---|---|
| [campo] | [default/asuncion] | [valor] | [ENGINE_DEFAULT o ENGINE_INFERENCE] | [ninguno o descripción del cambio] |
```

---

## TEMPLATE SECCIÓN B + MÉTRICAS (append al cerrar PASO 4 — interview-questions-b-defaults.md)

```markdown
---

> Al cerrar Seccion B, actualizar el bloque superior `Estado de entrevista`:
> - Ultima pregunta completada: B_EXTRA
> - Siguiente pregunta pendiente: PROJECT_CONTEXT_GENERATOR

## SECCIÓN B — Perfil Técnico / Desarrollador

### Preguntas reales al usuario
| ID | Pregunta | Respuesta | Origen | Notas |
|----|----------|-----------|--------|-------|
| B1 | Integraciones externas | [respuesta] | USER_EXPLICIT | proveedor, tipo y variables requeridas sin valores secretos |
| B_EXTRA | Forma de trabajo, detalle adicional o preferencia técnica | [respuesta] | USER_EXPLICIT | no contar defaults como respuesta |

### Campos automáticos (sin preguntar)
| Campo | Valor | Origen | Fuente |
|---|---|---|---|
| navigation | [hybrid/spa] | ENGINE_INFERENCE | deducido de A3+A4 |
| visual_theme | MODEL_DECISION | MODEL_DECISION | no imponer light/dark universal |
| jwt_expires | [24h/null] | ENGINE_INFERENCE | deducido de A3 |
| rate_limiting | true | ENGINE_DEFAULT | default BaWe |
| environment | local_docker | ENGINE_DEFAULT | default BaWe |
| vps_deployment | pending_product_approval | ENGINE_DEFAULT | default BaWe |
| db_name | [slug de A1] | ENGINE_INFERENCE | derivado de A1 |
| db_user | root | ENGINE_DEFAULT | default BaWe |
| db_password | required=true; generation_phase=env-generator; generated_now=false | ENGINE_DEFAULT | no generar en inicialización |
| proxy | traefik | ENGINE_DEFAULT | default BaWe |
| container_prefix | [slug]_app/_db/_proxy | ENGINE_INFERENCE | derivado de A1 |
| scalability | [extensible/closed] | ENGINE_INFERENCE | derivado de A5 |

### Defaults BaWe confirmados (interview-questions-b-defaults.md)
| Campo | Valor | Override |
|---|---|---|
| backend | node+express | [ninguno o cambio] |
| db_engine | mysql | [ninguno o cambio] |
| backup | daily_2am_utc | [ninguno o cambio] |
| cache | redis (production only) | [ninguno o cambio] |
| logging | both | [ninguno o cambio] |
| monitoring | true | [ninguno o cambio] |
| testing | jest | [ninguno o cambio] |
| migrations | true | [ninguno o cambio] |
| i18n | es/en/pt | [ninguno o cambio] |

### Variables requeridas para fases posteriores
| Variable | Required | Generation policy | Generation phase | Storage target | Generated now |
|---|---:|---|---|---|---:|
| DB_PASSWORD | true | strong random secret | env-generator | .env | false |
| JWT_SECRET | true | strong random secret | env-generator | .env | false |

---

## 📊 MÉTRICAS DE ENTREVISTA

```yaml
motor_version: "[MOTOR_VERSION]"
project:
  name: "[A1]"
  type: "[A3]"
session_start: "[ISO8601]"
session_end: "[ISO8601]"

seccion_a:
  user_explicit_count: [N]
  engine_default_count: [N]
  engine_inference_count: [N]
  llm_interpretation_count: [N]
  omitted_by_rule_count: [N]
  total_fields: [N]

seccion_b:
  user_explicit_count: 2
  user_explicit_ids:
    - B1
    - B_EXTRA
  engine_default_count: [N]
  engine_inference_count: [N]
  llm_interpretation_count: [N]
  total_fields: [N]

totales:
  user_explicit_count: [N]
  engine_default_count: [N]
  engine_inference_count: [N]
  llm_interpretation_count: [N]
  total_fields: [N]
  motor_assisted_fields: [N]
  user_answered_fields: [N]

outputs_generados:
  log-preguntas.md: true
  project-context.md: false
  task-log.md: [true|false]
```
```
