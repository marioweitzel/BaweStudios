---
name: landing-marketing-prd-template
description: |
  Plantilla interna de conocimiento de dominio para landing pages, páginas de campaña
  y marketing sites orientados a comunicar una propuesta de valor y conducir a una
  acción principal. Ayuda a prd-spec-generator a derivar objetivos, mensajes,
  mecanismos de conversión, contenidos, medición y límites sin imponer una estructura
  visual, una herramienta externa ni una métrica inventada.
allowed-tools: [Read]
applyTo: ["**/project-context.md", "**/prd.md"]
bawe_network_role: prd-domain-template
bawe_dependencies_on:
  - {skill: prd-spec-generator, relation_type: invocado-por}
bawe_depended_by: []
---

# BAWE PRD DOMAIN TEMPLATE — Landing / Marketing

Version: 1.0  
Status: Stable domain template

## 1. PROPÓSITO

Este archivo aporta conocimiento específico del dominio landing page y marketing site a
`prd-spec-generator`.

No es un PRD terminado.

No define la estructura final de `prd.md`.

No contiene secciones visuales que deban copiarse automáticamente.

No autoriza al generador a inventar formularios, analytics, CRM, SEO, testimoniales,
precios, FAQs, consentimiento, campañas, navegación ni herramientas externas.

Su función es ayudar al LLM a responder:

```text
¿Qué debe comunicar la página?
¿A quién?
¿Qué acción principal debe promover?
¿Qué información necesita el visitante antes de actuar?
¿Qué mecanismo completa la conversión?
¿Cómo se confirma el resultado?
¿Qué debe medirse?
¿Qué riesgos de mensaje, confianza y alcance deben evitarse?
```

La estructura final del PRD continúa definida exclusivamente por:

```text
assets/base/prd-base.md
```

El razonamiento, las ambigüedades, la escritura y la validación continúan definidos por:

```text
assets/methodology/reasoning-order.md
assets/methodology/ambiguity-rules.md
assets/methodology/prd-writing-rules.md
assets/methodology/validation-rules.md
```

---

# 2. CONTRATO DE USO

## Entrada

Esta plantilla se usa únicamente después de que `prd-spec-generator` haya leído:

```text
[PROJECT_ROOT]/project-context.md
[PROJECT_ROOT]/log-preguntas.md
```

y haya normalizado:

```text
project_type = landing
```

La normalización puede provenir de términos como:

```text
landing
landing page
marketing
marketing site
página de campaña
página de captación
página de lanzamiento
prelaunch
waitlist
micrositio de campaña
```

La selección de esta plantilla no significa que todas las capacidades aquí descritas
formen parte del producto.

## Salida

Esta plantilla no escribe archivos.

Aporta conocimiento para que `prd-spec-generator` componga:

```text
[PROJECT_ROOT]/prd.md
```

## Regla principal

Cada capacidad debe pasar por esta cadena antes de incorporarse:

```text
señal en el contexto
→ necesidad de comunicación o conversión
→ condición de activación
→ comportamiento mínimo
→ alcance
→ requisito
→ historia
→ criterio de aceptación
```

Si la cadena no puede construirse, la capacidad no se incorpora.

---

# 3. CUÁNDO APLICAR ESTA PLANTILLA

Aplicar cuando el valor principal del producto depende de una o más de estas señales:

```text
explicar una propuesta de valor
presentar un producto, servicio, evento o campaña
captar interés
obtener una consulta
conseguir un registro
llevar al visitante a otro flujo
validar demanda
lanzar una oferta
centralizar información de una campaña
```

Ejemplos compatibles:

- landing de captación de leads;
- página de lanzamiento;
- página de espera o preinscripción;
- página de campaña publicitaria;
- página de solicitud de demo;
- landing de servicio;
- landing de evento;
- página de descarga;
- página de producto único;
- micrositio de marketing;
- página de donación o adhesión cuando la conversión es una acción puntual;
- marketing site pequeño centrado en una propuesta principal.

---

# 4. CUÁNDO NO APLICARLA

No aplicar como plantilla principal cuando el producto es esencialmente:

```text
un sitio institucional con múltiples audiencias y objetivos
un e-commerce con transacción propia
una aplicación web con área privada
un blog o medio editorial
un portfolio cuyo objetivo principal es exhibir trabajos
un portal de soporte
un SaaS operativo
un sitio documental
```

Una página pública con CTA no es automáticamente una landing.

Debe existir:

```text
un objetivo principal
una audiencia identificable
una propuesta concreta
una acción esperada
```

