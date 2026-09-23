---
name: generic-prd-template
description: |
  Plantilla interna neutral para proyectos cuyo tipo no coincide con suficiente
  confianza con SaaS, e-commerce, landing, corporate, blog o portfolio.
  Ayuda a prd-spec-generator a derivar el producto desde actores, problemas,
  resultados, flujos, reglas y evidencia sin imponer patrones de dominio.
allowed-tools: [Read]
applyTo: ["**/project-context.md", "**/prd.md"]
bawe_network_role: prd-domain-template
bawe_dependencies_on:
  - {skill: prd-spec-generator, relation_type: invocado-por}
bawe_depended_by: []
---

# BAWE PRD DOMAIN TEMPLATE — Generic

Version: 1.0  
Status: Stable fallback template

## 1. PROPÓSITO

Este archivo es el fallback de conocimiento para `prd-spec-generator`.

Se utiliza cuando:

```text
el tipo no coincide con una plantilla especializada
la evidencia es insuficiente para clasificar
el proyecto combina varios dominios sin uno claramente dominante
el tipo declarado no representa el núcleo real del producto
el dominio todavía no tiene una plantilla propia
```

No es un PRD terminado.

No define la estructura final de `prd.md`.

No contiene funcionalidades que deban copiarse automáticamente.

No autoriza al generador a inventar:

```text
autenticación
roles
dashboard
CRUD
catálogo
carrito
formularios
CMS
galerías
SEO
analytics
pagos
notificaciones
panel administrativo
```

Su función es ayudar al LLM a responder:

```text
¿Qué problema debe resolver el producto?
¿Quién necesita resolverlo?
¿Qué resultado observable debe producir?
¿Qué acciones forman el flujo principal?
¿Qué información entra, cambia y sale?
¿Qué reglas condicionan el comportamiento?
¿Qué capacidades mínimas hacen viable el complete product scope?
¿Qué elementos deben permanecer fuera por falta de evidencia?
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

Se usa después de leer:

```text
[PROJECT_ROOT]/project-context.md
[PROJECT_ROOT]/log-preguntas.md
```

y de que el registro resuelva:

```text
normalized_project_type = generic
```

## Salida

Esta plantilla no escribe archivos.

Aporta conocimiento neutral para producir:

```text
[PROJECT_ROOT]/prd.md
```

## Regla principal

Cada capacidad debe atravesar:

```text
fuente
→ problema o necesidad
→ actor
→ resultado esperado
→ condición de activación
→ comportamiento mínimo
→ alcance
→ requisito
→ historia
→ criterio de aceptación
```

Si la cadena no puede construirse:

```text
no incorporar la capacidad
```

---

# 3. CUÁNDO APLICAR ESTA PLANTILLA

Aplicar cuando ocurra al menos una de estas condiciones:

```text
project_type está ausente
project_type es desconocido
el alias no existe en template-registry.json
el proyecto es híbrido y no tiene dominio predominante
el tipo declarado contradice las funciones principales
el producto pertenece a un dominio aún no modelado
```

Ejemplos posibles:

```text
calculador
simulador
directorio
agenda pública
comparador
generador
portal especializado
flujo de solicitudes
plataforma comunitaria
sistema educativo
aplicación de eventos
utilidad web
experiencia interactiva
```

La lista no activa funcionalidades.

---

# 4. CUÁNDO NO USARLA

No usar `generic` por comodidad cuando existe evidencia suficiente para seleccionar:

```text
saas
ecommerce
landing
corporate
blog
portfolio
```

No usarla para evitar normalizar un alias conocido.

No usarla porque el proyecto tenga funciones secundarias de otros dominios.

Ejemplos:

```text
sitio corporativo con blog secundario
→ corporate

SaaS con landing pública
→ saas

e-commerce con panel administrativo
→ ecommerce

