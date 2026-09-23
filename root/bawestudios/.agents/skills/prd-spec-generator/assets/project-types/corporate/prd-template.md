---
name: corporate-institutional-prd-template
description: |
  Plantilla interna de conocimiento de dominio para sitios corporativos e institucionales.
  Ayuda a prd-spec-generator a detectar audiencias, objetivos informativos, contenidos,
  puntos de contacto, necesidades de confianza, actualización y alcance sin convertir
  páginas habituales, herramientas externas o estructuras visuales en requisitos obligatorios.
allowed-tools: [Read]
applyTo: ["**/project-context.md", "**/prd.md"]
bawe_network_role: prd-domain-template
bawe_dependencies_on:
  - {skill: prd-spec-generator, relation_type: invocado-por}
bawe_depended_by: []
---

# BAWE PRD DOMAIN TEMPLATE — Corporate / Institutional

Version: 1.0  
Status: Stable domain template

## 1. PROPÓSITO

Este archivo aporta conocimiento específico del dominio corporativo e institucional a
`prd-spec-generator`.

No es un PRD terminado.

No define la estructura final de `prd.md`.

No contiene páginas, módulos o secciones que deban copiarse automáticamente.

No autoriza al generador a inventar Home, Quiénes Somos, Servicios, Contacto,
formularios, SEO, CMS, analytics, redes sociales, mapa, equipo, vacantes ni documentos.

Su función es ayudar al LLM a responder:

```text
¿Qué organización debe representar el sitio?
¿Ante qué audiencias?
¿Qué necesita comprender cada audiencia?
¿Qué información genera confianza?
¿Qué acciones debe poder completar cada visitante?
¿Qué contenido debe mantenerse actualizado?
¿Qué límites separan el sitio institucional de una landing, un portal o una aplicación?
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
project_type = corporate
```

La normalización puede provenir de términos como:

```text
corporate
institutional
institucional
sitio corporativo
sitio empresarial
sitio de empresa
sitio de organización
ONG
fundación
startup institucional
company website
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
→ audiencia
→ necesidad informativa o de contacto
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
representar una empresa u organización
explicar quién es y qué hace
comunicar servicios, capacidades o programas
generar confianza institucional
centralizar información oficial
facilitar distintos puntos de contacto
atender múltiples audiencias
publicar información corporativa
```

Ejemplos compatibles:

- empresa de servicios profesionales;
- empresa industrial;
- distribuidor o proveedor B2B;
- organización sin fines de lucro;
- fundación;
- institución educativa;
- clínica o centro profesional;
- startup que necesita presentación institucional;
- organización pública o sectorial;
- cámara empresarial;
- sitio de grupo corporativo;
- sitio de marca empleadora;
- sitio institucional con varias líneas de actividad.

---

# 4. CUÁNDO NO APLICARLA

No aplicar como plantilla principal cuando el producto es esencialmente:

```text
una landing con un único objetivo de conversión
un e-commerce
un SaaS o sistema operativo
un blog o medio editorial
un portfolio personal
un portal privado
un directorio
un marketplace
una aplicación móvil
```

La existencia de varias páginas no convierte automáticamente un sitio en corporativo.

Debe existir una necesidad central de:

```text
representación institucional
información oficial
credibilidad
relación con múltiples audiencias
```

Si una sola campaña, producto o servicio domina todo el objetivo, puede corresponder
mejor la plantilla `landing`.

---

# 5. VARIANTES CORPORATIVAS SOPORTADAS

Antes de derivar capacidades, clasificar la variante predominante.

Puede existir más de una, pero debe identificarse una principal.

## 5.1 Empresa de servicios profesionales

Señales:

```text
consultoría
estudio
agencia
despacho
servicios especializados
equipo como activo
casos de trabajo
```

Valor típico:

```text
explicar experiencia y facilitar consultas
```

Puede requerir:

```text
servicios
equipo
casos
contacto
```

No asumir portfolio ni testimonios.

## 5.2 Empresa industrial o B2B

Señales:

```text
productos industriales
distribución
capacidad productiva
especificaciones
mercados
certificaciones
sucursales
```

Valor típico:

```text
mostrar capacidad, oferta y confiabilidad comercial
```

Puede requerir:

```text
líneas de producto
documentación
certificaciones
contacto comercial
```

No asumir e-commerce.

## 5.3 Organización sin fines de lucro

Señales:

```text
misión
programas
impacto
voluntariado
donaciones
transparencia
```

Valor típico:

```text
explicar propósito y facilitar participación
```

Puede requerir:

```text
programas
impacto
formas de colaborar
reportes
```

No asumir donación online.

## 5.4 Institución educativa o cultural

Señales:

```text
programas
actividades
sedes
comunidad
inscripciones
agenda
```

Valor típico:

```text
centralizar información institucional y orientar a interesados
```

Puede requerir integración con otros sistemas, pero no se asume.

## 5.5 Clínica o institución profesional

Señales:

```text
especialidades
profesionales
sedes
contacto
turnos
confianza
```

Valor típico:

```text
explicar servicios y orientar al visitante
```

No asumir agenda, historia clínica ni portal de pacientes.

## 5.6 Startup institucional

Señales:

```text
empresa emergente
presentación de producto
equipo
visión
inversores
talento
```

Valor típico:

```text
establecer identidad y credibilidad
```

No usar `startup` como alias automático de landing.

Debe evaluarse si el objetivo es institucional o de campaña.

## 5.7 Grupo corporativo

Señales:

```text
múltiples empresas
marcas
unidades de negocio
presencia regional
gobierno corporativo
```

Valor típico:

```text
explicar estructura, actividades y relación entre unidades
```

Puede requerir navegación por unidades.

No asumir sitios separados.

## 5.8 Marca empleadora

Señales:

```text
cultura
talento
vacantes
beneficios
postulación
```

Valor típico:

```text
atraer candidatos y explicar la experiencia laboral
```

Puede complementar, pero no necesariamente reemplazar, el sitio corporativo.

## 5.9 Organización pública o sectorial

Señales:

```text
información oficial
servicios a ciudadanos o miembros
documentos
autoridades
transparencia
```

Valor típico:

```text
facilitar acceso confiable a información y trámites relacionados
```

No asumir portal transaccional.

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
representar correctamente a la organización o atender una audiencia.

## 6.2 Condicional

La capacidad puede ser relevante, pero depende de las audiencias, objetivos o contenido.

## 6.3 Opcional

Puede reforzar experiencia o confianza, pero no entra al complete product scope sin justificación.

## 6.4 NO INCLUIR POR DEFECTO

Se excluye salvo que sea parte explícita del núcleo institucional.

La clasificación final pertenece a `base/product-scope-rules.md`.

---

# 7. CAPACIDADES DEL DOMINIO

## 7.1 Identidad institucional

### Activar cuando

```text
siempre
```

### Debe derivarse

```text
nombre
tipo de organización
actividad
propuesta institucional
ámbito
diferenciadores
```

### Alcance por defecto

```text
REQUERIDA BAJO CONDICIÓN
```

### No asumir

```text
misión
visión
valores
historia
slogan
```

Estos elementos se incluyen solo si existen o son necesarios.

---

## 7.2 Audiencias

### Activar cuando

```text
siempre
```

### Debe derivarse

```text
audiencia
necesidad
información buscada
acción esperada
prioridad
```

### Alcance por defecto

```text
REQUERIDA BAJO CONDICIÓN
```

### No asumir

```text
clientes
socios
prensa
postulantes
inversores
```

Cada audiencia debe surgir del contexto.

---

## 7.3 Presentación general

### Activar cuando

```text
el visitante necesita comprender rápidamente qué es la organización
```

### Debe derivarse

```text
quiénes son
qué hacen
para quién
por qué es relevante
```

### Alcance por defecto

```text
REQUERIDA BAJO CONDICIÓN
```

### No asumir

```text
homepage
hero
CTA
```

El PRD define información y comportamiento, no layout.

---

## 7.4 Servicios, productos o programas

### Activar cuando

```text
la organización ofrece servicios, productos, programas o líneas de actividad
```

### Debe derivarse

```text
qué ofrece
para quién
alcance
resultado
condiciones
próximo paso
```

### Alcance por defecto