Si hay múltiples objetivos institucionales, múltiples áreas y navegación extensa, puede
corresponder mejor la plantilla `corporate`.

---

# 5. VARIANTES SOPORTADAS

Antes de derivar capacidades, clasificar la variante predominante.

Puede existir más de una, pero debe identificarse una principal.

## 5.1 Lead generation

Señales:

```text
captar consultas
solicitar contacto
obtener datos
generar oportunidades comerciales
```

Valor típico:

```text
convertir interés en un lead accionable
```

Puede requerir:

```text
formulario
canal externo
consentimiento
confirmación
entrega al negocio
```

No asumir CRM ni email.

## 5.2 Click-through landing

Señales:

```text
la página explica
la conversión ocurre en otro sitio o producto
CTA dirige a registro, compra, descarga o plataforma externa
```

Valor típico:

```text
preparar al visitante y conducirlo al siguiente paso
```

Puede no requerir captura de datos.

## 5.3 Prelaunch o waitlist

Señales:

```text
producto aún no disponible
validar interés
lista de espera
acceso temprano
```

Valor típico:

```text
medir demanda y conservar interesados
```

Debe definir:

```text
qué obtiene el visitante
cómo se registra
qué confirmación recibe
qué expectativa se comunica
```

## 5.4 Product launch

Señales:

```text
nuevo producto
fecha de lanzamiento
demostración
beneficios
CTA de compra, demo o registro
```

Valor típico:

```text
presentar la oferta y activar adopción
```

No asumir urgencia artificial ni countdown.

## 5.5 Service landing

Señales:

```text
servicio profesional
consulta
presupuesto
agenda
llamada
```

Valor típico:

```text
explicar el servicio y facilitar una conversación comercial
```

Puede requerir contacto o agenda externa.

No asumir formulario.

## 5.6 Event or campaign landing

Señales:

```text
evento
fecha
ubicación
inscripción
campaña temporal
acción limitada
```

Valor típico:

```text
concentrar información y facilitar participación
```

Puede requerir:

```text
fecha
condiciones
registro
confirmación
```

No asumir cuenta regresiva.

## 5.7 Download or resource landing

Señales:

```text
descarga
recurso
guía
documento
contenido protegido
```

Valor típico:

```text
entregar un recurso a cambio de una acción o sin fricción
```

Debe definir si la descarga requiere datos.

## 5.8 App or product acquisition landing

Señales:

```text
descargar aplicación
instalar
registrarse
probar producto
```

Valor típico:

```text
conducir al visitante a comenzar el uso
```

Puede necesitar rutas distintas por plataforma o audiencia.

## 5.9 Single-offer transactional landing

Señales:

```text
un producto o servicio
compra directa
una oferta
pocas decisiones
```

Valor típico:

```text
explicar y cerrar una transacción específica
```

Si la transacción se procesa dentro de la página, puede requerir complementar con
conocimiento e-commerce.

## 5.10 Marketing microsite

Señales:

```text
campaña con varias páginas
producto con más información
múltiples contenidos subordinados a un objetivo común
```

Valor típico:

```text
organizar información de campaña sin convertirse en sitio institucional
```

No asumir one-page.

---

# 6. MODELO DE ACTIVACIÓN DE CAPACIDADES

Cada capacidad se clasifica como:

```text
REQUERIDA BAJO CONDICIÓN
CONDICIONAL
OPCIONAL
NO INCLUIR POR DEFECTO
```

## 6.1 Requerida bajo condición

La capacidad debe incluirse cuando una condición explícita la vuelve necesaria para
comunicar o completar la acción principal.

## 6.2 Condicional

La capacidad puede ser necesaria, pero depende del objetivo, audiencia, canal o campaña.

## 6.3 Opcional

Puede reforzar claridad, confianza o medición, pero no entra al complete product scope sin justificación.

## 6.4 NO INCLUIR POR DEFECTO

Se excluye salvo que constituya parte explícita de la estrategia.

La clasificación final pertenece a `base/product-scope-rules.md`.

---

# 7. CAPACIDADES DEL DOMINIO

## 7.1 Objetivo principal

### Activar cuando

```text
siempre
```

Toda landing debe tener un objetivo principal identificable.

### Debe derivarse

```text
acción esperada
actor
resultado para el visitante
resultado para el negocio
momento de conversión
```

### Alcance por defecto

```text
REQUERIDA BAJO CONDICIÓN
```

### No asumir

```text
captura de lead
registro
compra
contacto
descarga
```

