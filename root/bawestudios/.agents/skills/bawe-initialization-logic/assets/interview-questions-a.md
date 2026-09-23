# SECCIÓN A — Perfil Cliente

# bawe-initialization-logic

# Al cerrar preguntas de Seccion A: actualizar log-preguntas.md con `Siguiente pregunta pendiente = A_DEFAULTS` y leer `interview-questions-a-defaults.md`.

---

## REGLAS DE EJECUCIÓN

1. **UNA sola pregunta por turno.** Esperar respuesta antes de continuar.
2. **Motor de Ramificación**: la respuesta a A3 activa omisiones automáticas (ver tabla al final).
3. **Regla A_BRAND**: si responde "Sí tengo logo + colores" → OMITIR A10.
4. **Regla de Oro**: si el tipo ya implica una característica → NO preguntar. Registrar en `assumed_features`.
5. **Reanudacion corta**: si `log-preguntas.md` indica una pregunta pendiente de Seccion A, formular solo esa pregunta y no leer `interview-questions-a-defaults.md` ni templates hasta que corresponda el cierre.

## PERSISTENCIA DESPUES DE CADA RESPUESTA

Despues de recibir una respuesta de Seccion A:

1. Actualizar `[PROJECT_ROOT]/log-preguntas.md`.
2. Registrar la respuesta recibida con origen `USER_EXPLICIT` salvo omision/inferencia indicada por regla.
3. Actualizar `Ultima pregunta completada`.
4. Calcular y registrar `Siguiente pregunta pendiente`.
5. Aplicar omisiones por tipo antes de elegir la siguiente pregunta.

No leer `log-preguntas.template.md` para persistir una respuesta individual. El template se usa solo al crear el log inicial o al cerrar secciones segun el asset de cierre.

---

## PREGUNTAS

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

## REGLA GENERAL PARA OPCIONES DINAMICAS

Cuando una pregunta pida elegir opciones:

- Generar opciones concretas para el proyecto actual usando A2, A2b, A3, A4, A4b y respuestas previas.
- Mantener la intencion de la pregunta, pero adaptar los ejemplos al rubro, proceso y usuarios reales.
- Usar lenguaje simple, no tecnico, salvo que el cliente ya haya usado terminos tecnicos.
- Formular opciones como acciones, datos, archivos, canales o decisiones reales; evitar categorias genericas.
- Mostrar entre 3 y 6 opciones utiles, salvo que la pregunta indique otro limite.
- Incluir siempre una salida abierta: `Otra` o `No aplica`, segun corresponda.
- No mostrar tablas, labels internos ni razonamiento.
- Si no hay contexto suficiente para personalizar, usar opciones generales en lenguaje humano y permitir respuesta libre.

Ejemplos de adaptacion:

- Si el proyecto habla de comida para llevar, las opciones deben hablar de pedidos, menu, retiro, entrega, pagos o estado del pedido.
- Si habla de taller, las opciones deben hablar de vehiculos, turnos, repuestos, autorizaciones, fotos o estado del trabajo.
- Si habla de gestion interna, las opciones deben hablar de tareas, responsables, estados, permisos, historial o avisos.

---

## SECUENCIA DE REANUDACION SECCION A

Usar esta secuencia para actualizar `Siguiente pregunta pendiente` despues de cada respuesta:

`A1 -> A2 -> A3 -> A4 -> A4b -> A5 -> A6 -> A7 -> A8 -> A9 -> A_BRAND -> A10 -> A11 -> A_REF -> A_PRIORITIES -> A_DEFAULTS`

Antes de guardar la siguiente pendiente, aplicar las omisiones del `MOTOR DE RAMIFICACION`:

- Si tipo = `SaaS / Dashboard`, omitir `A6`, `A8` y `A9`.
- Si tipo = `Landing`, omitir `A6` y `A9`.
- Si tipo = `Blog`, omitir `A6` y `A9`.
- Si `A_BRAND = Si logo + colores`, omitir `A10`.

Si una pregunta se omite, registrar la fila como `OMITIDA` con origen `ENGINE_INFERENCE` y avanzar a la siguiente no omitida.

---

### A1. Nombre del proyecto
> "¿Cuál es el nombre de tu proyecto?" #(<-- Solo preguntar eso, no enviar lo que sigue en este punto.)
> *(Define el slug: prefijo de contenedores Docker y nombre de base de datos.)*

#### REGLA A1_PROJECT_ROOT

La respuesta de A1 define `[project_name]`.

