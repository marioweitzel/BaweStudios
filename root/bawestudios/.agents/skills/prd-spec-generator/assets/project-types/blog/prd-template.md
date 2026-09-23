---
name: blog-cms-prd-template
description: |
  Plantilla interna de conocimiento de dominio para blogs, publicaciones editoriales
  y sistemas de gestión de contenido. Ayuda a prd-spec-generator a detectar modelos
  editoriales, actores, ciclos de publicación, organización, descubrimiento, distribución
  y límites del producto sin convertir categorías, etiquetas, SEO, RSS, suscripciones,
  roles o herramientas de edición en requisitos obligatorios.
allowed-tools: [Read]
applyTo: ["**/project-context.md", "**/prd.md"]
bawe_network_role: prd-domain-template
bawe_dependencies_on:
  - {skill: prd-spec-generator, relation_type: invocado-por}
bawe_depended_by: []
---

# BAWE PRD DOMAIN TEMPLATE — Blog / CMS

Version: 1.0  
Status: Stable domain template

## 1. PROPÓSITO

Este archivo aporta conocimiento específico del dominio editorial, blog y CMS a
`prd-spec-generator`.

No es un PRD terminado.

No define la estructura final de `prd.md`.

No contiene módulos o flujos que deban copiarse automáticamente.

No autoriza al generador a inventar artículos, categorías, etiquetas, autores, búsqueda,
SEO, RSS, newsletter, comentarios, rich text, estados editoriales, páginas de autor,
slugs, analytics, paywall ni integraciones externas.

Su función es ayudar al LLM a responder:

```text
¿Qué tipo de contenido se publica?
¿Quién lo crea, revisa, publica y consume?
¿Qué ciclo editorial existe?
¿Cómo se organiza y descubre el contenido?
¿Qué debe conservarse a lo largo del tiempo?
¿Qué canales de distribución forman parte del producto?
¿Qué reglas de acceso, vigencia y publicación deben definirse?
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
project_type = blog
```

La normalización puede provenir de términos como:

```text
blog
cms
sitio editorial
medio digital
revista online
portal de noticias
base de conocimiento
documentación
tutoriales
publicación de contenido
newsletter con archivo web
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
→ necesidad editorial o de lectura
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
crear contenido
publicar contenido
mantener contenido
consultar contenido
organizar publicaciones
descubrir información
distribuir publicaciones
gestionar un ciclo editorial
conservar un archivo histórico
```

Ejemplos compatibles:

- blog personal;
- blog de nicho;
- blog corporativo;
- medio digital;
- revista online;
- portal de noticias;
- sitio de tutoriales;
- base de conocimiento;
- documentación de producto;
- centro de recursos;
- newsletter con archivo web;
- plataforma editorial con múltiples autores;
- repositorio de contenido actualizado periódicamente.

---

# 4. CUÁNDO NO APLICARLA

No aplicar como plantilla principal cuando el producto es esencialmente:

```text
un sitio corporativo con noticias secundarias
una landing con pocos artículos de apoyo
un portfolio
un e-commerce
un SaaS operativo
un foro o red social
un repositorio documental sin publicación editorial
un portal privado cuyo contenido es auxiliar
```

La existencia de una sección “Noticias” no convierte automáticamente un sitio en Blog/CMS.

Debe existir una necesidad central de:

```text
publicar
gestionar
consultar
o distribuir contenido de forma recurrente
```

---

# 5. VARIANTES BLOG / CMS SOPORTADAS

Antes de derivar capacidades, clasificar la variante predominante.

Puede existir más de una, pero debe identificarse una principal.

## 5.1 Blog personal o de nicho

Señales:

```text
un autor principal
voz editorial definida
publicación periódica
audiencia temática
```

Valor típico:

```text
publicar conocimiento u opinión de forma propia
```

Puede no necesitar:

```text
roles
revisión
workflow complejo
página de autor
```

## 5.2 Blog corporativo

Señales:

```text
empresa
contenido educativo
inbound
marca
generación de confianza
```

Valor típico:

```text
atraer y educar audiencias vinculadas al negocio
```

No asumir que SEO es el único canal.

## 5.3 Medio digital o revista

Señales:

```text
múltiples autores
secciones
volumen alto
actualidad
edición
revisión
```

Valor típico:

```text
publicar contenido frecuente con coordinación editorial
```

Puede requerir:

```text
roles
estados
agenda
destacados
archivo
```

No asumir comentarios ni publicidad.

## 5.4 Portal de noticias

Señales:

```text
actualidad
publicación frecuente
categorías temáticas
fecha y vigencia
```

Valor típico:

```text
informar sobre hechos recientes
```

Puede requerir diferenciación entre contenido vigente, actualizado y archivado.

## 5.5 Documentación o base de conocimiento

Señales:

```text
guías
procedimientos
referencias
versiones
búsqueda
estructura jerárquica
```

Valor típico:

```text
permitir encontrar y aplicar información confiable
```

No asumir orden cronológico.

## 5.6 Sitio de tutoriales o aprendizaje

Señales:

```text
pasos
series
niveles
práctica
contenido relacionado
```

Valor típico:

```text
guiar al lector hacia un resultado
```

Puede requerir secuencias o prerrequisitos.

## 5.7 Newsletter con archivo web

Señales:

```text
suscripción
envíos
ediciones
archivo
email como canal principal
```

Valor típico:

```text
distribuir publicaciones directamente y conservarlas en web
```

No asumir que el sitio envía campañas si solo aloja el archivo.

## 5.8 Centro de recursos

Señales:

```text
artículos
guías
documentos
videos
descargas
múltiples formatos
```

Valor típico:

```text
organizar materiales útiles para una audiencia
```

Puede requerir taxonomía o filtros, pero no se asume.

## 5.9 CMS interno o desacoplado

Señales:

```text
editores
contenido distribuido a otro canal
gestión central
sin experiencia pública propia
```

Valor típico:

```text
crear y gobernar contenido para otros productos
```

No asumir frontend editorial público.

## 5.10 Contenido premium

Señales:

```text
acceso restringido
suscripción
membresía
pago
contenido exclusivo
```

Valor típico:

```text
monetizar o segmentar acceso
```

Debe complementarse con reglas de identidad, acceso y comercio cuando corresponda.

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
crear, publicar o consumir contenido.

## 6.2 Condicional

La capacidad puede ser necesaria, pero depende del modelo editorial.

## 6.3 Opcional

Puede mejorar descubrimiento, lectura o distribución, pero no entra al complete product scope sin justificación.

## 6.4 NO INCLUIR POR DEFECTO

Se excluye salvo que sea parte explícita del núcleo editorial.

La clasificación final pertenece a `base/product-scope-rules.md`.

---

# 7. CAPACIDADES DEL DOMINIO

## 7.1 Unidad de contenido

### Activar cuando

```text
siempre
```

### Puede representar

```text
artículo
noticia
guía
tutorial
entrada
edición
documento
recurso
página
```

### Debe derivarse

```text
tipo
campos necesarios
contenido principal
autoría
estado
fecha relevante
vigencia
```

### Alcance por defecto

```text
REQUERIDA BAJO CONDICIÓN
```

### No asumir

```text
artículo
autor
fecha
categoría
imagen de portada
```

---

## 7.2 Creación de contenido

### Activar cuando

```text
alguien crea contenido dentro del producto
```

### Debe derivarse

```text
actor
tipo de contenido
información obligatoria
estado inicial
resultado
```

### Alcance por defecto

```text
REQUERIDA BAJO CONDICIÓN
```

### No asumir

```text
rich text
Markdown
editor visual
bloques
subida de imágenes
```

---

## 7.3 Edición

### Activar cuando

```text
el contenido puede modificarse después de crearse
```

### Debe derivarse

```text
quién puede editar
en qué estados
qué ocurre con contenido publicado
qué información debe conservarse
```

### Alcance por defecto

```text
REQUERIDA BAJO CONDICIÓN
```

### No asumir historial de versiones.

---

## 7.4 Publicación

### Activar cuando

```text
el contenido pasa de no visible a visible
```

### Debe derivarse

```text
actor
condiciones
estado
momento
resultado
```

### Alcance por defecto

```text
REQUERIDA BAJO CONDICIÓN
```

### No asumir

```text
publicación inmediata
fecha
URL
indexación
```

---

## 7.5 Estados editoriales

### Activar cuando

```text
el contenido atraviesa más de una etapa
hay revisión
hay programación
hay archivo
```

### Posibles estados

```text
borrador
en revisión
aprobado
programado
publicado
retirado
archivado
```

### Alcance por defecto

```text
CONDICIONAL
```