```text
REQUERIDA BAJO CONDICIÓN
```

### No asumir

```text
página por servicio
precios
formularios
categorías
```

---

## 7.5 Historia, misión, visión y valores

### Activar cuando

```text
aportan confianza
explican propósito
son parte de la identidad institucional
el cliente los provee
```

### Alcance por defecto

```text
CONDICIONAL
```

### No asumir contenido.

No generar una historia ni valores ficticios.

---

## 7.6 Equipo, autoridades o directorio

### Activar cuando

```text
las personas generan confianza
la autoridad institucional es relevante
el equipo es parte del valor
hay obligación de transparencia
```

### Debe derivarse

```text
quién aparece
qué información se muestra
qué relación tiene con la organización
qué nivel de detalle es apropiado
```

### Alcance por defecto

```text
CONDICIONAL
```

### No asumir

```text
fotografías
biografías
links sociales
organigrama
```

---

## 7.7 Casos, proyectos o experiencia

### Activar cuando

```text
el trabajo previo demuestra capacidad
el cliente posee evidencia real
la audiencia necesita evaluar experiencia
```

### Debe derivarse

```text
caso
problema
intervención
resultado
evidencia autorizada
```

### Alcance por defecto

```text
CONDICIONAL
```

### No asumir

```text
portfolio
testimonios
logos
resultados cuantificados
```

No inventar evidencia.

---

## 7.8 Certificaciones, premios y acreditaciones

### Activar cuando

```text
existen
son verificables
aportan confianza
son relevantes para la audiencia
```

### Alcance por defecto

```text
CONDICIONAL
```

No inventar ni presentar como vigentes acreditaciones no confirmadas.

---

## 7.9 Contacto

### Activar cuando

```text
una audiencia necesita iniciar comunicación
```

### Posibles mecanismos

```text
formulario
email
teléfono
mensajería
agenda
datos físicos
canal externo
```

### Debe derivarse

```text
audiencia
motivo
canal
datos necesarios
destino
confirmación
```

### Alcance por defecto

```text
REQUERIDA BAJO CONDICIÓN
```

### No asumir

```text
formulario
email corporativo
WhatsApp
mapa
```

---

## 7.10 Formulario de contacto

### Activar cuando

```text
el contacto se captura dentro del sitio
```

### Debe derivarse

```text
datos
finalidad
destino
validación
confirmación
consentimiento si aplica
```

### Alcance por defecto

```text
CONDICIONAL
```

### No asumir

```text
nombre, email, asunto y mensaje
notificación por email
CRM
```

---

## 7.11 Ubicaciones y sucursales

### Activar cuando

```text
el visitante necesita encontrar una sede
hay varias ubicaciones
la operación depende del lugar
```

### Debe derivarse

```text
dirección
horario
contacto
servicios disponibles
indicaciones relevantes
```

### Alcance por defecto

```text
CONDICIONAL
```

### No asumir

```text
mapa
geolocalización
Google Maps
```

---

## 7.12 Redes y canales externos

### Activar cuando

```text
son canales oficiales
la audiencia los utiliza
el cliente los confirma
```

### Alcance por defecto

```text
CONDICIONAL
```

### No asumir

```text
footer
header
abrir en nueva pestaña
feeds
```

---

## 7.13 Documentos y descargas

### Activar cuando

```text
la audiencia necesita catálogos, reportes, formularios, memorias o materiales
```

### Debe derivarse

```text
documento
audiencia
vigencia
acceso
formato si está definido
```

### Alcance por defecto

```text
CONDICIONAL
```

### No asumir

```text
PDF
CDN
Google Drive
```

---

## 7.14 Noticias, novedades o comunicados

### Activar cuando

```text
la organización publica información periódica
la actualidad institucional es relevante
```

### Debe derivarse

```text
tipo de contenido
responsable
frecuencia
estado
archivo
```

### Alcance por defecto

```text
CONDICIONAL
```

### No asumir

```text
blog
CMS
categorías
comentarios
```

---

## 7.15 Sala de prensa

### Activar cuando

```text
prensa o medios son audiencia
existen comunicados o materiales oficiales
```

### Debe derivarse