Después de recibir A1 y antes de continuar con A2:

1. Crear o verificar el directorio del proyecto dentro del workspace de usuario recibido al iniciar:

```text
[USER_WORKSPACE_ROOT] = [WORKSPACE_ROOT]/[workspace_user_id]/
[PROJECT_ROOT] = [USER_WORKSPACE_ROOT]/[project_name]/
```

2. Desde este momento, toda ruta del proyecto se resuelve desde `[PROJECT_ROOT]`.

3. Crear `[PROJECT_ROOT]/log-preguntas.md` usando:

`[WORKSPACE_ROOT]/.agents/skills/bawe-initialization-logic/assets/log-preguntas.template.md`

4. Después de cada respuesta, guardar inmediatamente:

- la respuesta recibida;
- su origen;
- la última pregunta completada;
- la siguiente pregunta pendiente.

5. No crear archivos del proyecto directamente en `[WORKSPACE_ROOT]`.

### A2. Intencion del proyecto — ALWAYS_REQUIRED / USER_EXPLICIT / DO_NOT_SKIP
> "Que queres lograr con esta aplicacion o sitio web? Contalo con tus palabras, como se lo explicarias a una persona."

A2 siempre se pregunta. No puede omitirse, sustituirse ni completarse por inferencia del LLM.
Persistir la respuesta completa como `USER_EXPLICIT`; alimenta `producto.proposito`,
`project.description` y `visual_dna.product_context.primary_goal`.

### A2b. Aclaracion dinamica de proceso — OPTIONAL / GAP_DRIVEN / REPEATABLE

A2b NO es una pregunta fija de la secuencia. Solo se genera cuando exista un gap real que:

- tenga `classification = CLIENT_REQUIRED`, `classification = CONTRADICTORY`, o `classification = SAFE_UNKNOWN` con impacto operativo relevante;
- afecte un proceso real;
- requiera entender como funciona hoy ese proceso;
- no pueda inferirse con seguridad;
- pueda cambiar reglas, permisos, calculos, datos o flujo critico.

Plantilla obligatoria:

> "Como haces hoy [PROCESO_DETECTADO] en un dia normal, desde que empieza hasta que termina, y que parte te gustaria que la web te ayude a ordenar o dejar de hacer a mano?"

`[PROCESO_DETECTADO]` lo completa el LLM desde `gap.process_name`, `gap.field` y `gap.impact`.
No usar texto generico como "ese proceso" cuando exista un proceso identificable.

No disparar A2b para preferencias visuales, layout, sidebar, theme, iconografia o decisiones profesionales del modelo.

Adaptar el `[PROCESO DETECTADO]` de manera que se sienta natural en la pregunta. 
Ejemplos: 
   Cómo haces hoy `para` [registrar vehiculos] en un dia normal...
   Como haces hoy `para calcular las` [comisiones] en un dia normal...
   Como hacer hoy `con el` [conteo de stock] en un dia normal...
   
#### CICLO A2b

1. Detectar gaps despues de A2 y antes de inferir A3.
2. Priorizar un solo gap: `CLIENT_REQUIRED` critico, `CONTRADICTORY` critico, `CLIENT_REQUIRED` alto, `SAFE_UNKNOWN` operativo relevante.
3. Generar una sola aclaracion dinamica por iteracion.
4. Registrar `clarification_request` con `gap_id`, `process_name`, `question`, `answer` y `resolved_status`.
5. Revaluar el contexto completo despues de cada respuesta.
6. Actualizar `gap.status` y `clarification_request.resolved_status`.
7. Repetir solo si persiste otro gap real; nunca sobrescribir aclaraciones previas.

### A3. Tipo de web ← PUNTO DE RAMIFICACIÓN ← INFERIR SI HAY EVIDENCIA

No preguntar directamente el tipo técnico, puede que el usuario no lo entienda.

Despues de A2 y del ciclo A2b solo si aplica, intentar inferir el tipo de proyecto.

Solo registrar un tipo si hay evidencia clara:

- Venta/pagos/carrito/catálogo cobrable → E-Commerce
- Turnos, usuarios con panel, roles, gestión interna → SaaS / Dashboard
- Presentación de negocio, contacto, ubicación, servicios → Landing / Corporativo
- Artículos/noticias/publicaciones → Blog / Portal
- Uso interno de empresa/equipos/áreas → Portal Empresarial
- Mezcla de presencia pública, roles, directorio, marketplace, contacto,
  pedidos o gestión que no encaja claramente en un tipo fijo → Otro / Híbrido