### No asumir una secuencia universal.

Los estados deben representar el proceso real.

---

## 7.6 Revisión y aprobación

### Activar cuando

```text
una persona crea y otra aprueba
hay control editorial
hay contenido sensible
```

### Debe derivarse

```text
quién revisa
qué valida
qué resultado produce
qué ocurre ante rechazo
```

### Alcance por defecto

```text
CONDICIONAL
```

---

## 7.7 Programación de publicación

### Activar cuando

```text
el contenido debe publicarse en una fecha futura
```

### Alcance por defecto

```text
CONDICIONAL
```

No asumir zona horaria ni automatización específica.

---

## 7.8 Retiro, despublicación o archivo

### Activar cuando

```text
el contenido deja de mostrarse como vigente
debe conservarse
debe retirarse
```

### Debe derivarse

```text
quién puede hacerlo
qué ocurre con el acceso
qué ocurre con enlaces existentes
cómo se marca la vigencia
```

### Alcance por defecto

```text
CONDICIONAL
```

### No asumir

```text
URL permanente
redirección
archivo público
```

---

## 7.9 Identidad pública del contenido

### Activar cuando

```text
cada contenido necesita una referencia propia
```

### Puede incluir

```text
título
ruta
fecha
autor
resumen
imagen
```

### Alcance por defecto

```text
REQUERIDA BAJO CONDICIÓN
```

### No asumir

```text
slug
URL inmutable
fecha visible
autor visible
```

---

## 7.10 Autoría

### Activar cuando

```text
la identidad del creador o responsable es relevante
hay múltiples autores
la confianza depende de la firma
```

### Debe derivarse

```text
autor visible
autor interno
bio
responsabilidad
relación con el contenido
```

### Alcance por defecto

```text
CONDICIONAL
```

### No asumir página de autor.

---

## 7.11 Múltiples autores

### Activar cuando

```text
más de una persona crea contenido
hay colaboración editorial
```

### Alcance por defecto

```text
CONDICIONAL
```

No asumir roles diferentes solo por cantidad de autores.

---

## 7.12 Roles editoriales

### Activar cuando

```text
actores distintos tienen responsabilidades diferentes
```

### Posibles responsabilidades

```text
crear
editar
revisar
aprobar
publicar
retirar
administrar taxonomía
```

### Alcance por defecto

```text
CONDICIONAL
```

### No asumir

```text
Admin
Editor
Autor
Colaborador
```

Los roles se derivan del flujo real.

---

## 7.13 Listado o índice

### Activar cuando

```text
hay múltiples contenidos
el lector necesita explorar
```

### Debe derivarse

```text
qué contenidos aparecen
cómo se priorizan
qué información se muestra
cómo se accede al detalle
```

### Alcance por defecto

```text
REQUERIDA BAJO CONDICIÓN
```

### No asumir

```text
orden cronológico
paginación
home
tarjetas
```

---

## 7.14 Detalle de contenido

### Activar cuando

```text
el contenido requiere una vista completa o propia
```

### Alcance por defecto

```text
REQUERIDA BAJO CONDICIÓN
```

No asumir URL pública si el contenido se consume dentro de otra experiencia.

---

## 7.15 Taxonomía

### Activar cuando

```text
el volumen o diversidad requiere organización
los lectores exploran por tema
los editores clasifican contenido
```

### Posibles modelos

```text
categorías
etiquetas
secciones
series
temas
niveles
tipos
```

### Alcance por defecto

```text
CONDICIONAL
```

### No asumir categorías y tags simultáneamente.

---

## 7.16 Jerarquía documental

### Activar cuando

```text
el contenido depende de una estructura padre-hijo
hay capítulos
hay documentación
hay manuales
```

### Alcance por defecto

```text
CONDICIONAL
```

---

## 7.17 Series y secuencias

### Activar cuando

```text
los contenidos deben consumirse en orden
forman un curso o serie
```

### Debe derivarse

```text
orden
prerrequisitos
siguiente paso
finalización
```

### Alcance por defecto

```text
CONDICIONAL
```

---

## 7.18 Búsqueda

### Activar cuando

```text
el lector necesita localizar contenido
el volumen lo justifica
la estructura no alcanza
```

### Debe derivarse

```text
qué se busca
qué campos intervienen
qué resultados se muestran
qué ocurre sin coincidencias
```

### Alcance por defecto

```text
CONDICIONAL
```