```text
material
contacto
vigencia
descarga
```

### Alcance por defecto

```text
CONDICIONAL
```

---

## 7.16 Vacantes y empleos

### Activar cuando

```text
talento es una audiencia
la organización publica búsquedas
la postulación forma parte del sitio
```

### Debe derivarse

```text
vacante
estado
requisitos
acción de postulación
destino
confirmación
```

### Alcance por defecto

```text
CONDICIONAL
```

### No asumir

```text
fecha de cierre
formulario
archivo adjunto
ATS
```

---

## 7.17 Postulación

### Activar cuando

```text
el candidato se postula dentro o desde el sitio
```

### Debe derivarse

```text
datos
documentos
vacante
destino
resultado
privacidad
```

### Alcance por defecto

```text
CONDICIONAL
```

---

## 7.18 Donaciones o colaboración

### Activar cuando

```text
la organización solicita apoyo económico, voluntariado o participación
```

### Debe derivarse

```text
tipo de colaboración
acción
condiciones
resultado
```

### Alcance por defecto

```text
CONDICIONAL
```

### No asumir

```text
pago online
suscripción
monto sugerido
```

Si existe transacción, puede requerir conocimiento e-commerce.

---

## 7.19 Transparencia e información institucional

### Activar cuando

```text
la organización debe publicar autoridades, informes, normativa o rendición
```

### Debe derivarse

```text
información
audiencia
vigencia
frecuencia
responsable
```

### Alcance por defecto

```text
CONDICIONAL
```

---

## 7.20 Navegación y arquitectura de información

### Activar cuando

```text
hay múltiples objetivos
múltiples audiencias
varios grupos de contenido
```

### Debe derivarse

```text
prioridad
relación
rutas de información
puntos de entrada
```

### Alcance por defecto

```text
REQUERIDA BAJO CONDICIÓN
```

### No asumir

```text
Home
Nosotros
Servicios
Contacto
menú superior
footer
hamburger
```

Las páginas y etiquetas finales se derivan del contenido.

---

## 7.21 Búsqueda interna

### Activar cuando

```text
el volumen de contenido lo justifica
el visitante necesita localizar información
```

### Alcance por defecto

```text
CONDICIONAL
```

No asumir por cantidad de páginas.

---

## 7.22 Gestión de contenido

### Activar cuando

```text
el contenido cambia
un actor no técnico debe actualizarlo
hay publicaciones recurrentes
existen vacantes, noticias o documentos
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
Strapi
Sanity
editor
rol Editor
```

---

## 7.23 Multi-idioma

### Activar cuando

```text
existen audiencias con idiomas diferentes
la organización opera en varios mercados
```

### Debe derivarse

```text
idiomas
contenido equivalente
audiencia
prioridad
```

### Alcance por defecto

```text
CONDICIONAL
```

---

## 7.24 SEO y descubrimiento orgánico

### Activar cuando

```text
el sitio debe ser encontrado por actividad, servicio, nombre o temática
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
meta tags
sitemap
robots
keywords
```

El PRD puede definir descubribilidad.

La implementación definirá mecanismos.

---

## 7.25 Representación al compartir

### Activar cuando

```text
el contenido se comparte en redes o mensajería
```

### Alcance por defecto

```text
CONDICIONAL
```

No asumir OG tags como requisito automático.

---

## 7.26 Medición

### Activar cuando

```text
el cliente necesita evaluar visitas, consultas, descargas o comportamiento
```

### Debe derivarse

```text
evento
resultado de negocio
actor que interpreta
```

### Alcance por defecto

```text
CONDICIONAL
```

### No asumir

```text
Google Analytics
dashboard
tracking de todas las páginas
```

---

## 7.27 Portal de clientes o miembros

### Activar cuando

```text
existe acceso privado
hay servicios o información restringida
```

### Alcance por defecto

```text
NO INCLUIR POR DEFECTO
```

Puede ser núcleo explícito, pero entonces debe complementarse con plantilla SaaS o portal.

No asumir login por tratarse de una empresa.

---

## 7.28 Pagos o transacciones

### Activar cuando

```text
la organización cobra, recibe donaciones o procesa pagos dentro del sitio
```