El objetivo sale del contexto.

## 7.2 Propuesta de valor

### Activar cuando

```text
siempre
```

### Debe responder

```text
qué se ofrece
para quién
qué problema resuelve
qué resultado promete
por qué es relevante
```

### Alcance por defecto

```text
REQUERIDA BAJO CONDICIÓN
```

### No asumir

```text
titular específico
cantidad de beneficios
lenguaje persuasivo agresivo
promesas no respaldadas
```

## 7.3 Mensaje principal

### Activar cuando

```text
siempre
```

### Debe derivarse

```text
idea central
tono
nivel de conocimiento del visitante
objeción principal
acción esperada
```

### Alcance por defecto

```text
REQUERIDA BAJO CONDICIÓN
```

El PRD puede definir qué debe comprender el visitante.

No debe escribir el copy final salvo que el alcance lo exija.

## 7.4 CTA principal

### Activar cuando

```text
existe una acción concreta
```

### Debe derivarse

```text
acción
destino
resultado
texto conceptual
condiciones
```

### Alcance por defecto

```text
REQUERIDA BAJO CONDICIÓN
```

### No asumir

```text
botón
posición above the fold
texto “Registrarme”
repetición
color
```

El PRD define la acción y su disponibilidad.

El diseño define la representación.

## 7.5 CTA secundario

### Activar cuando

```text
existe una acción alternativa legítima
el visitante puede no estar listo para la principal
```

### Alcance por defecto

```text
CONDICIONAL
```

### No asumir

```text
dos CTAs
CTA repetido
jerarquía visual concreta
```

No crear acciones competidoras sin una razón de negocio.

## 7.6 Arquitectura de contenido

### Activar cuando

```text
siempre
```

### Debe derivarse

```text
información necesaria
orden lógico
preguntas del visitante
objeciones
pruebas
acción
```

### Alcance por defecto

```text
REQUERIDA BAJO CONDICIÓN
```

### No asumir secciones visuales universales

```text
hero
beneficios
features
testimoniales
FAQ
pricing
footer
```

La estructura de contenido se deriva del objetivo.

## 7.7 Explicación de beneficios

### Activar cuando

```text
el visitante necesita comprender resultados o ventajas
```

### Debe derivarse

```text
beneficio
problema asociado
evidencia
relación con la audiencia
```

### Alcance por defecto

```text
REQUERIDA BAJO CONDICIÓN
```

### No asumir

```text
3 a 6 ítems
tarjetas
iconos
```

## 7.8 Características o detalles de la oferta

### Activar cuando

```text
el visitante necesita entender qué incluye
la decisión depende de capacidades concretas
```

### Alcance por defecto

```text
CONDICIONAL
```

No confundir características con beneficios.

## 7.9 Prueba y confianza

### Activar cuando

```text
la decisión requiere reducir incertidumbre
hay evidencia real disponible
la confianza es una barrera
```

### Posibles fuentes

```text
testimonios
casos
logos autorizados
certificaciones
datos verificables
garantías
muestras
demostraciones
```

### Alcance por defecto

```text
CONDICIONAL
```

### No asumir

```text
testimoniales
números de usuarios
logos
ratings
```

No inventar evidencia.

## 7.10 Formulario de conversión

### Activar cuando

```text
la acción principal requiere capturar datos dentro de la página
```

### Debe derivarse

```text
datos necesarios
motivo
validación
destino
resultado
confirmación
consentimiento si aplica
```

### Alcance por defecto

```text
REQUERIDA BAJO CONDICIÓN
```

### No asumir

```text
nombre y email
teléfono
CRM
notificación por email
```

Pedir solo datos necesarios.

## 7.11 Conversión externa

### Activar cuando

```text
la acción se completa en otro sistema
```

Ejemplos:

```text
agenda
mensajería
registro externo
app store
checkout externo
plataforma de eventos
```

### Debe derivarse

```text
destino
momento
contexto transferido
resultado esperado
fallo
```

### Alcance por defecto

```text
CONDICIONAL
```

No asumir herramienta concreta.

## 7.12 Confirmación de conversión

### Activar cuando

```text
el visitante completa una acción
```

### Debe derivarse

```text
resultado visible
próximo paso
expectativa de respuesta
referencia de operación si aplica
```

### Alcance por defecto

```text
REQUERIDA BAJO CONDICIÓN
```

### No asumir

```text
email
thank-you page
modal
```

## 7.13 Entrega de recurso

### Activar cuando