### No asumir

```text
texto completo
relevancia avanzada
respuesta menor a un segundo
```

---

## 7.19 Filtros y navegación temática

### Activar cuando

```text
hay atributos útiles para reducir resultados
```

### Alcance por defecto

```text
CONDICIONAL
```

No asumir por cantidad de contenido.

---

## 7.20 Contenido destacado

### Activar cuando

```text
la línea editorial necesita priorizar publicaciones
hay actualidad
hay campañas
```

### Debe derivarse

```text
quién destaca
criterio
duración
resultado
```

### Alcance por defecto

```text
CONDICIONAL
```

---

## 7.21 Contenido relacionado

### Activar cuando

```text
ayuda a continuar una lectura
hay relación temática explícita
```

### Alcance por defecto

```text
OPCIONAL
```

### No asumir recomendaciones automáticas.

---

## 7.22 Suscripción

### Activar cuando

```text
el lector puede registrarse para recibir contenido o novedades
```

### Debe derivarse

```text
dato
finalidad
confirmación
preferencia
baja
destino
```

### Alcance por defecto

```text
CONDICIONAL
```

### No asumir

```text
email
double opt-in
newsletter
```

---

## 7.23 Newsletter

### Activar cuando

```text
el producto incluye distribución periódica directa
```

### Diferenciar

```text
captura de suscriptores
envío de campañas
archivo web
preferencias
```

### Alcance por defecto

```text
CONDICIONAL
```

### No asumir herramienta externa.

---

## 7.24 RSS o sindicación

### Activar cuando

```text
la audiencia o integraciones consumen contenido mediante feed
el cliente lo solicita
```

### Alcance por defecto

```text
OPCIONAL
```

### No asumir RSS ni cantidad de elementos.

---

## 7.25 SEO y descubrimiento orgánico

### Activar cuando

```text
el contenido debe encontrarse en buscadores
la adquisición orgánica es relevante
```

### Debe derivarse

```text
audiencia
intención
contenido indexable
representación
resultado esperado
```

### Alcance por defecto

```text
CONDICIONAL
```

### No asumir

```text
meta title
meta description
OG image
sitemap
slug
```

El PRD define descubribilidad.

La implementación define mecanismos.

---

## 7.26 Representación al compartir

### Activar cuando

```text
el contenido se distribuye en redes o mensajería
```

### Alcance por defecto

```text
CONDICIONAL
```

No asumir botones de compartir.

---

## 7.27 Comentarios

### Activar cuando

```text
la conversación de lectores forma parte del valor
```

### Debe derivarse

```text
quién comenta
moderación
visibilidad
edición
reporte
```

### Alcance por defecto

```text
NO INCLUIR POR DEFECTO
```

No asumir integración externa.

---

## 7.28 Moderación

### Activar cuando

```text
hay comentarios, contribuciones o contenido de terceros
```

### Alcance por defecto

```text
CONDICIONAL
```

---

## 7.29 Contenido premium o restringido

### Activar cuando

```text
parte del contenido requiere cuenta, membresía o pago
```

### Debe derivarse

```text
quién accede
condición
contenido protegido
vista parcial
resultado ante acceso no autorizado
```

### Alcance por defecto

```text
NO INCLUIR POR DEFECTO
```

Puede ser núcleo explícito.

---

## 7.30 Migración de contenido

### Activar cuando

```text
existe contenido en otra plataforma
debe conservarse
```

### Debe derivarse

```text
origen
volumen
tipos
metadatos
relaciones
enlaces
vigencia
```

### Alcance por defecto

```text
CONDICIONAL
```

### No asumir WordPress, Medium u otra fuente.

---

## 7.31 Medios y archivos

### Activar cuando

```text
el contenido utiliza imágenes, audio, video o documentos
```

### Debe derivarse

```text
tipo
uso
autoría
accesibilidad
límites
```

### Alcance por defecto

```text
CONDICIONAL
```

### No asumir compresión, hosting ni galería.

---

## 7.32 Vista previa

### Activar cuando

```text
el editor necesita revisar antes de publicar
```

### Alcance por defecto

```text
CONDICIONAL
```

---

## 7.33 Historial de cambios

### Activar cuando

```text
se necesita trazabilidad
hay varios editores
hay contenido sensible
```

### Alcance por defecto

```text
NO INCLUIR POR DEFECTO
```

---

## 7.34 Analítica de contenido

