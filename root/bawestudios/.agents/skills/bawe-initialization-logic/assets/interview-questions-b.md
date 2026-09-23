# SECCIÓN B — Preguntas que varían por proyecto

# bawe-initialization-logic | Leer completo antes de hacer la primera pregunta.

# Al cerrar: retener respuestas en memoria → leer [WORKSPACE_ROOT]/.agents/skills/bawe-initialization-logic/assets/interview-questions-b-defaults.md

---

## CONTEXTO PREVIO ANTES DE EMPEZAR

Estos campos son AUTOMÁTICOS — no preguntar, registrar directamente:

| Campo            | Valor                                                 | Fuente              |
| ---------------- | ----------------------------------------------------- | ------------------- |
| navigation       | deducir de A3+A4                                      | regla B0            |
| visual_theme     | MODEL_DECISION salvo requisito explicito de cliente/accesibilidad | default descriptivo |
| jwt_expires      | 24h si A3=SaaS; null si A3=Landing/Blog               | deducción por tipo  |
| rate_limiting    | true                                                  | default BaWe        |
| environment      | local_docker + vps_deployment: pending_product_approval   | INVARIANTE          |
| db_name          | slug de A1                                            | AUTOMÁTICO          |
| db_user          | root                                                  | INVARIANTE          |
| db_password      | requerido; generation_phase=env-generator; generated_now=false | ENGINE_DEFAULT      |
| proxy            | traefik                                               | INVARIANTE          |
| container_prefix | `[slug]_app`, `[slug]_db`, `[slug]_proxy`             | AUTOMÁTICO desde A1 |

---

## REGLA DE SALIDA AL USUARIO

Cuando hagas una pregunta al usuario, mostrar SOLO la pregunta final.

No mostrar:

* análisis interno
* inferencias
* justificaciones
* valores técnicos
* texto de confirmación
* tablas markdown si el usuario no las pidió
* frases como:

  * "Perfecto, confirmo..."
  * "Lo tomo como..."
  * "Registraré..."

Toda inferencia debe quedar en memoria interna o en archivos del proyecto.

---

## PERSISTENCIA DESPUES DE B1

Despues de recibir B1:

1. Actualizar `[PROJECT_ROOT]/log-preguntas.md`.
2. Registrar integraciones externas con origen `USER_EXPLICIT`.
3. Registrar variables requeridas e inferencias tecnicas con origen `ENGINE_INFERENCE`.
4. Actualizar:
   - `Ultima pregunta completada`: `B1`
   - `Siguiente pregunta pendiente`: `B_EXTRA`

No leer `log-preguntas.template.md` para persistir B1. El template se usa solo en el cierre de Seccion B.

---

## PREGUNTAS REALES AL USUARIO

Seccion B tiene dos entradas `USER_EXPLICIT`:

```text
B1
B_EXTRA
```

`B_EXTRA` se pregunta en `interview-questions-b-defaults.md` despues de registrar defaults.
No crear B2, B3 ni B4 como respuestas de usuario si no fueron formuladas.

### B1. Integraciones externas

Antes de formular B1, revisar `log-preguntas.md` y detectar menciones explicitas de servicios externos ya nombrados por el cliente, por ejemplo:

- WhatsApp, email, SMS o telefonia.
- MercadoPago, Stripe, PayPal, transferencia o pasarelas de pago.
- Google Maps, Google Calendar, Google Sheets, Drive u otros servicios Google.
- APIs, sistemas externos, proveedores, ERP, CRM o herramientas de terceros.

Si ya existe una integracion mencionada:

- No preguntarla como si fuera nueva.
- Formular B1 como confirmacion y ampliacion.
- Incluir las integraciones ya mencionadas como opciones preseleccionables en lenguaje natural.
- Preguntar si quiere agregar otra integracion externa.

Plantilla cuando ya hay integraciones mencionadas:

> "Ya mencionaste [INTEGRACIONES_DETECTADAS]. ¿Confirmamos eso como integracion externa del sistema y queres agregar alguna otra?"

Formato de entrega:

`Confirmar [integracion detectada] | Agregar email | Agregar pagos | Agregar Google Calendar/Maps | No agregar otra | Otra`

Si no hay integraciones mencionadas previamente:

> "¿Necesitas conectar el sistema con algun servicio externo? Elegi opciones de la lista o decime otro."

Generar entre 3 y 6 opciones concretas segun el proyecto y su tipo.

Formato de entrega:

`[integracion probable] | [integracion probable] | ... | No por ahora | Otra`

Por cada integración elegida:

* Gratuita con clave → registrar variable requerida, proveedor y `generation_phase: env-generator`
* Paga/comercial → registrar integracion requerida y nota `REQUIERE_API_KEY`

No generar claves, tokens ni valores reales.
No escribir `.env`.
No escribir `.env.example`.
No implementar codigo durante inicializacion.

Si utiliza redirección de pagos (MercadoPago, Stripe Checkout):

Registrar:

`external_redirect_warning: true`

Registrar origen:

```text
B1.integrations = USER_EXPLICIT
integrations.required_env_vars = ENGINE_INFERENCE
```

---

## CIERRE SECCIÓN B

Retener respuestas e inferencias en memoria.

Leer:

[WORKSPACE_ROOT]/.agents/skills/bawe-initialization-logic/assets/interview-questions-b-defaults.md