```text
la conversión promete una descarga, guía, acceso o contenido
```

### Debe derivarse

```text
qué se entrega
cuándo
cómo se accede
qué ocurre si falla
```

### Alcance por defecto

```text
REQUERIDA BAJO CONDICIÓN
```

## 7.14 Contacto

### Activar cuando

```text
el objetivo es iniciar conversación
```

### Posibles mecanismos

```text
formulario
email
teléfono
mensajería
agenda
canal externo
```

### Alcance por defecto

```text
REQUERIDA BAJO CONDICIÓN
```

### No asumir

```text
WhatsApp
chat
formulario
respuesta inmediata
```

## 7.15 Pricing

### Activar cuando

```text
el precio es público
el precio influye en la decisión
existen planes
la campaña comunica una oferta comercial
```

### Debe derivarse

```text
qué incluye
precio
periodicidad
condiciones
comparación
acción
```

### Alcance por defecto

```text
CONDICIONAL
```

### No asumir

```text
tres planes
free trial
mensualidad
descuento anual
```

## 7.16 FAQ

### Activar cuando

```text
existen objeciones o dudas repetidas
la oferta requiere aclaraciones
```

### Debe derivarse

```text
pregunta real
respuesta respaldada
impacto en la decisión
```

### Alcance por defecto

```text
CONDICIONAL
```

No inventar preguntas para llenar espacio.

## 7.17 Demo, video o media

### Activar cuando

```text
la oferta se entiende mejor mediante demostración
existe material real
```

### Alcance por defecto

```text
OPCIONAL
```

No asumir video disponible.

## 7.18 Navegación

### Activar cuando

```text
hay varias páginas
existen secciones extensas
el visitante necesita acceder directamente a información
```

### Alcance por defecto

```text
CONDICIONAL
```

### No asumir

```text
menú
hamburger
scroll anchors
header fijo
```

## 7.19 Footer e información complementaria

### Activar cuando

```text
se requiere acceso a información secundaria, contacto, identidad o documentos
```

### Alcance por defecto

```text
CONDICIONAL
```

### No asumir

```text
footer universal
links legales específicos
redes sociales
```

## 7.20 Privacidad y consentimiento

### Activar cuando

```text
se capturan datos personales
se usan tecnologías de seguimiento
el mercado o la actividad lo requiere
```

### Debe derivarse

```text
dato
finalidad
consentimiento
información disponible
acción del usuario
```

### Alcance por defecto

```text
REQUERIDA BAJO CONDICIÓN
```

### No asumir

```text
GDPR
LGPD
cookie banner
términos
política específica
```

Las obligaciones legales no se inventan.

## 7.21 Medición de conversión

### Activar cuando

```text
el éxito depende de conocer acciones o resultados
el cliente solicita medición
la campaña requiere evaluación
```

### Debe derivarse

```text
evento
resultado de negocio
fuente o contexto
actor que interpreta
```

### Alcance por defecto

```text
CONDICIONAL
```

### No asumir

```text
Google Analytics
GA4
pixel
dashboard externo
tracking de todo
```

## 7.22 Atribución de campaña

### Activar cuando

```text
el tráfico proviene de campañas
el negocio necesita comparar fuentes
```

### Debe derivarse

```text
fuente
campaña
acción
resultado
```

### Alcance por defecto

```text
CONDICIONAL
```

No definir tecnología de atribución.

## 7.23 SEO y descubrimiento orgánico

### Activar cuando

```text
la página debe ser encontrada en buscadores
la campaña tiene horizonte orgánico
la landing forma parte de una estrategia SEO
```

### Debe derivarse

```text
audiencia
intención de búsqueda
contenido indexable
resultado esperado
```

### Alcance por defecto

```text
CONDICIONAL
```

### No asumir

```text
sitemap
keywords
meta tags específicos
blog
```

El PRD puede exigir descubribilidad y representación adecuada.

La implementación definirá mecanismos.

## 7.24 Representación al compartir

### Activar cuando

```text
la página se comparte en redes o mensajería
```

### Alcance por defecto

```text
CONDICIONAL
```

No asumir OG tags como requisito de producto salvo que el canal lo justifique.

## 7.25 Integración CRM o marketing automation

### Activar cuando

```text
los leads deben ingresar a un proceso externo
el cliente identifica una herramienta o workflow
```

### Debe derivarse

```text
dato
destino
momento
resultado
fallo
```

### Alcance por defecto

```text
CONDICIONAL
```

### No asumir

