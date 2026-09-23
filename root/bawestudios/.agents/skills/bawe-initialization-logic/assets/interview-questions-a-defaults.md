# SECCIÓN A — Defaults por Tipo de Proyecto
# bawe-initialization-logic | Ejecutar SOLO cuando `Siguiente pregunta pendiente` sea `A_DEFAULTS` o `Cierre Seccion A`.
# Al cerrar: retener asunciones en memoria → escribir Sección A en log-preguntas.md → leer `interview-questions-b.md`

---

## INSTRUCCIÓN DE EJECUCIÓN

Este archivo no se lee para formular A6, A7, A8, A9, A_BRAND, A10, A11, A_REF ni A_PRIORITIES.
Si `log-preguntas.md` indica cualquiera de esas preguntas como pendiente, volver a `interview-questions-a.md`.

No preguntar uno por uno.

Cuando Seccion A ya tiene todas sus preguntas respondidas u omitidas:

1. Registrar internamente la tabla correspondiente.
2. No mostrar la tabla al usuario.
3. No hacer una pregunta abierta adicional en este punto. La oportunidad de informacion no cubierta vive al cierre de Seccion B como B_EXTRA.
4. Si los defaults generan un gap critico, contradiccion o regla de negocio no inferible, aplicar la politica de repreguntas y formular solo la aclaracion minima.

Acciones permitidas para gaps:

```text
INFER
MODEL_DECIDES
DEFER_SAFE
ASK_CLIENT
RESOLVE_CONTRADICTION
```

Solo usar ASK_CLIENT cuando cambia alcance, regla de negocio, permisos, calculos, integridad de datos, arquitectura o flujo critico y no puede inferirse con confianza alta.

---

## REGLA DE SALIDA AL USUARIO

Cuando hagas una pregunta al usuario, mostrar SOLO la pregunta final.

No mostrar:
- análisis interno
- inferencias
- justificaciones
- valores técnicos
- texto de confirmación
- tablas markdown si el usuario no las pidió
- frases como "Perfecto, confirmo..." o "Lo tomo como..."

Toda inferencia debe quedar en memoria interna o en archivos del proyecto, no en el chat.

---

## TABLAS DE DEFAULTS POR TIPO

### 🛒 E-Commerce
| Campo | Valor asumido |
|---|---|
| auth | true (login/registro obligatorio) |
| cart | true |
| admin_panel | true |
| file_upload | admin (imágenes de productos) |
| social_media | links en footer |
| promotions | posible (preguntar A9 igualmente) |
| navigation | hybrid (catálogo público + checkout privado) |
| A6 (comercio) | implícito — OMITIR pregunta |

### 📊 SaaS / Dashboard
| Campo | Valor asumido |
|---|---|
| jwt_required | true |
| navigation_context | role_based_private (no implica sidebar; sidebar/header/tabs = MODEL_DECISION) |
| roles | múltiples (definidos en A4) |
| social_media | false — OMITIR A8 |
| promotions | false — OMITIR A9 |
| commerce | false — OMITIR A6 |
| navigation | hybrid (punto de entrada + dashboards por rol) |

### 🏢 Landing / Corporativo
| Campo | Valor asumido |
|---|---|
| auth | false |
| cart | false |
| social_media | links en footer |
| commerce | false — OMITIR A6 |
| promotions | false — OMITIR A9 |
| navigation | spa (scroll fluido, sin área privada) |
| file_upload | false — OMITIR A7 |

### 📰 Blog / Portal
| Campo | Valor asumido |
|---|---|
| editorial_panel | true (panel de admin/autor) |
| categories | true |
| auth | admin_only (lectores sin login) |
| social_media | links en footer |
| commerce | false — OMITIR A6 |
| promotions | false — OMITIR A9 |
| navigation | hybrid si hay panel de autor; spa si solo lectura |

### 🏢 Portal Empresarial / Intranet
| Campo | Valor asumido |
|---|---|
| auth | true (login estricto) |
| multi_roles | true |
| modules_by_area | true |
| social_media | false — OMITIR A8 |
| promotions | false — OMITIR A9 |
| navigation | spa (100% privado desde el inicio) |

### Otro / Híbrido

No hay tabla fija de valores asumidos. `commerce`, `social_media`,
`promotions` y `file_upload` NO requieren default aca: ya llegaron respondidos
por el cliente en A6/A7/A8/A9 por la regla de no omision de
`interview-questions-a.md`. Registrarlos con origen `USER_EXPLICIT`, no como
default de tipo.

Los unicos campos que si requieren default son los que ningun tipo pregunta
directamente en Seccion A. Siempre se infieren desde A2/A3/A4/A4b/A5:

| Campo | Regla de asignacion |
|---|---|
| auth | true solo si A4/A4b describe roles que necesitan identificarse con evidencia clara; si no hay evidencia -> ASK_CLIENT |
| admin_panel | true solo si algun rol gestiona contenido propio o de terceros con evidencia en A4/A5 |
| roles | listar los roles reales detectados en A4/A4b; no asumir multiples ni unico sin evidencia |
| navigation_context | derivar de los roles reales y de si conviven area publica y privada (hybrid), todo privado (spa) o todo publico; no aplicar la plantilla de navegacion de ningun tipo fijo |
| cart | usar la respuesta real de A6 si existe; si A6 no cubrio el mecanismo de pago, ASK_CLIENT puntual, no default |

Si algun campo de esta tabla no tiene evidencia suficiente en A2-A5, usar
`ASK_CLIENT`: no completar por plantilla de ningun tipo fijo.

---

## DEFAULTS DESCRIPTIVOS Y FIRMA BAWE

| Campo | Valor asumido | Clasificacion |
|---|---|---|
| bawe_signature | trazabilidad, coherencia, estados aplicables, accesibilidad, integracion, evidencia y correccion | AUTHORIZED_PRESCRIPTION por TEST_EVIDENCE/ACCESSIBILITY/API_CONTRACT |
| visual_style | lo decide el modelo desde marca, audiencia, uso y restricciones | MODEL_DECISION |
| typography | lo decide el modelo salvo restriccion de marca o accesibilidad | MODEL_DECISION |
| iconography | lo decide el modelo salvo restriccion de marca o componente existente | MODEL_DECISION |
| navigation_solution | lo decide el modelo desde navigation_context, roles, densidad y workflow | MODEL_DECISION |
| usage_pattern | derivar de A2, A2b, A3 y A5 | DESCRIPTIVE_CONTEXT |
| information_density | derivar de cantidad de datos, frecuencia de uso y actores | DESCRIPTIVE_CONTEXT |
| interaction_complexity | derivar de acciones, roles, reglas y excepciones | DESCRIPTIVE_CONTEXT |
| primary_device | inferir solo si hay evidencia; si no, responsive_priority=both | DESCRIPTIVE_CONTEXT |
| i18n | ES salvo evidencia explicita de otros idiomas | ENGINE_DEFAULT funcional |

Prueba obligatoria para cada default:

```text
Describe el problema o impone la respuesta?
```

Si impone una solucion visual sin razon autorizada, registrarlo como MODEL_DECISION y marcar la prescripcion como rechazada; no aplicarlo como default automatico.

---

## PROTOCOLO DE VALIDACIÓN DE CAMBIO

Si el cliente quiere cambiar un valor asumido:

1. **¿Es una implicación lógica del tipo?** (ej: E-Commerce sin carrito, SaaS sin roles)
   → Explicar en una frase: *"[Campo] es una consecuencia directa de ser [tipo]. Quitarlo cambiaría la naturaleza del proyecto."*
   → Preguntar: *"¿Querés cambiar el tipo de proyecto o mantener [tipo] sin [campo]?"*

2. **¿Es una preferencia opcional?** (ej: sin redes sociales en E-Commerce, sin panel editorial en Blog)
   → Aceptar sin advertencia. Registrar override.

3. **¿Contradice algo ya dicho en A2 o A4?**
   → Señalar la contradicción en una frase. Preguntar confirmación. Si confirma → registrar con nota.

### Excepcion — tipo `Otro / Híbrido`

`commerce`, `social_media`, `promotions` y `file_upload` no son defaults en
este tipo: son respuestas explicitas (`USER_EXPLICIT`) de A6/A7/A8/A9. Un
pedido de cambio ahi se trata como correccion de una respuesta normal; no
aplica el paso 1 de este protocolo.

Para los campos tecnicos que si son `ENGINE_INFERENCE` (`auth`,
`admin_panel`, `roles`, `navigation_context`):

1. Identificar la evidencia puntual que genero el campo, no "el tipo".
   → *"[Campo] se asumio por [evidencia de A_], no por pertenecer a una
   categoria fija. Podes cambiarlo sin que eso cambie el tipo de proyecto."*
2. Aplicar el override directamente. No preguntar "¿queres cambiar el tipo?":
   no tiene sentido cuando el tipo ya es "sin categoria fija".

---

## CIERRE

1. Registrar asunciones confirmadas + overrides en memoria.

2. Las preguntas marcadas como OMITIR → registrar en:

[PROJECT_ROOT]/log-preguntas.md

como:

`OMITIDA — asumida por tipo`

Actualizar el `log-preguntas.md` existente. No leer `log-preguntas.template.md` en este cierre salvo que el log falte o este corrupto.

3. Actualizar `[PROJECT_ROOT]/log-preguntas.md`:

- `Ultima pregunta completada`: `A_DEFAULTS`
- `Siguiente pregunta pendiente`: `B1`

No generar archivos de contexto en este punto.
La pregunta abierta `B_EXTRA` todavia puede aportar informacion rica; por eso `project-context.md` se genera recien al cerrar Seccion B.

4. Leer directamente:

[WORKSPACE_ROOT]/.agents/skills/bawe-initialization-logic/assets/interview-questions-b.md

No volver a `interview-questions.md` despues de cerrar Seccion A.