Si aparecen perfiles, publicaciones o contacto entre dos lados de intercambio,
no clasificar como SaaS / Dashboard solo por existir usuarios o paneles. Usar
`Otro / Híbrido` salvo que el flujo principal sea gestión interna privada.

Si la evidencia es clara:
- registrar el tipo internamente
- NO explicar el razonamiento al usuario
- continuar con A4

Si la evidencia NO es clara, preguntar en lenguaje simple:

> "Por lo que queres hacer, ¿la web seria mas para vender, mostrar informacion, gestionar turnos o datos, publicar contenido, uso interno, o combina varias de estas sin encajar del todo en una sola? Contamelo con tus palabras si es asi."

*La tabla siguiente es SOLO REFERENCIA INTERNA.
No mostrar esta tabla al usuario.*

| Opción | En palabras simples | Implica automáticamente |
|--------|---------------------|------------------------|
| 🛒 E-Commerce | Vendés productos, el cliente paga en la web | admin_panel, cart, auth, multi_page |
| 📊 SaaS / Dashboard | Cada usuario tiene su panel según su rol | jwt, roles, navegacion privada por rol |
| 🏢 Landing / Corporativo | Presentás tu empresa, sin login | presencia publica, CTA, contacto |
| 📰 Blog / Portal | Publicás artículos o noticias | editorial_panel, categories — omite A6/A9 |
| 🏢 Portal Empresarial | Solo acceden personas de tu organización | multi_roles, modules_by_area |
| Otro / Híbrido | Combina varios modelos sin encajar claramente en uno solo | no omite A6/A7/A8/A9 por defecto |

#### VALIDACIÓN CRUZADA A2 → A3
Antes de registrar A3, comparar con lo descrito en A2. Señales de contradicción:
- Múltiples roles descriptos → correcto: **SaaS** o **Portal Empresarial**
- Venta/pagos descriptos → correcto: **E-Commerce**
- Solo presencia online → correcto: **Landing**
- Contenido editorial → correcto: **Blog**
- Marketplace, directorio bilateral, presencia publica con areas privadas,
  contacto externo o mezcla de modelos → correcto: **Otro / Híbrido**

Si contradice, NO explicar el razonamiento. Preguntar solo:

> "Para asegurarme: ¿la web es mas para vender, mostrar informacion, gestionar turnos o datos, publicar contenido, uso interno, o combina varias de estas sin encajar del todo en una sola? Contamelo con tus palabras si es asi."

Si el cliente insiste en el tipo original → registrarlo tal cual. Sus respuestas son sus resultados.

### A4. Audiencia
> "¿Quiénes van a usar el sitio?"

### A4b. Proto-persona / estructura de usuarios ← inmediata tras A4

`depends_on`: A2, A3, A4

Objetivo: sintetizar la estructura principal de usuarios del producto antes de
pasar a acciones.

Antes de preguntar, clasificar internamente A4:

1. `DOS_LADOS_TRANSACCIONALES`: A4 menciona actores en lados opuestos de un
   intercambio, como oferta/demanda, proveedor/cliente, creador/consumidor o
   prestador/solicitante.
2. `ROLES_INTERNOS_MULTIPLES`: A4 menciona dos o mas roles que operan dentro de
   la misma organizacion, administracion o flujo interno.
3. `ACTOR_UNICO_DOMINANTE`: A4 menciona un solo tipo de usuario o A2/A3/A4
   muestran una accion central con un beneficiario prioritario claro.
4. `CLARIFICATION_REQUIRED`: A4 no permite resolver ninguna clasificacion
   anterior sin inventar, o contradice A2/A3 de forma que cambia el producto.

Regla de desempate:

`DOS_LADOS_TRANSACCIONALES > ROLES_INTERNOS_MULTIPLES > ACTOR_UNICO_DOMINANTE`

Si A4 ya resuelve el objetivo:

- no preguntar A4b al usuario;
- registrar A4b con origen `ENGINE_INFERENCE` si deriva de una regla clara, o
  `LLM_INTERPRETATION` si es sintesis semantica trazable;
- incluir en Notas `branch=[CLASIFICACION]; based_on=A2,A3,A4`;
- avanzar a A5.

Si A4 es `CLARIFICATION_REQUIRED`, hacer una sola pregunta breve y especifica.
La pregunta visible debe pedir solo la decision faltante y no mostrar
clasificacion, razonamiento, branch, inferencias ni texto de registro.