```text
HubSpot
Mailchimp
Brevo
nurturing
```

## 7.26 Gestión de contenido

### Activar cuando

```text
el contenido cambia con frecuencia
un actor no técnico debe actualizarlo
hay campañas recurrentes
```

### Posibles modelos

```text
contenido fijo
actualización asistida
gestión propia
fuente externa
```

### Alcance por defecto

```text
CONDICIONAL
```

### No asumir

```text
CMS
panel
editor visual
```

## 7.27 Multi-idioma

### Activar cuando

```text
existen audiencias con idiomas diferentes
la campaña opera en varios mercados
```

### Alcance por defecto

```text
CONDICIONAL
```

### No asumir

```text
dos idiomas
traducción automática
selector
```

## 7.28 Página de agradecimiento o estado posterior

### Activar cuando

```text
la conversión requiere un destino posterior
hay próximos pasos
se necesita medición separada
```

### Alcance por defecto

```text
CONDICIONAL
```

No asumir una página independiente.

## 7.29 A/B testing

### Activar cuando

```text
existe hipótesis
hay tráfico suficiente
hay capacidad de medir
el cliente lo solicita
```

### Alcance por defecto

```text
NO INCLUIR POR DEFECTO
```

### No asumir

```text
variantes
herramienta
significancia
```

## 7.30 Chat o asistencia inmediata

### Activar cuando

```text
la decisión requiere interacción
el negocio puede responder
es parte explícita del canal
```

### Alcance por defecto

```text
OPCIONAL
```

No asumir widget.

## 7.31 Blog o recursos

### Activar cuando

```text
el contenido forma parte de adquisición o educación
```

### Alcance por defecto

```text
NO INCLUIR POR DEFECTO
```

Si el producto principal es editorial, corresponde otra plantilla.

---

# 8. ACTORES CANDIDATOS

Estos actores son posibilidades del dominio, no roles obligatorios.

## Visitante

Activa cuando alguien consume la página sin relación previa.

## Prospecto

Activa cuando el visitante evalúa una oferta y puede convertirse en lead.

## Lead

Activa después de aportar datos o iniciar contacto.

## Solicitante

Activa cuando completa una solicitud, demo, inscripción o consulta.

## Comprador

Activa si la conversión incluye compra.

## Participante

Activa para eventos, campañas o adhesiones.

## Responsable de marketing

Activa cuando alguien mide campañas, contenidos o conversiones.

## Responsable comercial

Activa cuando recibe y procesa oportunidades.

## Responsable de contenido

Activa cuando alguien mantiene textos, imágenes u ofertas.

### Regla de actores

No crear actores internos si la landing no incluye una función para ellos.

Una persona que consulta analytics fuera del producto puede ser stakeholder, no usuario
del producto.

---

# 9. FLUJOS CANDIDATOS

Los siguientes son patrones condicionales.

No deben copiarse automáticamente.

## Comprender la propuesta

```text
entrada
→ mensaje principal
→ información relevante
→ decisión de continuar o salir
```

## Captura de lead

```text
interés
→ formulario o mecanismo
→ validación
→ envío
→ confirmación
→ entrega al negocio
```

## Click-through

```text
comprensión
→ activación del CTA
→ traslado al destino
→ continuidad del contexto
```

## Waitlist

```text
comprensión
→ registro
→ confirmación
→ expectativa de contacto o acceso
```

## Solicitud de demo

```text
interés
→ datos necesarios
→ solicitud
→ confirmación
→ seguimiento comercial
```

## Descarga

```text
comprensión
→ condición de acceso
→ entrega
→ confirmación
```

## Evento

```text
consulta de información
→ decisión
→ inscripción
→ confirmación
```

## Medición

```text
evento de visitante
→ registro de resultado
→ interpretación por stakeholder
```

## Actualización de contenido

```text
actor autorizado
→ modificación
→ revisión
→ publicación
```

---

# 10. REGLAS DE NEGOCIO QUE DEBEN DERIVARSE

Para cada landing o marketing site, revisar si existen reglas sobre:

```text
qué acción cuenta como conversión
qué datos se capturan
qué ocurre con esos datos
qué recibe el visitante
quién recibe la conversión
qué respuesta se promete
qué contenido está autorizado
qué evidencia puede mostrarse
qué canales participan
qué mercados o idiomas aplican
qué restricciones legales existen
qué campaña o fuente debe medirse
qué contenido puede actualizarse
```

No inventar:

```text
métricas objetivo
porcentajes
tiempos
claims
testimonios
logos
precios
consentimientos
herramientas
canales
```

