---
name: portfolio-prd-template
description: |
  Plantilla interna de conocimiento de dominio para portfolios personales,
  profesionales, de estudio o agencia. Ayuda a prd-spec-generator a detectar
  audiencias, tipos de trabajo, evidencias, formas de presentación, contacto,
  actualización y límites del producto sin convertir galerías, filtros, formularios,
  SEO, CV, redes sociales o estructuras visuales en requisitos obligatorios.
allowed-tools: [Read]
applyTo: ["**/project-context.md", "**/prd.md"]
bawe_network_role: prd-domain-template
bawe_dependencies_on:
  - {skill: prd-spec-generator, relation_type: invocado-por}
bawe_depended_by: []
---

# BAWE PRD DOMAIN TEMPLATE — Portfolio

Version: 1.0  
Status: Stable domain template

## 1. PROPÓSITO

Este archivo aporta conocimiento específico del dominio portfolio a
`prd-spec-generator`.

No es un PRD terminado.

No define la estructura final de `prd.md`.

No contiene páginas, secciones, layouts ni módulos que deban copiarse automáticamente.

No autoriza al generador a inventar galerías, filtros, categorías, formularios,
CV, testimonios, logos, redes, SEO, proyectos, tecnologías, clientes, métricas,
animaciones ni paneles de administración.

Su función es ayudar al LLM a responder:

```text
¿Quién o qué se presenta?
¿Ante qué audiencias?
¿Qué evidencia demuestra capacidad?
¿Cómo debe explorarse el trabajo?
¿Qué información necesita cada audiencia?
¿Qué acción final debe poder completar el visitante?
¿Qué contenido debe actualizarse?
¿Qué límites separan el portfolio de un sitio corporativo, una landing o un blog?
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
project_type = portfolio
```

La normalización puede provenir de términos como:

```text
portfolio
portafolio
book profesional
muestra de trabajos
sitio personal profesional
portfolio creativo
portfolio de estudio
showcase
case study site
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
→ necesidad de evaluación o contacto
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
mostrar trabajo previo
demostrar capacidad
presentar experiencia
organizar proyectos
atraer clientes
atraer empleo o colaboración
dar contexto sobre procesos o resultados
centralizar presencia profesional
```

Ejemplos compatibles:

- portfolio personal;
- portfolio de developer;
- portfolio de diseñador;
- portfolio UX/UI;
- portfolio fotográfico;
- portfolio audiovisual;
- portfolio de arquitectura;
- portfolio de arte;
- portfolio de estudio creativo;
- portfolio de agencia;
- portfolio técnico;
- portfolio académico o profesional;
- showcase de casos de trabajo.

---

# 4. CUÁNDO NO APLICARLA

No aplicar como plantilla principal cuando el producto es esencialmente:

```text
un sitio corporativo de empresa
una landing de campaña
un blog
un e-commerce
un SaaS
un directorio de profesionales
una plataforma de contratación
una red social
```

La existencia de imágenes o proyectos no convierte automáticamente un sitio en portfolio.

Debe existir una necesidad central de:

```text
presentar capacidad
mostrar trabajo
permitir evaluación
generar oportunidades
```

Si el foco está en vender servicios de una empresa más que en mostrar obra o experiencia,
puede corresponder mejor la plantilla `corporate`.

---

# 5. VARIANTES PORTFOLIO SOPORTADAS

Antes de derivar capacidades, clasificar la variante predominante.

Puede existir más de una, pero debe identificarse una principal.

## 5.1 Portfolio personal creativo

Señales:

```text
autor individual
obra visual
identidad personal
selección curada
```

Valor típico:

```text
mostrar estilo, calidad y evolución
```

Puede requerir fuerte componente visual.

No asumir filtros ni múltiples categorías.

## 5.2 Portfolio técnico o developer

Señales:

```text
software
proyectos
repositorios
demos
tecnologías
problemas resueltos
```

Valor típico:

```text
demostrar capacidad técnica y criterio
```

No asumir links públicos ni código abierto.

## 5.3 Portfolio UX/UI o diseño