### Activar cuando

```text
el negocio necesita evaluar lectura, alcance o conversión
```

### Debe derivarse

```text
métrica
decisión
actor
evento
```

### Alcance por defecto

```text
CONDICIONAL
```

### No asumir

```text
Google Analytics
vistas
tiempo
scroll depth
```

---

## 7.35 Multi-idioma

### Activar cuando

```text
hay audiencias con idiomas distintos
el contenido se publica en varios idiomas
```

### Debe derivarse

```text
idiomas
equivalencia
estado por idioma
responsabilidad
```

### Alcance por defecto

```text
CONDICIONAL
```

---

## 7.36 Accesibilidad editorial

### Activar cuando

```text
siempre como consideración general
```

Debe considerar, cuando corresponda:

```text
estructura comprensible
texto alternativo
lectura
navegación
contraste
contenido multimedia accesible
```

No convertir estándares concretos en requisitos sin el contrato general correspondiente.

---

# 8. ACTORES CANDIDATOS

Estos actores son posibilidades del dominio, no roles obligatorios.

## Lector

Activa cuando consume contenido.

## Suscriptor

Activa cuando mantiene una relación de distribución.

## Autor

Activa cuando crea contenido y su identidad es relevante.

## Colaborador

Activa cuando crea contenido sin autoridad final.

## Editor

Activa cuando revisa, ajusta o publica.

## Revisor

Activa cuando valida antes de publicación.

## Responsable editorial

Activa cuando define prioridades, secciones o política.

## Administrador de contenido

Activa cuando mantiene estructura, usuarios o configuración editorial.

## Moderador

Activa cuando existe contenido de terceros.

## Responsable de marketing

Activa cuando la publicación sirve adquisición o medición.

### Regla de actores

No crear dos actores cuando una sola persona cumple ambas funciones y el producto no
diferencia permisos.

Crear un actor solo cuando tenga:

```text
objetivo
responsabilidad
acción
permiso o resultado diferenciado
```

---

# 9. FLUJOS CANDIDATOS

Los siguientes son patrones condicionales.

No deben copiarse automáticamente.

## Creación y publicación simple

```text
creación
→ edición
→ publicación
→ disponibilidad
```

## Publicación con revisión

```text
creación
→ envío a revisión
→ aprobación o rechazo
→ publicación
```

## Programación

```text
preparación
→ selección de fecha
→ validación
→ publicación futura
```

## Lectura directa

```text
entrada por enlace
→ consumo
→ acción posterior
```

## Exploración

```text
índice
→ filtro o sección
→ selección
→ lectura
```

## Búsqueda

```text
consulta
→ resultados
→ selección
→ lectura
```

## Suscripción

```text
captura
→ confirmación si aplica
→ activación
→ distribución
→ baja
```

## Actualización

```text
selección de contenido
→ edición
→ revisión
→ actualización
```

## Retiro o archivo

```text
selección
→ decisión
→ retiro o archivo
→ comportamiento de acceso
```

## Migración

```text
inventario
→ transformación
→ importación
→ validación
→ publicación o archivo
```

---

# 10. REGLAS DE NEGOCIO QUE DEBEN DERIVARSE

Para cada Blog/CMS, revisar si existen reglas sobre:

```text
qué tipos de contenido existen
quién crea
quién edita
quién publica
qué estados existen
qué contenido es público
qué contenido está restringido
cómo se organiza
qué información identifica cada publicación
qué ocurre al actualizar contenido publicado
qué ocurre al retirar o archivar
qué debe mantenerse vigente
qué canales distribuyen contenido
qué datos se capturan de lectores
qué derechos existen sobre medios y textos
qué frecuencia o agenda aplica
```

No inventar:

```text
estados
roles
categorías
etiquetas
slugs
fechas
SEO
periodicidad
autores
políticas
suscripciones
métricas
```

Si una regla es necesaria para el flujo principal y no puede derivarse, aplicar:

```text
methodology/ambiguity-rules.md
```

---

# 11. PATRONES DE HISTORIAS DE USUARIO

Estos patrones solo se activan cuando existe el requisito correspondiente.

## Lectura

```text
Como [lector],
quiero consultar [contenido],
para obtener [resultado].
```

## Exploración

```text
Como [lector],
quiero explorar contenido por [criterio],
para encontrar información relevante.
```

## Búsqueda