Si una regla es necesaria para el flujo principal y no puede derivarse, aplicar:

```text
methodology/ambiguity-rules.md
```

---

# 11. PATRONES DE HISTORIAS DE USUARIO

Estos patrones solo se activan cuando existe el requisito correspondiente.

## Comprensión

```text
Como [visitante],
quiero entender [oferta y beneficio],
para decidir si la propuesta es relevante para mí.
```

## Conversión

```text
Como [prospecto],
quiero completar [acción],
para obtener [resultado].
```

## Contacto

```text
Como [prospecto],
quiero enviar la información necesaria,
para iniciar una conversación con [negocio].
```

## Descarga

```text
Como [visitante],
quiero acceder a [recurso],
para obtener [beneficio].
```

## Registro

```text
Como [visitante],
quiero registrarme en [lista o evento],
para recibir [resultado].
```

## Confianza

```text
Como [visitante],
quiero consultar evidencia relevante,
para reducir incertidumbre antes de actuar.
```

## Medición

```text
Como [stakeholder],
quiero conocer [resultado de conversión],
para evaluar [objetivo].
```

## Contenido

```text
Como [responsable de contenido],
quiero actualizar [contenido],
para mantener vigente la campaña.
```

### Regla

Los patrones no introducen capacidades.

Solo convierten requisitos ya activados en historias.

---

# 12. PATRONES DE CRITERIOS DE ACEPTACIÓN

Los criterios finales deben seguir `base/acceptance-criteria.md`.

## Comprensión

```text
el visitante identifica qué se ofrece
el visitante identifica para quién es
el visitante identifica la acción principal
la información no contradice la oferta
```

## CTA

```text
la acción principal conduce al destino correcto
el estado de activación es comprensible
un fallo no se presenta como conversión exitosa
```

## Formulario

```text
los datos obligatorios faltantes impiden enviar
los datos inválidos se identifican
un envío válido produce confirmación
el resultado llega al destino definido
```

## Conversión externa

```text
el visitante llega al destino esperado
el contexto necesario se conserva cuando aplica
un destino no disponible produce una respuesta comprensible
```

## Recurso

```text
una acción válida habilita el recurso
el recurso corresponde a la promesa
un fallo de entrega es visible
```

## Consentimiento

```text
el visitante conoce la finalidad de los datos
el consentimiento se solicita cuando es requerido
la acción no usa datos para una finalidad no declarada
```

## Medición

```text
la acción definida se registra una sola vez por evento válido
el resultado puede diferenciarse de una visita
la medición no altera el flujo de conversión
```

No convertir estas frases en criterios finales sin actores, acciones y condiciones reales.

---

# 13. REQUISITOS NO FUNCIONALES RELEVANTES

Incorporar solo cuando exista soporte contextual.

## Claridad

Definir resultados observables:

```text
la propuesta principal puede identificarse
la acción principal es reconocible
las condiciones relevantes están disponibles
```

No usar:

```text
impactante
moderna
persuasiva
bonita
```

## Accesibilidad

Aplicar según reglas generales y audiencia.

## Rendimiento

Puede ser relevante cuando:

```text
la campaña depende de tráfico pago
la audiencia usa conexiones limitadas
el abandono afecta conversión
```

No inventar:

```text
LCP
CLS
FID
Lighthouse 85+
segundos exactos
```

Esos valores solo entran con fuente o estándar contractual explícito.

## Compatibilidad

Relacionar con dispositivos y entornos reales del público.

No asumir mobile-first.

## SEO

Tratar como requisito solo si el descubrimiento orgánico es parte del objetivo.

## Privacidad

Activar cuando hay datos o tracking.

## Disponibilidad

Relacionar con campañas, eventos o fechas críticas cuando aplique.

## Mantenibilidad de contenido

Activar cuando un actor debe actualizar la campaña.

---

# 14. RIESGOS ESPECÍFICOS DEL DOMINIO

Evaluar solo los aplicables.

## Objetivo ambiguo

Riesgo:

```text
la página intenta vender, captar, informar y reclutar con la misma prioridad
```

## CTA inventado

Riesgo:

```text
el generador elige una acción no definida por el cliente
```

## Formulario por defecto

Riesgo:

```text
se capturan datos aunque la conversión ocurre fuera de la página
```

## Mensaje genérico

Riesgo:

```text
la propuesta no refleja problema, audiencia ni resultado
```

## Evidencia falsa

Riesgo:

```text
se inventan testimonios, números, logos o claims
```

## Métricas inventadas

Riesgo:

```text
se fijan tasas, rebote, tiempos o scores sin fuente
```

## Herramienta impuesta

Riesgo:

```text
GA4, CRM, chat o email se convierten en requisito automático
```

## SEO universal

Riesgo:

```text
se implementa estrategia orgánica en una campaña temporal de tráfico directo
```

## Legal genérico

Riesgo:

```text
se asumen GDPR, cookie banner o documentos sin mercado ni tratamiento de datos definido
```

## One-page asumida

Riesgo:

```text
se fuerza una sola página cuando la información requiere varias
```

## Mobile-first asumido

Riesgo:

```text
se prioriza un dispositivo sin información del público
```

## Contenido no disponible

Riesgo:

```text
el PRD depende de testimonios, video, imágenes o copy inexistentes
```

---

# 15. TRAMPAS DE ALCANCE

No incorporar automáticamente:

```text
hero
CTA above the fold
CTA secundario
formulario
nombre y email
notificación al negocio
GA4
CRM
SEO
sitemap
OG tags
testimoniales
pricing
FAQ
video
chat
cookie banner
blog
A/B testing
multi-idioma
thank-you page
CMS
one-page
mobile-first
```

Cada elemento requiere una condición de activación.

No usar frases como:

```text
toda landing necesita
mejora conversión
es estándar
es buena práctica
```

Una práctica habitual no es automáticamente un requisito de producto.

---

# 16. CLASIFICACIÓN ORIENTATIVA DE ALCANCE

La clasificación final pertenece a `base/product-scope-rules.md`.

## Requeridas bajo condición

```text
objetivo principal
propuesta de valor
mensaje
acción principal
mecanismo de conversión
confirmación cuando hay conversión
información necesaria para decidir
```

## Condicionales

```text
formulario
conversión externa
prueba social
pricing
FAQ
contacto
medición
atribución
SEO
privacidad
consentimiento
navegación
gestión de contenido
multi-idioma
```

## Opcionales

```text
video
chat
recursos adicionales
prueba social complementaria
personalización visual avanzada
```

## NO INCLUIR POR DEFECTO

```text
A/B testing
blog completo
automatización de marketing compleja
múltiples variantes de campaña
personalización por audiencia
sistema propio de analytics
CMS complejo
```

Una capacidad puede ingresar al complete product scope si es parte explícita del objetivo.

---

# 17. MAPEO DESDE `project-context.md`

## `project_name`

Aporta identidad.

No determina el mensaje.

## `purpose`

Define el resultado principal.

Debe orientar propuesta y conversión.

## `project_type`

Activa esta plantilla después de normalización.

## `client_profile.audience`

Fuente principal para la audiencia.

## `client_profile.persona`

Ayuda a definir visitante o prospecto principal.

## `client_profile.primary_actions`

Fuente autoritativa para determinar la conversión.

No inventar CTA fuera de estas acciones.

## `client_profile.social_media`

Puede activar:

```text
canales de llegada
representación al compartir
continuidad con campañas
```

No obliga a incluir iconos o feeds.

## `complete_product_scope.must_have_features`

Fuente autoritativa de prioridad de construccion.

Cada función debe rastrearse hasta requisitos, historias y criterios.

## `brand.visual_style`

Aporta expectativas visuales y tono.

No define secciones ni funcionalidades.

## `brand.reference_url`

Puede aportar:

```text
estructura de comunicación
tono
nivel de detalle
referencias visuales
```

No debe copiarse.

## `brand.reference_notes`

Ayuda a distinguir qué se valora de la referencia.

## `scale.expected_volume`

Puede activar:

```text
medición
robustez del formulario
atribución
gestión de contenido
```

No autoriza objetivos numéricos inventados.

---

# 18. PROTOCOLO DE GENERACIÓN LANDING

Después de seleccionar esta plantilla:

```text
1. Identificar la variante principal.
2. Identificar audiencia.
3. Identificar problema y propuesta.
4. Identificar una acción principal.
5. Determinar dónde se completa la conversión.
6. Determinar qué necesita saber el visitante antes de actuar.
7. Revisar capacidades del dominio.
8. Activar solo capacidades con condición presente.
9. Aplicar ambiguity-rules.md a cada faltante.
10. Derivar flujos completos.
11. Derivar requisitos y reglas.
12. Crear historias y criterios.
13. Clasificar complete product scope, Deferred Scope y Out of Scope.
14. Registrar decisiones y supuestos en prd.md.
15. Renderizar con prd-base.md.
16. Autoevaluar con validation-rules.md.
```