Señales:

```text
casos
proceso
problema
decisiones
resultado
mockups
```

Valor típico:

```text
mostrar pensamiento y ejecución
```

Puede requerir estudios de caso, pero no se asume.

## 5.4 Portfolio fotográfico o audiovisual

Señales:

```text
imágenes
series
reels
videos
producciones
```

Valor típico:

```text
mostrar calidad visual y estilo
```

Puede requerir experiencia media-rich.

No asumir galerías complejas.

## 5.5 Portfolio de arquitectura o producto

Señales:

```text
proyectos
planos
renders
obra construida
procesos
materiales
```

Valor típico:

```text
mostrar resolución espacial o de producto
```

Puede requerir fichas técnicas o contexto.

## 5.6 Portfolio académico o profesional

Señales:

```text
trayectoria
investigación
publicaciones
proyectos
logros
```

Valor típico:

```text
demostrar experiencia y evolución
```

Puede requerir CV, pero no se asume.

## 5.7 Portfolio de estudio o agencia

Señales:

```text
equipo
clientes
casos
servicios
proyectos colectivos
```

Valor típico:

```text
mostrar capacidad conjunta y tipo de trabajos
```

Debe evaluarse si corresponde mejor `corporate`.

## 5.8 Portfolio orientado a empleo

Señales:

```text
reclutadores
posición
habilidades
experiencia
CV
contacto profesional
```

Valor típico:

```text
facilitar evaluación para contratación
```

## 5.9 Portfolio orientado a clientes

Señales:

```text
potenciales clientes
proyectos previos
servicios
consulta
presupuesto
```

Valor típico:

```text
demostrar encaje y facilitar contacto comercial
```

## 5.10 Portfolio de obra única o selección mínima

Señales:

```text
pocos proyectos
una obra central
selección muy curada
```

Valor típico:

```text
dar profundidad antes que volumen
```

Puede no necesitar galería ni filtros.

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
presentar o evaluar el trabajo.

## 6.2 Condicional

La capacidad puede ser relevante, pero depende del tipo de obra, audiencia o volumen.

## 6.3 Opcional

Puede enriquecer la experiencia, pero no entra al complete product scope sin justificación.

## 6.4 NO INCLUIR POR DEFECTO

Se excluye salvo que sea parte explícita del objetivo.

La clasificación final pertenece a `base/product-scope-rules.md`.

---

# 7. CAPACIDADES DEL DOMINIO

## 7.1 Identidad profesional

### Activar cuando

```text
siempre
```

### Debe derivarse

```text
persona, estudio o agencia
disciplina
posicionamiento
audiencia
resultado esperado
```

### Alcance por defecto

```text
REQUERIDA BAJO CONDICIÓN
```

### No asumir

```text
bio extensa
slogan
misión
valores
foto personal
```

---

## 7.2 Unidad de trabajo

### Activar cuando

```text
siempre
```

### Puede representar

```text
proyecto
caso
obra
serie
campaña
producto
pieza
investigación
producción
```

### Debe derivarse

```text
tipo
información necesaria
evidencia
resultado
fecha o contexto cuando aplica
```

### Alcance por defecto

```text
REQUERIDA BAJO CONDICIÓN
```

### No asumir

```text
imagen de portada
categoría
cliente
tecnologías
links
```

---

## 7.3 Selección de trabajos

### Activar cuando

```text
hay múltiples unidades
el propietario necesita decidir qué mostrar
```

### Debe derivarse

```text
criterio de inclusión
orden
prioridad
vigencia
```

### Alcance por defecto

```text
REQUERIDA BAJO CONDICIÓN
```

No asumir que todo trabajo debe publicarse.

---

## 7.4 Listado o galería

### Activar cuando

```text
hay varios trabajos que deben explorarse
```

### Debe derivarse

```text
qué se muestra
cómo se distingue
qué información acompaña
cómo se accede al detalle
```

### Alcance por defecto

```text
REQUERIDA BAJO CONDICIÓN
```

### No asumir