> "¿Cuál de esos usuarios necesita estar mejor resuelto primero?"

### A5. Acciones principales — MULTI-SELECT

Preguntar:

> ¿Qué cosas querés que los usuarios puedan hacer en el producto? Elegí opciones de la lista o describí otras.

Generar entre 4 y 6 opciones concretas basadas en lo que el cliente ya explicó.
Aplicar la `REGLA GENERAL PARA OPCIONES DINAMICAS`.

Reglas:

- Las opciones deben describir tareas reales del producto, no categorías genéricas.
- No usar opciones universales como `Gestionar datos` o `Consultar información` cuando puedan expresarse de forma concreta.
- Incluir siempre `Otra`.
- No asumir que las opciones generadas agotan las necesidades del cliente.

Formato de entrega:

`[opción concreta] | [opción concreta] | [opción concreta] | ... | Otra`

### A6. Comercio *(OMITIR si tipo = Landing / Blog / SaaS)*

Preguntar:

> "Cuando alguien quiere comprar, contratar, reservar o pedir algo, ¿eso pasa solo por contacto externo o también dentro del sitio? Elegi opciones de la lista o explicalo con tus palabras."

Generar entre 3 y 5 opciones concretas segun el proyecto.
Aplicar la `REGLA GENERAL PARA OPCIONES DINAMICAS`.

Reglas:

- Si el cliente ya menciono venta o cobro, incluir opciones alineadas con eso.
- Si el proyecto opera por pedido, reserva, presupuesto o seña, reflejarlo en las opciones.
- Incluir siempre `No por ahora` y `Otra`.

Formato de entrega:

`[forma de venta/cobro concreta] | [forma de venta/cobro concreta] | ... | No por ahora | Otra`

### A7. Archivos e imágenes — CONTEXTUAL

Preguntar:

> "¿Te serviría que las personas puedan subir alguna foto, documento o archivo? Elegí las opciones que tengan sentido para tu idea o marcá que no hace falta."

Generar entre 3 y 6 opciones concretas basadas en el producto, sus usuarios y las funciones ya mencionadas.
Aplicar la `REGLA GENERAL PARA OPCIONES DINAMICAS`.

Reglas:

- Las opciones deben combinar el tipo de archivo con el actor que lo carga.
- Usar los roles reales identificados en A4.
- No usar categorías genéricas como `El usuario`, `El administrador` o `Ambos`.
- No incluir opiniones, calificaciones, estados, mensajes ni datos escritos como
  si fueran archivos. Si aparecen en la respuesta del cliente, registrarlos como
  acciones o datos del producto, no como carga de archivos.
- Incluir siempre `No se necesitan archivos` y `Otra`.

Formato de entrega:

`[archivo y actor concreto] | [archivo y actor concreto] | ... | No se necesitan archivos | Otra`


### A8. Redes sociales *(OMITIR si tipo = SaaS)*

Preguntar:

> "¿Qué canales de contacto querés que aparezcan o se usen desde el sitio? Elegi opciones de la lista o decime otros."

Generar entre 3 y 5 opciones concretas segun el rubro y los canales ya mencionados.
Aplicar la `REGLA GENERAL PARA OPCIONES DINAMICAS`.

Reglas:

- Priorizar canales comerciales comunes al proyecto: WhatsApp, Instagram, Facebook, email, telefono, ubicacion o mapa.
- Si el cliente menciono un canal especifico, incluirlo.
- Incluir siempre `No por ahora` y `Otra`.

Formato de entrega:

`[canal concreto] | [canal concreto] | ... | No por ahora | Otra`

### A9. Promociones *(OMITIR si tipo = Landing / Blog / Portal / SaaS)*

Preguntar:

> "¿Querés manejar promociones, descuentos o beneficios dentro del producto? Elegi opciones de la lista o describi otra."

Generar entre 3 y 5 opciones concretas segun el tipo de venta o servicio.
Aplicar la `REGLA GENERAL PARA OPCIONES DINAMICAS`.

Reglas:

- Las opciones pueden incluir descuentos, combos, cupones, beneficios por cantidad, promociones por fecha o beneficios para clientes frecuentes.
- No inventar reglas comerciales obligatorias; solo ofrecer caminos posibles.
- Incluir siempre `No por ahora` y `Otra`.

Formato de entrega:

`[promocion concreta] | [promocion concreta] | ... | No por ahora | Otra`