portfolio con formulario de contacto
→ portfolio
```

La plantilla principal representa el núcleo del producto.

---

# 5. PRINCIPIO DE CLASIFICACIÓN

Antes de derivar requisitos, identificar:

```text
resultado central
actor primario
objeto o información principal
acción principal
frecuencia de uso
contexto público o privado
naturaleza transaccional, operativa o informativa
```

Completar:

```text
El producto existe para que [actor]
pueda [acción]
y obtenga [resultado].
```

Si esta frase no puede completarse con evidencia:

```text
aplicar ambiguity-rules.md
```

El generador puede usar patrones funcionales neutrales:

```text
informar
capturar
consultar
transformar
calcular
comparar
coordinar
registrar
publicar
descubrir
comunicar
reservar
solicitar
seguir
entregar
```

Estos patrones no son tipos del registry.

---

# 6. MODELO DE ACTIVACIÓN

Cada capacidad se clasifica como:

```text
REQUERIDA BAJO CONDICIÓN
CONDICIONAL
OPCIONAL
NO INCLUIR POR DEFECTO
```

La clasificación final pertenece a:

```text
assets/base/product-scope-rules.md
```

---

# 7. EJES DE ANÁLISIS NEUTRAL

## Actor

Identificar:

```text
quién inicia
quién aporta información
quién recibe el resultado
quién supervisa
quién administra
```

No crear `Admin`, `Usuario` u `Operador` sin responsabilidades diferenciadas.

## Problema

Definir:

```text
situación actual
fricción
consecuencia
causa relevante
```

No reemplazar el problema por:

```text
necesita una app
necesita una web moderna
```

## Resultado

Definir el cambio observable que produce el producto.

## Objeto central

Puede ser:

```text
información
solicitud
registro
contenido
evento
archivo
cálculo
comparación
reserva
caso
relación
```

No convertir automáticamente el objeto en CRUD.

## Flujo principal

Debe incluir:

```text
inicio
acción
validación
resultado
fallo o excepción relevante
```

## Reglas

Identificar:

```text
restricciones
permisos
estados
cálculos
condiciones
```

## Alcance

Separar:

```text
complete product scope
Deferred Scope
Out of Scope
```

---

# 8. CAPACIDADES NEUTRALES

## Presentación de información

Activar cuando el usuario necesita comprender información.

### Alcance por defecto

```text
REQUERIDA BAJO CONDICIÓN
```

Derivar:

```text
contenido
audiencia
prioridad
acción posterior
```

No asumir páginas, tarjetas, tablas ni secciones.

## Captura de información

Activar cuando el producto recibe datos de un actor.

### Alcance por defecto

```text
REQUERIDA BAJO CONDICIÓN
```

Derivar:

```text
dato
motivo
obligatoriedad
validación
destino
resultado
```

No asumir formulario.

## Consulta y recuperación

Activar cuando el usuario necesita recuperar información existente.

### Alcance por defecto

```text
REQUERIDA BAJO CONDICIÓN
```

Derivar:

```text
qué busca
criterios
resultado
ausencia de resultado
restricciones
```

No asumir buscador, filtros ni paginación.

## Transformación o cálculo

Activar cuando el producto procesa entradas para producir una salida.

### Alcance por defecto

```text
REQUERIDA BAJO CONDICIÓN
```

Derivar:

```text
entrada
regla o fórmula provista
salida
casos inválidos
```

No inventar fórmulas ni valores.

## Persistencia

Activar cuando la información debe conservarse o consultarse después.

### Alcance por defecto

```text
REQUERIDA BAJO CONDICIÓN
```

No asumir base de datos ni estructura técnica.

## Modificación

Activar cuando un actor debe cambiar información existente.

### Alcance por defecto

```text
CONDICIONAL
```

Derivar:

```text
actor
dato modificable
estado
restricción
resultado
```

No asumir edición completa.

## Eliminación, retiro o cancelación

Diferenciar:

```text
eliminar
cancelar
archivar
desactivar
retirar
```

### Alcance por defecto

```text
CONDICIONAL
```

No asumir borrado.

## Estados y transiciones

Activar cuando el objeto cambia durante el proceso.

### Alcance por defecto

```text
REQUERIDA BAJO CONDICIÓN
```

Derivar:

```text
estado inicial
estados válidos
transiciones
actor
condición
resultado
```

No inventar estados.

## Identidad y acceso

Activar cuando:

```text
hay datos privados
hay acciones atribuibles
existen permisos
se requiere continuidad personal
```

### Alcance por defecto

```text
CONDICIONAL
```

No asumir email, contraseña ni registro.

## Permisos

Activar cuando actores distintos tienen capacidades diferentes.

### Alcance por defecto

```text
REQUERIDA BAJO CONDICIÓN
```

No asumir un modelo técnico de autorización.

## Navegación u organización

Activar cuando hay múltiples áreas, contenidos o acciones.

### Alcance por defecto

```text
CONDICIONAL
```

No asumir menú, sidebar ni pestañas.

## Búsqueda y filtros

Activar cuando el volumen o la tarea lo requiere.

### Alcance por defecto

```text
CONDICIONAL
```

No inventar umbrales.

## Comunicación y contacto

Activar cuando un actor debe iniciar o continuar una conversación.

### Alcance por defecto

```text
CONDICIONAL
```

No asumir formulario, email o chat.

## Notificaciones

Activar cuando un actor debe conocer un evento fuera del flujo actual.

### Alcance por defecto

```text
CONDICIONAL
```

Derivar:

```text
evento
destinatario
urgencia
acción esperada
canal si fue definido
```

## Archivos y medios

Activar cuando el flujo utiliza documentos, imágenes, audio o video.

### Alcance por defecto

```text
CONDICIONAL
```

No asumir formatos, límites ni almacenamiento.

## Integraciones externas

Activar cuando el flujo principal depende de otro sistema.

### Alcance por defecto

```text
CONDICIONAL
```

Derivar:

```text
sistema
dato o acción
momento
resultado
fallo
```

No definir protocolo técnico.

## Gestión administrativa

Activar cuando alguien mantiene datos, opciones, usuarios o contenido.

### Alcance por defecto

```text
CONDICIONAL
```

No asumir panel Admin universal.

## Medición

Activar cuando el éxito necesita observarse y el contexto declara métricas.

### Alcance por defecto

```text
CONDICIONAL
```

No asumir analytics.

## Pago o transacción

Activar cuando el producto procesa un compromiso comercial.

### Alcance por defecto

```text
NO INCLUIR POR DEFECTO
```

Si domina el producto, revisar `ecommerce`.

## Colaboración

Activar cuando varios actores trabajan sobre el mismo objeto o proceso.

### Alcance por defecto

```text
CONDICIONAL
```

No asumir comentarios, menciones ni tiempo real.

## Personalización

Activar solo con necesidad explícita.

### Alcance por defecto

```text
OPCIONAL
```

## Automatización

### Alcance por defecto

```text
CONDICIONAL
```

Derivar:

```text
disparador
condición
acción
resultado
excepción
```

No inventar automatizaciones “útiles”.

---

# 9. ACTORES CANDIDATOS

Son funciones conceptuales, no roles obligatorios:

```text
iniciador
solicitante
consultante
proveedor de información
revisor
aprobador
responsable
destinatario
administrador funcional
visitante
participante
```

El nombre final debe provenir del dominio del cliente.

Un actor solo se crea cuando tiene:

```text
objetivo propio
acción propia
información propia
permiso o resultado diferenciado
```

---

# 10. FLUJOS CANDIDATOS

No copiar automáticamente.

## Consulta

```text
entrada
→ criterio
→ resultado
→ acción posterior
```

## Captura

```text
inicio
→ aporte de datos
→ validación
→ confirmación
```

## Solicitud

```text
actor
→ solicitud
→ revisión
→ resultado
```

## Seguimiento

```text
identificación
→ consulta de estado
→ interpretación
→ acción
```

## Cálculo

```text
entrada
→ validación
→ procesamiento
→ resultado
```

## Comparación

```text
selección
→ criterios
→ diferencias
→ decisión
```

## Publicación

```text
creación
→ validación o revisión
→ disponibilidad
```

## Coordinación

```text
asignación
→ ejecución
→ actualización
→ cierre
```

## Entrega

```text
condición cumplida
→ habilitación
→ acceso
→ confirmación
```

---

# 11. REGLAS DE NEGOCIO

Revisar si existen reglas sobre:

```text
quién puede actuar
qué información es necesaria
qué estados existen
qué acciones están permitidas
qué condiciones producen resultados
qué cálculos se aplican
qué datos deben conservarse
qué puede modificarse
qué puede cancelarse
qué información es privada
qué eventos requieren aviso
qué sistemas externos participan
```

No inventar:

```text
roles
estados
campos
fórmulas
tiempos
límites
precios
permisos
políticas
```

---

# 12. PATRONES DE HISTORIAS

Solo usar después de activar un requisito.

```text
Como [actor],
quiero consultar [información],
para [resultado].
```

```text
Como [actor],
quiero registrar [información o acción],
para [resultado].
```

```text
Como [actor],
quiero solicitar [resultado],
para [objetivo].
```

```text
Como [actor],
quiero revisar [objeto],
para aprobar, rechazar o corregir [resultado].
```

```text
Como [actor],
quiero conocer el estado de [objeto],
para decidir [acción].
```

```text
Como [actor],
quiero obtener [salida] a partir de [entrada],
para [resultado].
```

Los patrones no introducen capacidades.

---

# 13. PATRONES DE CRITERIOS

Los criterios finales siguen `base/acceptance-criteria.md`.

## Captura

```text
los datos obligatorios faltantes impiden completar
los datos inválidos se identifican
una entrada válida produce resultado observable
```

## Consulta

```text
un criterio válido produce resultados correspondientes
la ausencia de resultados se comunica
un actor no accede a información restringida
```

## Estado

```text
solo transiciones permitidas se completan
el resultado refleja el nuevo estado
una transición inválida se rechaza
```

## Cálculo

```text
entradas válidas producen el resultado definido
entradas inválidas no producen un resultado engañoso
el resultado conserva la unidad o contexto requerido
```

## Integración

```text
un intercambio válido produce el resultado esperado
un fallo externo se comunica
un reintento no duplica el resultado cuando eso sería incorrecto
```

## Permiso

```text
un actor autorizado completa la acción
un actor no autorizado es rechazado
el rechazo no expone información restringida
```

---

# 14. REQUISITOS NO FUNCIONALES

Incorporar solo con evidencia:

```text
usabilidad
accesibilidad
privacidad
rendimiento
disponibilidad
integridad
compatibilidad
localización
trazabilidad
```

No inventar métricas ni estándares particulares.

---

# 15. RIESGOS DEL FALLBACK

## Producto genérico

```text
crear login, dashboard, CRUD y admin por falta de dominio
```

## Clasificación evitada

```text
usar generic aunque exista una plantilla especializada
```

## Mezcla de dominios

```text
agregar todas las capacidades de varios tipos
```

## Problema mal definido

```text
describir pantallas en vez de necesidad y resultado
```

## Actor genérico

```text
crear Usuario y Admin sin responsabilidades
```

## Alcance compensatorio

```text
agregar funciones para aparentar completitud
```

## Decisiones técnicas

```text
resolver incertidumbre con arquitectura o stack
```

## Supuestos ocultos

```text
incorporar reglas sin registrarlas en prd.md
```

---

# 16. TRAMPAS DE ALCANCE

No incorporar automáticamente:

```text
login
registro
roles
dashboard
CRUD
perfil
sidebar
formulario
buscador
filtros
notificaciones
analytics
SEO
CMS
carrito
pagos
chat
admin
API
exportación
```

No justificar con:

```text
es estándar
puede servir
es buena práctica
todo sistema necesita
```

---

# 17. CLASIFICACIÓN ORIENTATIVA

## Requeridas bajo condición

```text
actor
problema
resultado
flujo principal
información necesaria
reglas necesarias
confirmación observable
```

## Condicionales

```text
persistencia
identidad
permisos
estados
búsqueda
archivos
notificaciones
administración
integraciones
medición
colaboración
```

## Opcionales

```text
personalización
automatizaciones secundarias
preferencias
ayuda contextual
```

## NO INCLUIR POR DEFECTO

```text
multi-tenancy
billing complejo
marketplace
API pública
analytics propio
automatización avanzada
IA no solicitada
```

---

# 18. MAPEO DESDE `project-context.md`

## `project_name`

Aporta identidad.

## `purpose`

Fuente principal del resultado.

## `project_type`

Activa fallback cuando no puede normalizarse de otro modo.

## `client_profile.audience`

Fuente principal para actores.

## `client_profile.persona`

Ayuda a precisar el actor primario.

## `client_profile.primary_actions`

Fuente principal de flujos y requisitos.

## `complete_product_scope.must_have_features`

Fuente autoritativa de prioridad de construccion.

## `scale.expected_volume`

Puede activar búsqueda, rendimiento o administración.

No autoriza umbrales inventados.

## `brand.*`

Aporta contexto de identidad y experiencia.

No activa funcionalidades.

---

# 19. PROTOCOLO DE GENERACIÓN

```text
1. Confirmar que no existe template especializado con mejor ajuste.
2. Identificar actor primario.
3. Identificar problema.
4. Identificar resultado central.
5. Identificar objeto o información principal.
6. Derivar flujo principal.
7. Identificar reglas y excepciones.
8. Revisar capacidades neutrales.
9. Activar solo capacidades justificadas.
10. Aplicar ambiguity-rules.md.
11. Crear requisitos trazables.
12. Crear historias y criterios.
13. Clasificar alcance.
14. Registrar decisiones en prd.md.
15. Renderizar con prd-base.md.
16. Autoevaluar con validation-rules.md.
```

---

# 20. REGISTRO EN `prd.md`

Registrar:

```text
template = project-types/generic/prd-template.md
original_project_type
normalization_reason
fallback_reason
product_functional_pattern
primary_actor
central_problem
central_outcome
central_object
activated_capabilities
rejected_capabilities
conditional_capabilities
scope_decisions
ambiguity_resolutions
unsupported_patterns_not_added
```

---

# 21. VALIDACIÓN ESPECÍFICA

Antes de aceptar:

```text
[ ] El uso de generic está justificado.
[ ] No existe un template especializado con mejor ajuste.
[ ] El actor primario está definido.
[ ] El problema está definido.
[ ] El resultado central es observable.
[ ] El flujo principal puede completarse.
[ ] Las capacidades activadas tienen fuente.
[ ] No se inventaron roles.
[ ] No se forzó CRUD.
[ ] No se forzó autenticación.
[ ] No se forzó panel administrativo.
[ ] No se agregaron funciones para completar.
[ ] Las ambigüedades están clasificadas.
[ ] No hay decisiones técnicas.
[ ] No existe Implementation Plan.
[ ] No se duplicó prd-base.md.
```

Hallazgos posibles:

```text
PRD_GENERIC_FALLBACK_UNJUSTIFIED
PRD_GENERIC_SPECIALIZED_TEMPLATE_AVAILABLE
PRD_GENERIC_ACTOR_UNDEFINED
PRD_GENERIC_OUTCOME_UNDEFINED
PRD_GENERIC_CAPABILITY_INVENTED
PRD_GENERIC_SCOPE_INFLATED
```

---

# 22. PROHIBICIONES

Esta plantilla no debe:

```text
contener un PRD embebido
definir arquitectura
definir stack
definir implementación
definir pantallas
definir componentes
definir base de datos
definir endpoints
definir roles genéricos
definir CRUD universal
definir autenticación universal
definir métricas inventadas
definir tiempos inventados
crear un nuevo tipo de proyecto
```

---

# 23. INTEGRACIÓN

Invocado por:

```text
prd-spec-generator
```

Condición:

```text
normalized_project_type == "generic"
```

Es el fallback final del registry.

No escribe archivos directamente.

No modifica `prd.md`.

Puede consultarse durante reparación cuando el hallazgo se relaciona con:

```text
clasificación
scope inflado
capacidad inventada
ausencia de resultado central
```

---

# 24. REGLA FINAL

`generic` no significa:

```text
agregar un poco de todo
```

Significa:

```text
derivar estrictamente desde la evidencia
sin conocimiento especializado adicional
```

Cuando una capacidad no está respaldada:

```text
no la agregues
```

Cuando una capacidad es indispensable para completar una función explícita:

```text
actívala en su forma mínima
registra la razón
mantén neutralidad técnica
```