```text
grid
galería
cards
imagen
lista
masonry
```

La representación es decisión de diseño.

---

## 7.5 Detalle de trabajo

### Activar cuando

```text
el proyecto requiere contexto o evidencia adicional
```

### Debe derivarse

```text
problema
rol
proceso
decisiones
resultado
medios
restricciones
```

### Alcance por defecto

```text
CONDICIONAL
```

No asumir que todos los trabajos requieren página propia.

---

## 7.6 Caso de estudio

### Activar cuando

```text
la audiencia necesita comprender proceso, decisiones y resultado
```

### Debe derivarse

```text
contexto
objetivo
rol
proceso
decisiones
resultado
evidencia
```

### Alcance por defecto

```text
CONDICIONAL
```

### No inventar resultados ni métricas.

---

## 7.7 Categorías o tipos

### Activar cuando

```text
el volumen o diversidad requiere organización
la audiencia evalúa por especialidad
```

### Alcance por defecto

```text
CONDICIONAL
```

### No asumir

```text
Web
Mobile
Branding
Fotografía
```

Las categorías provienen del contenido real.

---

## 7.8 Filtros

### Activar cuando

```text
las categorías ayudan a encontrar trabajos relevantes
el volumen lo justifica
```

### Alcance por defecto

```text
CONDICIONAL
```

### No asumir

```text
filtro exclusivo
opción Todos
sin recarga
multi-selección
```

---

## 7.9 Búsqueda

### Activar cuando

```text
el volumen o tipo de contenido lo requiere
```

### Alcance por defecto

```text
OPCIONAL
```

No asumir para portfolios pequeños.

---

## 7.10 Medios visuales

### Activar cuando

```text
la obra requiere imágenes, video, audio, renders o documentos
```

### Debe derivarse

```text
tipo
función
cantidad
accesibilidad
derechos
```

### Alcance por defecto

```text
REQUERIDA BAJO CONDICIÓN
```

### No asumir

```text
galería
slider
lightbox
aspect ratio
optimización concreta
```

---

## 7.11 Links externos

### Activar cuando

```text
existe demo, repositorio, publicación, tienda o perfil relevante
```

### Debe derivarse

```text
destino
propósito
vigencia
relación con el trabajo
```

### Alcance por defecto

```text
CONDICIONAL
```

### No asumir nueva pestaña.

---

## 7.12 Tecnologías, herramientas o métodos

### Activar cuando

```text
son relevantes para la evaluación
la audiencia las necesita
el contexto las provee
```

### Alcance por defecto

```text
CONDICIONAL
```

No inventar stack.

No convertir herramientas en el centro si el valor está en el resultado.

---

## 7.13 Rol y contribución

### Activar cuando

```text
el trabajo fue colaborativo
la autoría necesita aclararse
```

### Debe derivarse

```text
responsabilidad
contribución
equipo
alcance
```

### Alcance por defecto

```text
CONDICIONAL
```

---

## 7.14 Cliente o contexto del proyecto

### Activar cuando

```text
aporta comprensión
hay permiso para mostrarlo
```

### Alcance por defecto

```text
CONDICIONAL
```

### No asumir

```text
nombre de cliente
logo
industria
NDA inexistente
```

---

## 7.15 Resultados y métricas

### Activar cuando

```text
existen resultados verificables
la audiencia los necesita para evaluar impacto
```

### Alcance por defecto

```text
CONDICIONAL
```

### No inventar

```text
porcentajes
conversiones
usuarios
ventas
impacto
```

---

## 7.16 Sobre la persona o estudio

### Activar cuando

```text
la identidad, trayectoria o enfoque influye en la decisión
```

### Puede incluir

```text
bio
trayectoria
enfoque
especialización
ubicación
disponibilidad
```

### Alcance por defecto

```text
CONDICIONAL
```

### No asumir página separada.

---

## 7.17 Servicios

### Activar cuando

```text
el portfolio también busca clientes
la audiencia necesita conocer qué puede contratar
```

### Debe derivarse

```text
servicio
alcance
tipo de cliente
resultado
próximo paso
```