### Alcance por defecto

```text
NO INCLUIR POR DEFECTO
```

Puede ingresar al complete product scope si es explícito.

Debe complementarse con conocimiento e-commerce.

---

## 7.29 Integraciones

### Activar cuando

```text
el flujo depende de CRM, agenda, bolsa de empleo, sistema documental u otra plataforma
```

### Debe derivarse

```text
sistema
dato o acción
momento
resultado
fallo
```

### Alcance por defecto

```text
CONDICIONAL
```

No asumir herramientas concretas.

---

# 8. ACTORES CANDIDATOS

Estos actores son posibilidades del dominio, no roles obligatorios.

## Visitante general

Activa cuando consume información institucional sin una intención especializada.

## Potencial cliente

Activa cuando evalúa servicios, productos o capacidades.

## Cliente actual

Activa cuando busca contacto, soporte o información institucional.

## Socio o proveedor

Activa cuando necesita información de relación institucional o comercial.

## Postulante

Activa cuando vacantes o marca empleadora forman parte del sitio.

## Periodista o medio

Activa cuando existe información de prensa.

## Inversor o financiador

Activa cuando la organización comunica resultados, gobierno o documentación.

## Donante o voluntario

Activa en organizaciones que buscan apoyo o participación.

## Miembro o asociado

Activa en cámaras, asociaciones o instituciones con membresía.

## Responsable de comunicación

Activa cuando mantiene contenido.

## Responsable comercial

Activa cuando recibe consultas u oportunidades.

## Responsable de recursos humanos

Activa cuando gestiona vacantes o postulaciones.

### Regla de actores

No crear actores por costumbre.

Crear un actor solo cuando tenga:

```text
necesidad
información buscada
acción
resultado
```

Un stakeholder que usa herramientas externas puede no ser usuario directo del sitio.

---

# 9. FLUJOS CANDIDATOS

Los siguientes son patrones condicionales.

No deben copiarse automáticamente.

## Descubrimiento institucional

```text
entrada
→ comprensión de la organización
→ acceso a información relevante
→ decisión de continuar o contactar
```

## Evaluación de servicios

```text
audiencia
→ consulta de oferta
→ evaluación de capacidad
→ acción de contacto
```

## Contacto

```text
necesidad
→ selección de canal
→ aporte de información
→ envío
→ confirmación
→ recepción por la organización
```

## Consulta de ubicación

```text
búsqueda de sede
→ consulta de datos
→ elección de canal o visita
```

## Descarga documental

```text
selección de documento
→ verificación de vigencia
→ acceso
```

## Consulta de noticia

```text
listado
→ selección
→ lectura
→ acceso a información relacionada
```

## Postulación

```text
consulta de vacante
→ revisión
→ postulación
→ confirmación
```

## Gestión de contenido

```text
actor autorizado
→ creación o modificación
→ revisión
→ publicación
```

## Participación o colaboración

```text
comprensión de iniciativa
→ selección de forma de participar
→ acción
→ confirmación
```

---

# 10. REGLAS DE NEGOCIO QUE DEBEN DERIVARSE

Para cada sitio corporativo o institucional, revisar si existen reglas sobre:

```text
qué información es oficial
qué audiencias tienen prioridad
qué contenido puede publicarse
quién mantiene contenido
qué canales de contacto existen
qué datos se capturan
qué documentos son vigentes
qué sedes o áreas responden
qué vacantes están activas
qué materiales están autorizados
qué información requiere aprobación
qué idiomas aplican
qué contenido puede descargarse
```

No inventar:

```text
misión
visión
valores
historia
cargos
autoridades
certificaciones
premios
testimonios
casos
fechas
sedes
contactos
políticas
```

Si una regla es necesaria y no puede derivarse, aplicar:

```text
methodology/ambiguity-rules.md
```

---

# 11. PATRONES DE HISTORIAS DE USUARIO

Estos patrones solo se activan cuando existe el requisito correspondiente.

## Comprensión institucional

```text
Como [audiencia],
quiero comprender qué hace [organización],
para decidir si es relevante para mi necesidad.
```

## Consulta de oferta