---

# 19. REGISTRO EN `prd.md`

Cuando esta plantilla se use, registrar:

```text
template = project-types/landing/prd-template.md
landing_variant
primary_audience
primary_conversion
conversion_destination
required_content
activated_capabilities
rejected_capabilities
conditional_capabilities
scope_decisions
ambiguity_resolutions
unsupported_patterns_not_added
```

Ejemplo conceptual:

```markdown
## Landing Template Decisions

- Variant: service lead generation
- Primary conversion: request an appointment
- Conversion destination: external scheduling service
- Activated:
  - value proposition;
  - service explanation;
  - external CTA;
  - confirmation expectations.
- Not activated:
  - internal form;
  - CRM integration;
  - GA4;
  - blog;
  - testimonials;
  - pricing.
```

No crear otro archivo para estas decisiones.

---

# 20. VALIDACIÓN ESPECÍFICA LANDING

Antes de aceptar el PRD, comprobar:

```text
[ ] La variante está justificada.
[ ] Existe una audiencia principal.
[ ] Existe un objetivo principal.
[ ] La acción principal proviene del contexto.
[ ] La conversión tiene un resultado observable.
[ ] El mensaje no inventa claims.
[ ] La estructura de contenido responde a preguntas reales.
[ ] El formulario existe solo si captura datos dentro de la página.
[ ] Los datos solicitados son necesarios.
[ ] La medición existe solo si fue activada.
[ ] No se impuso GA4 u otra herramienta.
[ ] SEO existe solo cuando el descubrimiento orgánico es relevante.
[ ] No se inventaron testimonios, logos o métricas.
[ ] No se forzó one-page.
[ ] No se forzó mobile-first.
[ ] No se inventaron umbrales de rendimiento.
[ ] No se impusieron documentos legales sin condición.
[ ] No hay decisiones técnicas.
[ ] No existe un Implementation Plan.
[ ] No se duplicó la estructura de prd-base.md.
[ ] Los elementos opcionales no inflaron el complete product scope.
```

Hallazgos posibles, además de los generales:

```text
PRD_LANDING_OBJECTIVE_AMBIGUOUS
PRD_LANDING_CTA_INVENTED
PRD_LANDING_FORM_ASSUMED
PRD_LANDING_METRIC_INVENTED
PRD_LANDING_ANALYTICS_ASSUMED
PRD_LANDING_SEO_ASSUMED
PRD_LANDING_SOCIAL_PROOF_INVENTED
PRD_LANDING_CONTENT_DEPENDENCY_UNRESOLVED
PRD_LANDING_ONE_PAGE_ASSUMED
```

Estos códigos pueden mapearse a los códigos generales de `validation-rules.md`
durante la integración si el contrato final evita códigos específicos de dominio.

---

# 21. PROHIBICIONES

Esta plantilla no debe:

```text
contener un PRD completo embebido
definir milestones
definir arquitectura
definir layout
definir hero obligatorio
definir CTA above the fold
definir cantidad de beneficios
definir formulario obligatorio
definir GA4
definir CRM
definir sitemap
definir meta tags específicos
definir Core Web Vitals inventados
definir Lighthouse score
definir anchos de pantalla
definir mobile-first
definir one-page
definir testimonios
definir cookie banner sin condición
definir email como canal obligatorio
definir un sistema de analytics propio
```

---

# 22. INTEGRACIÓN

Invocado por:

```text
prd-spec-generator
```

Condición:

```text
normalized_project_type == "landing"
```

También puede cubrir alias como:

```text
marketing
landing page
marketing site
página de campaña
prelaunch
waitlist
```

cuando `template-registry.json` los normalice a `landing`.

No escribe archivos directamente.

No modifica `prd.md`.

No es leído obligatoriamente por `prd-validation-gate` durante un PASS normal.

Puede ser consultado en reparación cuando el hallazgo se relaciona con claridad,
conversión, contenido o alcance específico del dominio landing.

---

# 23. REGLA FINAL

No conviertas una página de campaña en una landing genérica.

Usa esta plantilla para comprender:

```text
qué debe entender el visitante
qué debe hacer
qué resultado debe obtener
```

Cuando una capacidad común no está respaldada por el contexto:

```text
no la agregues
```

Cuando una capacidad es necesaria para que la conversión explícita sea viable:

```text
actívala en su forma mínima
registra la razón
mantén neutralidad técnica
```