### Alcance por defecto

```text
CONDICIONAL
```

### No asumir precios.

---

## 7.18 Tarifas o pricing

### Activar cuando

```text
el cliente quiere publicar precios
son parte de la decisión
```

### Alcance por defecto

```text
NO INCLUIR POR DEFECTO
```

No asumir paquetes ni tarifas.

---

## 7.19 Contacto

### Activar cuando

```text
el visitante debe iniciar una oportunidad
```

### Posibles mecanismos

```text
formulario
email
mensajería
agenda
red profesional
canal externo
```

### Debe derivarse

```text
audiencia
motivo
canal
datos
resultado
```

### Alcance por defecto

```text
REQUERIDA BAJO CONDICIÓN
```

### No asumir formulario.

---

## 7.20 Formulario de contacto

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
```

### Alcance por defecto

```text
CONDICIONAL
```

### No asumir

```text
nombre
email
asunto
mensaje
notificación por email
```

---

## 7.21 Formulario de presupuesto

### Activar cuando

```text
la consulta requiere datos específicos del proyecto
```

### Debe derivarse

```text
tipo de trabajo
alcance
plazo
presupuesto si aplica
contacto
```

### Alcance por defecto

```text
NO INCLUIR POR DEFECTO
```

---

## 7.22 CV, résumé o brochure

### Activar cuando

```text
la audiencia es reclutamiento
el documento existe
el propietario quiere distribuirlo
```

### Debe derivarse

```text
documento
vigencia
acceso
idioma
```

### Alcance por defecto

```text
CONDICIONAL
```

### No asumir descarga.

---

## 7.23 Perfiles profesionales

### Activar cuando

```text
existen perfiles relevantes y confirmados
```

### Ejemplos posibles

```text
LinkedIn
GitHub
Behance
Dribbble
Vimeo
Instagram profesional
```

### Alcance por defecto

```text
CONDICIONAL
```

No asumir ninguno.

---

## 7.24 Testimonios

### Activar cuando

```text
existen testimonios reales
hay autorización
aportan confianza
```

### Alcance por defecto

```text
OPCIONAL
```

### No exigir cantidad mínima.

---

## 7.25 Logos de clientes o marcas

### Activar cuando

```text
hay autorización
aportan contexto
son verificables
```

### Alcance por defecto

```text
OPCIONAL
```

No inventar.

---

## 7.26 Experiencia o timeline

### Activar cuando

```text
la trayectoria ayuda a evaluar
el recorrido es relevante
```

### Alcance por defecto

```text
CONDICIONAL
```

No asumir cronología visual.

---

## 7.27 Premios, publicaciones o reconocimientos

### Activar cuando

```text
existen
son verificables
aportan valor
```

### Alcance por defecto

```text
CONDICIONAL
```

---

## 7.28 Gestión de contenido

### Activar cuando

```text
el propietario necesita agregar o actualizar trabajos sin intervención técnica
el portfolio cambia con frecuencia
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

### No asumir CMS ni panel.

---

## 7.29 Blog o contenido editorial

### Activar cuando

```text
el profesional publica contenido como parte de su posicionamiento
```

### Alcance por defecto

```text
NO INCLUIR POR DEFECTO
```

Puede requerir plantilla Blog/CMS si es núcleo relevante.

---

## 7.30 Multi-idioma

### Activar cuando

```text
hay audiencias con idiomas distintos
el profesional trabaja en varios mercados
```

### Alcance por defecto

```text
CONDICIONAL
```

---

## 7.31 SEO y descubrimiento orgánico

### Activar cuando

```text
el portfolio debe encontrarse por nombre, disciplina o especialidad
```

### Debe derivarse

```text
audiencia
intención
contenido indexable
resultado
```

### Alcance por defecto

```text
CONDICIONAL
```

### No asumir

```text
meta tags
OG image
sitemap
keywords
```

---

## 7.32 Representación al compartir

### Activar cuando

```text
el portfolio o proyecto se comparte en redes o mensajería
```