```text
Como [potencial cliente],
quiero consultar [servicio, producto o programa],
para evaluar si responde a mi necesidad.
```

## Contacto

```text
Como [audiencia],
quiero contactar al área correspondiente,
para iniciar [consulta o relación].
```

## Ubicación

```text
Como [visitante],
quiero consultar dónde y cuándo opera [sede],
para planificar mi contacto o visita.
```

## Documento

```text
Como [audiencia],
quiero acceder a [documento vigente],
para obtener información oficial.
```

## Vacante

```text
Como [postulante],
quiero consultar oportunidades activas,
para decidir si puedo postularme.
```

## Postulación

```text
Como [postulante],
quiero enviar la información requerida,
para participar en el proceso.
```

## Contenido

```text
Como [responsable],
quiero actualizar [contenido],
para mantener vigente la información pública.
```

## Medición

```text
Como [stakeholder],
quiero conocer [resultado],
para evaluar el cumplimiento del objetivo institucional.
```

### Regla

Los patrones no introducen capacidades.

Solo convierten requisitos ya activados en historias.

---

# 12. PATRONES DE CRITERIOS DE ACEPTACIÓN

Los criterios finales deben seguir `base/acceptance-criteria.md`.

## Información institucional

```text
la organización se identifica claramente
la actividad principal puede comprenderse
la información no contradice fuentes oficiales
```

## Servicio o programa

```text
la audiencia identifica qué se ofrece
la audiencia identifica a quién se dirige
la audiencia conoce el siguiente paso
```

## Contacto

```text
el canal corresponde al motivo
los datos obligatorios faltantes impiden enviar
un envío válido produce confirmación
la consulta llega al destino definido
```

## Documento

```text
el documento solicitado está disponible
la versión vigente puede distinguirse
un archivo no disponible produce una respuesta comprensible
```

## Vacante

```text
la vacante activa muestra información necesaria
una vacante cerrada no se presenta como abierta
la postulación válida produce confirmación
```

## Contenido

```text
solo actores autorizados publican
los cambios válidos se reflejan
el contenido retirado deja de mostrarse como vigente
```

## Multi-idioma

```text
el visitante puede acceder al contenido disponible en el idioma correspondiente
el cambio de idioma conserva el contexto cuando aplica
```

No convertir estas frases en criterios finales sin audiencias, contenidos y condiciones reales.

---

# 13. REQUISITOS NO FUNCIONALES RELEVANTES

Incorporar solo cuando exista soporte contextual.

## Claridad institucional

Definir resultados observables:

```text
la organización se identifica
la oferta se comprende
la audiencia encuentra el siguiente paso
```

No usar:

```text
profesional
moderno
elegante
confiable
```

sin traducirlos a expectativas observables.

## Accesibilidad

Aplicar según audiencia y reglas generales.

## Privacidad

Activar cuando se capturan datos.

## Rendimiento

Relacionar con contenido, imágenes, documentos y contexto de uso.

No inventar segundos.

## Compatibilidad

Relacionar con dispositivos y navegadores reales del público.

No asumir mobile-first.

## Disponibilidad

Activar cuando la información es crítica o existe campaña, evento o servicio continuo.

## Actualización

Activar cuando noticias, vacantes, autoridades, documentos o sedes cambian.

## Integridad de contenido

Puede exigir:

```text
información vigente
documentos correctos
enlaces funcionales
contactos reales
```

## Localización

Activar por idioma, mercado, sede o audiencia.

---

# 14. RIESGOS ESPECÍFICOS DEL DOMINIO

Evaluar solo los aplicables.

## Sitio genérico

Riesgo:

```text
copiar Home, Nosotros, Servicios y Contacto sin representar la organización real
```

## Audiencias inventadas

Riesgo:

```text
agregar prensa, inversores o postulantes sin necesidad
```

## Historia o valores ficticios

Riesgo:

```text
rellenar contenido institucional no provisto
```

## Confianza basada en evidencia inexistente

Riesgo:

```text
inventar testimonios, premios, certificaciones o casos
```

## Formulario universal

Riesgo:

```text
capturar datos aunque el contacto ocurra por otro canal
```

## CMS por defecto

Riesgo:

```text
agregar gestión de contenido sin necesidad de actualización autónoma
```