### A_BRAND. Identidad visual
> "¿Ya tenés algún logo, color o estilo visual que quieras usar, o preferís definirlo desde cero? Clic en "+" para subir logo.png"

Si el cliente ya tiene logo y colores definidos, pedir los colores si no los
dio, registrar `brand.has_existing_identity: true` y omitir A10.
Si tiene solo parte de la identidad, registrar lo disponible.
Si la respuesta a A_BRAND ya define colores, paleta o estilo visual suficiente,
registrar esos datos con origen `USER_EXPLICIT` o `LLM_INTERPRETATION` trazable
y omitir A10.
Si la respuesta incluye colores pero falta logo, no repreguntar paleta;
continuar con A11 usando esos colores como restriccion.
Continuar con A10 solo cuando falten colores, paleta o una preferencia visual
minima para orientar el diseño.

### A10. Paleta *(OMITIR si A_BRAND = "Sí logo + colores")* — MULTI-SELECT

Preguntar:

> "¿Que estilo de colores te gustaria para la web? Elegi opciones de la lista o decime colores especificos si ya los tenes."

Generar entre 4 y 6 opciones de paleta acordes al rubro, audiencia y sensacion buscada hasta ahora.

Reglas:

- Mantener opciones entendibles: no usar nombres de tokens, frameworks ni jerga de diseño.
- Evitar imponer una paleta por tipo de negocio; las opciones son orientativas.
- Incluir siempre `Colores especificos` y `Sin preferencia`.
- Si el usuario elige 3 o mas, el agente propone una paleta propia basada en la tendencia dominante.
- Si el cliente responde algo como "ya te conteste eso", revisar A_BRAND,
  registrar la paleta inferida desde esa respuesta previa y continuar sin
  insistir ni volver a preguntar colores.

Formato de entrega:

`[paleta simple] | [paleta simple] | ... | Colores especificos | Sin preferencia`

### A11. Sensacion visual

#### PRE-FILTRO: si el cliente definio colores en A_BRAND, usar esos colores como restriccion de marca.

No asignar automaticamente estilos visuales. Registrar la respuesta como contexto; la solucion visual final queda como MODEL_DECISION salvo que el cliente la declare requisito.

Preguntar:

> "¿Que sensacion deberia transmitir la experiencia visual? Elegi opciones de la lista o describila con tus palabras."

Generar entre 4 y 6 opciones acordes al proyecto, audiencia y tipo de web.
Aplicar la `REGLA GENERAL PARA OPCIONES DINAMICAS`.

Reglas:

- Las opciones deben describir sensaciones humanas, no estilos tecnicos.
- Incluir siempre `Sin preferencia`.
- Si el cliente definio colores en A_BRAND, las opciones deben respetar esa restriccion.

Formato de entrega:

`[sensacion concreta] | [sensacion concreta] | ... | Sin preferencia`

### A_REF. URL de referencia *(opcional)*
> "¿Hay algún sitio web que te guste como referencia visual? (podés omitir)"

### A_PRIORITIES. Funciones prioritarias ← OBLIGATORIA (no omitir)
> "De todo lo que imaginás para el producto, ¿cuáles son las 3 funciones que te parecen más importantes para empezar a construir bien?"
> *(Estas 3 funciones ordenan la prioridad de construcción. No limitan el producto completo, que se deriva de toda la entrevista.)*

---

## MOTOR DE RAMIFICACIÓN

| Tipo | Preguntas OMITIDAS | Asunciones automáticas |
|---|---|---|
| E-Commerce | — | `admin_panel: true`, `cart: true`, `auth: true`, `multi_page: true` |
| SaaS/Dashboard | A6, A8, A9 | `jwt_required: true`, `roles: true`, `navigation_context: role_based_private`; solucion de navegacion = MODEL_DECISION |
| Landing | A6, A9 | `auth: false`, `public_presence: true` |
| Blog | A6, A9 | `editorial_panel: true`, `categories: true` |
| Portal Empresarial | — | `multi_roles: true`, `modules_by_area: true` |
| Otro / Híbrido | — | no aplicar paquete fijo; no omitir A6, A7, A8 ni A9 por defecto |

---

## CIERRE SECCIÓN A

1. Actualizar `[PROJECT_ROOT]/log-preguntas.md`:

- `Ultima pregunta completada`: `A_PRIORITIES`
- `Siguiente pregunta pendiente`: `A_DEFAULTS`

2. Leer directamente:

[WORKSPACE_ROOT]/.agents/skills/bawe-initialization-logic/assets/interview-questions-a-defaults.md