### Alcance por defecto

```text
CONDICIONAL
```

---

## 7.33 Medición

### Activar cuando

```text
el propietario necesita evaluar visitas, contactos o interés
```

### Debe derivarse

```text
evento
resultado
decisión
```

### Alcance por defecto

```text
CONDICIONAL
```

### No asumir analytics.

---

## 7.34 Animaciones y motion

### Activar cuando

```text
forman parte del lenguaje profesional
aportan evidencia de capacidad
```

### Alcance por defecto

```text
OPCIONAL
```

No asumir por tipo de portfolio.

---

## 7.35 Modo oscuro o preferencias visuales

### Activar cuando

```text
el cliente lo solicita
forma parte explícita de la identidad
```

### Alcance por defecto

```text
OPCIONAL
```

---

## 7.36 Área privada

### Activar cuando

```text
hay proyectos protegidos
existen trabajos bajo acceso restringido
```

### Alcance por defecto

```text
NO INCLUIR POR DEFECTO
```

No asumir autenticación.

---

# 8. ACTORES CANDIDATOS

Estos actores son posibilidades del dominio, no roles obligatorios.

## Visitante general

Activa cuando explora sin intención especializada.

## Potencial cliente

Activa cuando evalúa encaje para contratar.

## Reclutador o empleador

Activa cuando evalúa para una posición.

## Colaborador o socio

Activa cuando busca cooperación profesional.

## Par profesional

Activa cuando consulta, refiere o comparte.

## Curador, editor o jurado

Activa cuando la obra se evalúa en contextos creativos o académicos.

## Propietario del portfolio

Activa cuando mantiene contenido.

## Responsable de estudio o agencia

Activa cuando el portfolio representa un equipo.

### Regla de actores

No crear audiencias por costumbre.

Crear un actor solo cuando tenga:

```text
objetivo
criterio de evaluación
acción
resultado esperado
```

---

# 9. FLUJOS CANDIDATOS

Los siguientes son patrones condicionales.

No deben copiarse automáticamente.

## Comprender perfil

```text
entrada
→ identidad profesional
→ disciplina
→ decisión de explorar
```

## Explorar trabajos

```text
listado
→ selección
→ detalle
→ evaluación
```

## Filtrar trabajos

```text
criterio
→ resultados
→ selección
```

## Consultar caso

```text
contexto
→ proceso
→ resultado
→ evidencia
```

## Contactar

```text
interés
→ canal
→ aporte de datos
→ envío
→ confirmación
```

## Descargar CV

```text
selección
→ acceso
→ descarga o consulta
```

## Acceder a demo o repositorio

```text
selección
→ destino externo
→ continuidad
```

## Actualizar portfolio

```text
actor autorizado
→ creación o edición
→ revisión
→ publicación
```

## Consultar proyecto protegido

```text
solicitud o identificación
→ validación
→ acceso o rechazo
```

---

# 10. REGLAS DE NEGOCIO QUE DEBEN DERIVARSE

Para cada portfolio, revisar si existen reglas sobre:

```text
qué trabajos se muestran
qué trabajos no se muestran
qué información acompaña cada trabajo
qué clientes pueden nombrarse
qué materiales pueden publicarse
qué links están vigentes
qué audiencia tiene prioridad
qué canal de contacto existe
quién actualiza contenido
qué proyectos requieren acceso restringido
qué idiomas aplican
qué documentos están vigentes
```

No inventar:

```text
proyectos
clientes
resultados
tecnologías
categorías
años de experiencia
testimonios
premios
perfiles
contactos
métricas
```

Si una regla es necesaria y no puede derivarse, aplicar:

```text
methodology/ambiguity-rules.md
```

---

# 11. PATRONES DE HISTORIAS DE USUARIO

Estos patrones solo se activan cuando existe el requisito correspondiente.

## Identidad profesional

```text
Como [audiencia],
quiero comprender quién es [profesional o estudio],
para decidir si su perfil es relevante.
```

## Exploración

```text
Como [audiencia],
quiero explorar [trabajos],
para evaluar experiencia y estilo.
```