## SEO universal

Riesgo:

```text
forzar estrategia orgánica sin objetivo de descubrimiento
```

## Multi-audiencia artificial

Riesgo:

```text
complicar navegación para visitantes inexistentes
```

## Contenido desactualizado

Riesgo:

```text
vacantes, autoridades, sedes o documentos permanecen como vigentes
```

## Área privada asumida

Riesgo:

```text
agregar portal o login porque la organización tiene clientes
```

## Integración impuesta

Riesgo:

```text
agregar CRM, analytics, mapas o redes sin respaldo
```

## Página por concepto

Riesgo:

```text
convertir cada tema en una página aunque no lo justifique el contenido
```

---

# 15. TRAMPAS DE ALCANCE

No incorporar automáticamente:

```text
Home
Quiénes Somos
Misión
Visión
Valores
Servicios
Contacto
formulario
mapa
footer
redes sociales
SEO
sitemap
robots
OG tags
analytics
equipo
portfolio
casos
testimonios
certificaciones
blog
noticias
vacantes
CMS
multi-idioma
portal de clientes
```

Cada elemento requiere una condición de activación.

No usar frases como:

```text
todo sitio corporativo necesita
es estándar
da credibilidad
es buena práctica
```

Una práctica habitual no es automáticamente un requisito de producto.

---

# 16. CLASIFICACIÓN ORIENTATIVA DE ALCANCE

La clasificación final pertenece a `base/product-scope-rules.md`.

## Requeridas bajo condición

```text
identidad institucional
audiencias
información principal
oferta o actividad
puntos de contacto cuando aplican
arquitectura de información cuando hay múltiples contenidos
```

## Condicionales

```text
historia
misión
visión
valores
equipo
casos
certificaciones
ubicaciones
formulario
documentos
noticias
prensa
vacantes
gestión de contenido
SEO
medición
multi-idioma
integraciones
```

## Opcionales

```text
timeline
recursos complementarios
presentaciones
contenido multimedia
redes sociales
```

## NO INCLUIR POR DEFECTO

```text
portal privado
e-commerce
pagos
CMS complejo
sistema de postulaciones completo
CRM propio
dashboard propio
automatización editorial
personalización por audiencia
```

Una capacidad puede ingresar al complete product scope si es parte explícita del núcleo.

---

# 17. MAPEO DESDE `project-context.md`

## `project_name`

Aporta identidad.

## `purpose`

Define el resultado institucional principal.

## `project_type`

Activa esta plantilla después de normalización.

## `client_profile.audience`

Fuente principal para audiencias.

No inventar audiencias adicionales.

## `client_profile.persona`

Ayuda a definir necesidades de visitantes prioritarios.

## `client_profile.primary_actions`

Fuente autoritativa para acciones como:

```text
informarse
consultar
contactar
descargar
postularse
participar
```

## `client_profile.social_media`

Puede activar canales oficiales.

No obliga a mostrarlos.

## `brand.has_existing_identity`

Indica si existe identidad previa.

No autoriza crear una nueva dentro del PRD.

## `brand.colors`

Aporta contexto visual.

No define comportamiento.

## `brand.visual_style`

Aporta tono y expectativas visuales.

## `brand.reference_url`

Puede aportar referencias de jerarquía, tono o contenidos.

No debe copiarse.

## `complete_product_scope.must_have_features`

Fuente autoritativa de prioridad de construccion.

## `scale.expected_volume`

Puede influir en:

```text
búsqueda
gestión de contenido
documentos
robustez de contacto
```

No autoriza umbrales inventados.

---

# 18. PROTOCOLO DE GENERACIÓN CORPORATE

Después de seleccionar esta plantilla:

```text
1. Identificar la variante institucional.
2. Identificar la organización.
3. Identificar audiencias.
4. Identificar necesidades por audiencia.
5. Identificar información oficial necesaria.
6. Identificar acciones y puntos de contacto.
7. Revisar capacidades del dominio.
8. Activar solo capacidades cuya condición exista.
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
template = project-types/corporate/prd-template.md
corporate_variant
organization_type
primary_audiences
secondary_audiences
institutional_goals
contact_models
content_ownership
activated_capabilities
rejected_capabilities
conditional_capabilities
scope_decisions
ambiguity_resolutions
unsupported_patterns_not_added
```