```text
Como [lector],
quiero buscar [tema],
para localizar contenido específico.
```

## Creación

```text
Como [autor o editor],
quiero crear [tipo de contenido],
para preparar una nueva publicación.
```

## Revisión

```text
Como [revisor],
quiero evaluar [contenido],
para aprobarlo o solicitar cambios.
```

## Publicación

```text
Como [actor autorizado],
quiero publicar [contenido],
para ponerlo a disposición de [audiencia].
```

## Actualización

```text
Como [actor autorizado],
quiero actualizar [contenido],
para mantenerlo vigente.
```

## Suscripción

```text
Como [lector],
quiero suscribirme a [distribución],
para recibir [contenido o aviso].
```

## Gestión de taxonomía

```text
Como [responsable editorial],
quiero mantener [clasificación],
para organizar el contenido de forma coherente.
```

## Migración

```text
Como [responsable],
quiero conservar [contenido existente],
para no perder el archivo previo.
```

### Regla

Los patrones no introducen capacidades.

Solo convierten requisitos ya activados en historias.

---

# 12. PATRONES DE CRITERIOS DE ACEPTACIÓN

Los criterios finales deben seguir `base/acceptance-criteria.md`.

## Contenido publicado

```text
el contenido publicado está disponible para la audiencia definida
el contenido no publicado no se presenta como público
la información obligatoria está completa antes de publicar
```

## Edición

```text
solo actores autorizados modifican
los cambios válidos se reflejan
un cambio inválido no reemplaza contenido válido
```

## Revisión

```text
el contenido enviado a revisión puede aprobarse o rechazarse
el resultado queda visible para el actor correspondiente
un contenido rechazado no se publica
```

## Taxonomía

```text
el contenido puede asociarse a clasificaciones válidas
una clasificación retirada no se presenta como vigente
el lector puede consultar contenido por la clasificación activada
```

## Búsqueda

```text
una consulta válida devuelve coincidencias relevantes
la ausencia de resultados se comunica
el contenido no visible no aparece para el lector público
```

## Suscripción

```text
una suscripción válida produce confirmación
una dirección inválida no se activa
la baja impide futuras distribuciones
```

## Archivo o retiro

```text
el contenido retirado deja de presentarse como vigente
el comportamiento de acceso coincide con la regla definida
```

## Migración

```text
los contenidos requeridos se conservan
las relaciones necesarias permanecen
los elementos inválidos se reportan
```

No convertir estas frases en criterios finales sin actores, contenido y reglas reales.

---

# 13. REQUISITOS NO FUNCIONALES RELEVANTES

Incorporar solo cuando exista soporte contextual.

## Legibilidad

Puede requerir:

```text
estructura clara
jerarquía comprensible
contenido legible
ausencia de obstáculos innecesarios
```

No inventar tamaños tipográficos.

## Accesibilidad

Aplicar según reglas generales y audiencia.

## Rendimiento

Relacionar con:

```text
volumen
medios
lectura
búsqueda
frecuencia
```

No inventar segundos ni scores.

## Descubribilidad

Activar cuando el canal orgánico o interno es relevante.

## Integridad editorial

Puede requerir:

```text
contenido vigente
autoría correcta
estados coherentes
clasificación válida
```

## Privacidad

Activar cuando se capturan suscriptores o lectores identificados.

## Disponibilidad

Activar cuando la publicación es crítica o frecuente.

## Preservación de enlaces

Activar cuando existen enlaces externos, migración o archivo histórico.

No asumir URL inmutable sin contexto.

## Escalabilidad editorial

Relacionar con volumen de autores, publicaciones y frecuencia.

No usar para diseñar arquitectura.

---

# 14. RIESGOS ESPECÍFICOS DEL DOMINIO

Evaluar solo los aplicables.

## CMS genérico

Riesgo:

```text
forzar artículos, categorías, tags y autores sin representar el contenido real
```

## Workflow inventado

Riesgo:

```text
crear revisión, aprobación o archivo sin proceso editorial
```

## SEO como requisito universal

Riesgo:

```text
forzar metadatos, sitemap y URLs aunque el contenido sea privado o interno
```

## Suscripción asumida

Riesgo:

```text
capturar emails sin estrategia de distribución
```

## Taxonomía excesiva

Riesgo:

```text
crear categorías y etiquetas redundantes
```

## Búsqueda prematura

Riesgo:

```text
agregar buscador con poco contenido
```