## Detalle

```text
Como [audiencia],
quiero consultar el contexto y resultado de [trabajo],
para comprender la capacidad demostrada.
```

## Filtrado

```text
Como [audiencia],
quiero ver trabajos relacionados con [criterio],
para concentrarme en los más relevantes.
```

## Contacto

```text
Como [potencial cliente o empleador],
quiero contactar a [profesional],
para iniciar una oportunidad.
```

## CV

```text
Como [reclutador],
quiero acceder al CV vigente,
para evaluar trayectoria.
```

## Actualización

```text
Como [propietario],
quiero agregar o actualizar [trabajo],
para mantener vigente el portfolio.
```

## Acceso restringido

```text
Como [audiencia autorizada],
quiero consultar [proyecto protegido],
para evaluarlo bajo las condiciones definidas.
```

### Regla

Los patrones no introducen capacidades.

Solo convierten requisitos ya activados en historias.

---

# 12. PATRONES DE CRITERIOS DE ACEPTACIÓN

Los criterios finales deben seguir `base/acceptance-criteria.md`.

## Identidad

```text
la persona o estudio se identifica claramente
la disciplina o especialidad puede comprenderse
la información no contradice el contexto
```

## Listado de trabajos

```text
los trabajos seleccionados están disponibles
cada elemento puede distinguirse
el visitante puede acceder al detalle cuando aplica
```

## Filtro

```text
un criterio válido muestra trabajos relacionados
la ausencia de resultados se comunica
los trabajos no pertenecientes al criterio no se presentan como coincidencia
```

## Detalle

```text
el proyecto muestra la información requerida
los medios disponibles corresponden al trabajo
los links vigentes conducen al destino esperado
```

## Contacto

```text
los datos obligatorios faltantes impiden enviar
un envío válido produce confirmación
la consulta llega al destino definido
```

## CV o documento

```text
el documento disponible corresponde a la versión vigente
un documento no disponible produce una respuesta comprensible
```

## Gestión

```text
solo actores autorizados modifican
un trabajo publicado refleja cambios válidos
un trabajo retirado deja de mostrarse como activo
```

No convertir estas frases en criterios finales sin audiencias, trabajos y condiciones reales.

---

# 13. REQUISITOS NO FUNCIONALES RELEVANTES

Incorporar solo cuando exista soporte contextual.

## Calidad de presentación

Traducir a resultados observables:

```text
los trabajos pueden evaluarse
la información no compite con la evidencia
los medios se presentan sin pérdida funcional
```

No usar:

```text
impactante
premium
moderno
visualmente atractivo
```

sin comportamiento verificable.

## Accesibilidad

Aplicar según audiencia y reglas generales.

## Rendimiento

Relacionar con:

```text
cantidad de medios
peso visual
tipo de audiencia
contexto de uso
```

No inventar segundos ni scores.

## Compatibilidad

Relacionar con dispositivos reales.

No asumir mobile-first.

## Privacidad

Activar cuando se capturan contactos o hay trabajos protegidos.

## Preservación de medios

Puede requerir que imágenes, video o documentos permanezcan accesibles y correctos.

## Actualización

Activar cuando el portfolio cambia con frecuencia.

## Localización

Activar por idioma o mercado.

---

# 14. RIESGOS ESPECÍFICOS DEL DOMINIO

Evaluar solo los aplicables.

## Portfolio genérico

Riesgo:

```text
forzar hero, galería, filtros, sobre mí y contacto sin responder al caso real
```

## Proyectos inventados

Riesgo:

```text
rellenar ejemplos, tecnologías, clientes o resultados no provistos
```

## Filtros innecesarios

Riesgo:

```text
complicar una selección pequeña
```

## Galería forzada

Riesgo:

```text
usar grid visual cuando el valor está en casos o textos
```

## Detalle excesivo

Riesgo:

```text
crear página individual para trabajos que no lo necesitan
```

## Contacto asumido

Riesgo:

```text
imponer formulario cuando el canal real es externo
```

## CV desactualizado