Ejemplo conceptual:

```markdown
## Corporate Template Decisions

- Variant: professional services company
- Primary audience: potential business clients
- Secondary audience: none declared
- Activated:
  - institutional identity;
  - service information;
  - direct contact;
  - case studies, because real approved cases are available.
- Not activated:
  - team page;
  - blog;
  - careers;
  - CMS;
  - client portal;
  - analytics.
```

No crear otro archivo para estas decisiones.

---

# 20. VALIDACIÓN ESPECÍFICA CORPORATE

Antes de aceptar el PRD, comprobar:

```text
[ ] La variante institucional está justificada.
[ ] La organización está identificada.
[ ] Las audiencias provienen del contexto.
[ ] Cada audiencia tiene una necesidad real.
[ ] La información principal responde al propósito.
[ ] Los puntos de contacto están justificados.
[ ] No se impuso formulario.
[ ] No se inventaron misión, visión, valores o historia.
[ ] No se inventaron equipo, autoridades o cargos.
[ ] No se inventaron casos, logos, testimonios o certificaciones.
[ ] No se forzaron Home, Nosotros, Servicios o Contacto como páginas.
[ ] SEO existe solo si la descubribilidad es relevante.
[ ] CMS existe solo si hay actualización autónoma.
[ ] Vacantes existen solo si talento es audiencia.
[ ] No se asumió portal de clientes.
[ ] No se asumieron analytics o CRM.
[ ] No se inventaron umbrales de rendimiento.
[ ] No hay decisiones técnicas.
[ ] No existe un Implementation Plan.
[ ] No se duplicó la estructura de prd-base.md.
[ ] Los elementos opcionales no inflaron el complete product scope.
```

Hallazgos posibles, además de los generales:

```text
PRD_CORPORATE_AUDIENCE_INVENTED
PRD_CORPORATE_PAGE_STRUCTURE_ASSUMED
PRD_CORPORATE_FORM_ASSUMED
PRD_CORPORATE_CONTENT_INVENTED
PRD_CORPORATE_CREDENTIAL_INVENTED
PRD_CORPORATE_CMS_ASSUMED
PRD_CORPORATE_SEO_ASSUMED
PRD_CORPORATE_PRIVATE_PORTAL_ASSUMED
PRD_CORPORATE_CONTENT_OWNER_UNDEFINED
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
definir páginas obligatorias
definir menú obligatorio
definir footer obligatorio
definir formulario obligatorio
definir email como canal
definir Google Analytics
definir CMS concreto
definir meta tags específicos
definir sitemap
definir robots
definir anchos de pantalla
definir tiempos de carga
definir contenido ficticio
definir roles internos sin fuente
definir portal de clientes
definir ausencia de pagos como regla universal
```

---

# 22. INTEGRACIÓN

Invocado por:

```text
prd-spec-generator
```

Condición:

```text
normalized_project_type == "corporate"
```

También puede cubrir alias como:

```text
institutional
institucional
sitio corporativo
sitio empresarial
ONG
fundación
```

cuando `template-registry.json` los normalice a `corporate`.

`startup` no debe normalizarse automáticamente a `corporate`.

Debe evaluarse si el objetivo real corresponde a `corporate`, `landing` o `saas`.

No escribe archivos directamente.

No modifica `prd.md`.

No es leído obligatoriamente por `prd-validation-gate` durante un PASS normal.

Puede ser consultado en reparación cuando el hallazgo se relaciona con audiencias,
contenido, confianza o alcance específico del dominio corporativo.

---

# 23. REGLA FINAL

No conviertas una organización real en un sitio corporativo genérico.

Usa esta plantilla para comprender:

```text
quién es la organización
a quién necesita informar
qué debe comunicar
qué acciones debe habilitar
```

Cuando una capacidad común no está respaldada por el contexto:

```text
no la agregues
```

Cuando una capacidad es necesaria para representar correctamente a la organización:

```text
actívala en su forma mínima
registra la razón
mantén neutralidad técnica
```