## Roles innecesarios

Riesgo:

```text
separar Autor, Editor y Admin cuando una sola persona opera el producto
```

## Contenido sin vigencia

Riesgo:

```text
publicaciones desactualizadas permanecen como actuales
```

## Migración subestimada

Riesgo:

```text
perder rutas, relaciones, autores o medios
```

## URL permanente asumida

Riesgo:

```text
convertir una decisión técnica o SEO en regla universal
```

## Métricas inventadas

Riesgo:

```text
fijar vistas, tiempos o rendimiento sin fuente
```

## Rich text universal

Riesgo:

```text
elegir una experiencia de edición antes de conocer tipos de contenido
```

## Newsletter confundido con suscripción

Riesgo:

```text
capturar suscriptores sin capacidad de distribución definida
```

---

# 15. TRAMPAS DE ALCANCE

No incorporar automáticamente:

```text
artículos
home cronológica
categorías
tags
autor
página de autor
búsqueda
SEO
RSS
suscripción
double opt-in
newsletter
comentarios
artículos relacionados
tiempo de lectura
social sharing
dark mode
paywall
analytics
editor rich text
preview
programación
múltiples roles
```

Cada elemento requiere una condición de activación.

No usar frases como:

```text
todo blog necesita
todo CMS necesita
es estándar
mejora SEO
es buena práctica
```

Una práctica común no es automáticamente un requisito de producto.

---

# 16. CLASIFICACIÓN ORIENTATIVA DE ALCANCE

La clasificación final pertenece a `base/product-scope-rules.md`.

## Requeridas bajo condición

```text
unidad de contenido
creación
edición
publicación
consumo
identidad del contenido
listado cuando hay múltiples contenidos
```

## Condicionales

```text
estados
revisión
programación
autoría
múltiples autores
taxonomía
jerarquía
búsqueda
filtros
suscripción
newsletter
SEO
medios
migración
multi-idioma
analítica
```

## Opcionales

```text
contenido relacionado
RSS
social sharing
tiempo de lectura
modo de lectura
```

## NO INCLUIR POR DEFECTO

```text
comentarios
moderación
paywall
historial completo
recomendaciones avanzadas
newsletter con campañas complejas
personalización
podcast hosting
video hosting
analytics propio
```

Una capacidad puede ingresar al complete product scope si es parte explícita del núcleo.

---

# 17. MAPEO DESDE `project-context.md`

## `project_name`

Aporta identidad.

## `purpose`

Define el resultado editorial principal.

## `project_type`

Activa esta plantilla después de normalización.

## `client_profile.audience`

Fuente principal para lectores y stakeholders.

## `client_profile.persona`

Ayuda a definir el lector principal.

## `client_profile.primary_actions`

Fuente autoritativa para acciones como:

```text
leer
buscar
explorar
publicar
editar
suscribirse
descargar
```

## `client_profile.social_media`

Puede activar distribución o representación al compartir.

No obliga a botones ni feeds.

## `brand.visual_style`

Aporta tono y expectativas de lectura.

## `complete_product_scope.must_have_features`

Fuente autoritativa de prioridad de construccion.

## `scale.expected_volume`

Puede influir en:

```text
búsqueda
taxonomía
workflow
múltiples autores
migración
rendimiento
```

No autoriza umbrales inventados.

---

# 18. PROTOCOLO DE GENERACIÓN BLOG / CMS

Después de seleccionar esta plantilla:

```text
1. Identificar la variante editorial.
2. Identificar tipos de contenido.
3. Identificar lectores y actores editoriales.
4. Identificar ciclo de vida.
5. Determinar si el contenido es público, privado o mixto.
6. Determinar cómo se organiza y descubre.
7. Determinar canales de distribución.
8. Revisar capacidades del dominio.
9. Activar solo capacidades cuya condición exista.
10. Aplicar ambiguity-rules.md a cada faltante.
11. Derivar flujos completos.
12. Derivar requisitos y reglas.
13. Crear historias y criterios.
14. Clasificar complete product scope, Deferred Scope y Out of Scope.
15. Registrar decisiones y supuestos en prd.md.
16. Renderizar con prd-base.md.
17. Autoevaluar con validation-rules.md.
```

---

# 19. REGISTRO EN `prd.md`

Cuando esta plantilla se use, registrar:

```text
template = project-types/blog/prd-template.md
editorial_variant
content_types
reader_model
editorial_actors
publication_workflow
access_model
organization_model
distribution_channels
activated_capabilities
rejected_capabilities
conditional_capabilities
scope_decisions
ambiguity_resolutions
unsupported_patterns_not_added
```

Ejemplo conceptual:

```markdown
## Blog Template Decisions

- Variant: personal niche blog
- Content type: article
- Editorial actors: one author
- Workflow: create → publish
- Activated:
  - article creation;
  - public listing;
  - article detail;
  - simple topic classification.
- Not activated:
  - multiple roles;
  - review;
  - newsletter;
  - RSS;
  - comments;
  - paywall;
  - analytics.
```

No crear otro archivo para estas decisiones.

---

# 20. VALIDACIÓN ESPECÍFICA BLOG / CMS

Antes de aceptar el PRD, comprobar:

```text
[ ] La variante editorial está justificada.
[ ] Los tipos de contenido están definidos.
[ ] Los lectores provienen del contexto.
[ ] Los actores editoriales provienen del contexto.
[ ] El ciclo de publicación representa el proceso real.
[ ] No se inventaron roles.
[ ] No se forzaron categorías y tags.
[ ] La búsqueda existe solo si está justificada.
[ ] La suscripción existe solo si hay estrategia de distribución.
[ ] RSS no fue asumido.
[ ] SEO existe solo si la adquisición orgánica es relevante.
[ ] No se asumió URL inmutable.
[ ] No se asumió rich text.
[ ] No se inventaron tiempos, cantidades ni scores.
[ ] No se impuso página de autor.
[ ] No se impuso newsletter.
[ ] No se asumieron comentarios.
[ ] No se asumió paywall.
[ ] La migración está contemplada cuando existe contenido previo.
[ ] No hay decisiones técnicas.
[ ] No existe un Implementation Plan.
[ ] No se duplicó la estructura de prd-base.md.
[ ] Los elementos opcionales no inflaron el complete product scope.
```

Hallazgos posibles, además de los generales:

```text
PRD_BLOG_VARIANT_UNSUPPORTED
PRD_BLOG_CONTENT_TYPE_UNDEFINED
PRD_BLOG_ROLE_INVENTED
PRD_BLOG_WORKFLOW_INVENTED
PRD_BLOG_TAXONOMY_ASSUMED
PRD_BLOG_SEARCH_ASSUMED
PRD_BLOG_SUBSCRIPTION_ASSUMED
PRD_BLOG_RSS_ASSUMED
PRD_BLOG_SEO_ASSUMED
PRD_BLOG_EDITOR_ASSUMED
PRD_BLOG_MIGRATION_UNDEFINED
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
definir modelos de datos
definir APIs
definir editor concreto
definir Markdown o rich text
definir slugs
definir endpoints
definir RSS obligatorio
definir double opt-in obligatorio
definir SEO obligatorio
definir categorías y tags obligatorios
definir página de autor
definir tiempos de respuesta
definir Lighthouse
definir tamaños tipográficos
definir cantidad de artículos por página
definir herramientas de email
definir Google Analytics
definir sistema de comentarios externo
```

---

# 22. INTEGRACIÓN

Invocado por:

```text
prd-spec-generator
```

Condición:

```text
normalized_project_type == "blog"
```

También puede cubrir alias como:

```text
cms
blog
medio digital
revista online
documentación
base de conocimiento
newsletter
```

cuando `template-registry.json` los normalice a `blog`.

Si el CMS no tiene experiencia editorial pública y solo sirve como backend de contenido,
el generador debe conservar esa diferencia.

No escribe archivos directamente.

No modifica `prd.md`.

No es leído obligatoriamente por `prd-validation-gate` durante un PASS normal.

Puede ser consultado en reparación cuando el hallazgo se relaciona con workflow,
organización, acceso, distribución o alcance específico del dominio editorial.

---

# 23. REGLA FINAL

No conviertas una necesidad editorial real en un CMS genérico.

Usa esta plantilla para comprender:

```text
qué contenido existe
quién lo gestiona
cómo cambia de estado
cómo lo encuentra y consume la audiencia
```

Cuando una capacidad común no está respaldada por el contexto:

```text
no la agregues
```

Cuando una capacidad es necesaria para que el ciclo editorial sea viable:

```text
actívala en su forma mínima
registra la razón
mantén neutralidad técnica
```