Riesgo:

```text
distribuir un documento sin control de vigencia
```

## Evidencia sin autorización

Riesgo:

```text
mostrar clientes, logos, materiales o resultados restringidos
```

## Tecnologías como sustituto de impacto

Riesgo:

```text
centrar proyectos en herramientas en lugar de problema y resultado
```

## CMS por defecto

Riesgo:

```text
crear panel sin necesidad de actualización autónoma
```

## SEO universal

Riesgo:

```text
forzar descubrimiento orgánico sin objetivo
```

## Métricas inventadas

Riesgo:

```text
agregar años, clientes, proyectos o resultados falsos
```

## Estudio confundido con corporativo

Riesgo:

```text
perder el foco en obra y convertirlo en sitio empresarial genérico
```

---

# 15. TRAMPAS DE ALCANCE

No incorporar automáticamente:

```text
homepage
hero
galería
grid
filtros
categorías
detalle
sobre mí
formulario
email
redes
LinkedIn
GitHub
Behance
CV
testimonios
logos
timeline
servicios
tarifas
blog
CMS
multi-idioma
SEO
analytics
dark mode
animaciones
```

Cada elemento requiere una condición de activación.

No usar frases como:

```text
todo portfolio necesita
es estándar
queda profesional
mejora la experiencia
```

Una práctica habitual no es automáticamente un requisito de producto.

---

# 16. CLASIFICACIÓN ORIENTATIVA DE ALCANCE

La clasificación final pertenece a `base/product-scope-rules.md`.

## Requeridas bajo condición

```text
identidad profesional
unidad de trabajo
selección
exploración
evidencia suficiente
acción final cuando aplica
```

## Condicionales

```text
listado
detalle
caso de estudio
categorías
filtros
medios
links
tecnologías
rol
resultados
sobre mí
servicios
contacto
CV
perfiles
gestión de contenido
SEO
multi-idioma
medición
```

## Opcionales

```text
testimonios
logos
timeline
premios
motion
dark mode
```

## NO INCLUIR POR DEFECTO

```text
blog
CMS complejo
área privada
formulario de presupuesto avanzado
e-commerce
booking
personalización por audiencia
analytics propio
```

Una capacidad puede ingresar al complete product scope si es parte explícita del núcleo.

---

# 17. MAPEO DESDE `project-context.md`

## `project_name`

Aporta identidad.

## `purpose`

Define el resultado profesional principal.

## `project_type`

Activa esta plantilla después de normalización.

## `client_profile.audience`

Fuente principal para audiencias.

## `client_profile.persona`

Ayuda a definir el visitante prioritario.

## `client_profile.primary_actions`

Fuente autoritativa para acciones como:

```text
explorar
evaluar
contactar
descargar
visitar demo
solicitar presupuesto
```

## `client_profile.social_media`

Puede activar perfiles profesionales.

No obliga a mostrarlos.

## `brand.has_existing_identity`

Indica si existe identidad previa.

No autoriza inventarla.

## `brand.visual_style`

Aporta expectativas visuales.

No define layout.

## `brand.reference_url`

Puede aportar referencias de presentación.

No debe copiarse.

## `complete_product_scope.must_have_features`

Fuente autoritativa de prioridad de construccion.

## `scale.expected_volume`

Puede influir en:

```text
filtros
búsqueda
gestión de contenido
rendimiento de medios
```

No autoriza umbrales inventados.

---

# 18. PROTOCOLO DE GENERACIÓN PORTFOLIO

Después de seleccionar esta plantilla:

```text
1. Identificar la variante.
2. Identificar a quién o qué se presenta.
3. Identificar audiencias prioritarias.
4. Identificar tipos de trabajo.
5. Identificar evidencia disponible.
6. Identificar acción esperada.
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
template = project-types/portfolio/prd-template.md
portfolio_variant
portfolio_owner
primary_audiences
work_types
evidence_model
contact_model
content_update_model
activated_capabilities
rejected_capabilities
conditional_capabilities
scope_decisions
ambiguity_resolutions
unsupported_patterns_not_added
```

Ejemplo conceptual:

```markdown
## Portfolio Template Decisions

- Variant: developer portfolio oriented to employment
- Primary audience: recruiters
- Work types: software projects
- Activated:
  - professional identity;
  - project listing;
  - project detail;
  - repository links where available;
  - CV access.
- Not activated:
  - filters;
  - contact form;
  - testimonials;
  - blog;
  - CMS;
  - dark mode.
```

No crear otro archivo para estas decisiones.

---

# 20. VALIDACIÓN ESPECÍFICA PORTFOLIO

Antes de aceptar el PRD, comprobar:

```text
[ ] La variante está justificada.
[ ] El propietario del portfolio está identificado.
[ ] Las audiencias provienen del contexto.
[ ] Los tipos de trabajo están definidos.
[ ] La evidencia disponible es real.
[ ] No se inventaron proyectos.
[ ] No se inventaron clientes, tecnologías o resultados.
[ ] La galería existe solo si el contenido la requiere.
[ ] Los filtros existen solo si están justificados.
[ ] El detalle existe solo si aporta contexto.
[ ] El contacto usa el canal real.
[ ] No se impuso formulario.
[ ] CV y perfiles existen solo si están disponibles.
[ ] No se asumieron testimonios o logos.
[ ] CMS existe solo si hay actualización autónoma.
[ ] SEO existe solo si la descubribilidad es relevante.
[ ] No se forzó responsive con breakpoints concretos.
[ ] No se inventaron tiempos ni scores.
[ ] No hay decisiones técnicas.
[ ] No existe un Implementation Plan.
[ ] No se duplicó la estructura de prd-base.md.
[ ] Los elementos opcionales no inflaron el complete product scope.
```

Hallazgos posibles, además de los generales:

```text
PRD_PORTFOLIO_VARIANT_UNSUPPORTED
PRD_PORTFOLIO_AUDIENCE_INVENTED
PRD_PORTFOLIO_PROJECT_INVENTED
PRD_PORTFOLIO_EVIDENCE_UNSUPPORTED
PRD_PORTFOLIO_GALLERY_ASSUMED
PRD_PORTFOLIO_FILTER_ASSUMED
PRD_PORTFOLIO_CONTACT_ASSUMED
PRD_PORTFOLIO_CREDENTIAL_INVENTED
PRD_PORTFOLIO_CMS_ASSUMED
PRD_PORTFOLIO_SEO_ASSUMED
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
definir grid
definir columnas
definir breakpoints
definir filtros obligatorios
definir categorías
definir formulario
definir email
definir redes concretas
definir tecnologías
definir SEO obligatorio
definir tiempos de carga
definir relación de aspecto
definir nueva pestaña
definir hero
definir dark mode
definir animaciones
definir contenido ficticio
```

---

# 22. INTEGRACIÓN

Invocado por:

```text
prd-spec-generator
```

Condición:

```text
normalized_project_type == "portfolio"
```

También puede cubrir alias como:

```text
portafolio
book profesional
muestra de trabajos
portfolio personal
showcase
```

cuando `template-registry.json` los normalice a `portfolio`.

Si el portfolio representa principalmente una empresa y sus servicios, debe evaluarse
si corresponde `corporate`.

No escribe archivos directamente.

No modifica `prd.md`.

No es leído obligatoriamente por `prd-validation-gate` durante un PASS normal.

Puede ser consultado en reparación cuando el hallazgo se relaciona con audiencias,
evidencia, presentación o alcance específico del dominio portfolio.

---

# 23. REGLA FINAL

No conviertas una trayectoria real en un portfolio genérico.

Usa esta plantilla para comprender:

```text
qué trabajo existe
qué demuestra
quién debe evaluarlo
qué acción debe poder completar
```

Cuando una capacidad común no está respaldada por el contexto:

```text
no la agregues
```

Cuando una capacidad es necesaria para demostrar el trabajo de forma viable:

```text
actívala en su forma mínima
registra la razón
mantén neutralidad técnica
```
