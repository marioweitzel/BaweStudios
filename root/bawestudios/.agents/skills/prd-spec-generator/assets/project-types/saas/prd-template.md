---
name: saas-prd-template
description: |
  Plantilla interna de conocimiento de dominio para productos SaaS y dashboards.
  Ayuda a prd-spec-generator a detectar capacidades, actores, flujos, reglas,
  riesgos y límites propios del dominio sin convertir patrones comunes en
  requerimientos obligatorios.
allowed-tools: [Read]
applyTo: ["**/project-context.md", "**/prd.md"]
bawe_network_role: prd-domain-template
bawe_dependencies_on:
  - {skill: prd-spec-generator, relation_type: invocado-por}
bawe_depended_by: []
---

# BAWE PRD DOMAIN TEMPLATE — SaaS / Dashboard

Version: 1.0  
Status: Stable domain template

## 1. PROPÓSITO

Este archivo aporta conocimiento específico del dominio SaaS y dashboard a
`prd-spec-generator`.

No es un PRD terminado.

No define la estructura final de `prd.md`.

No contiene funcionalidades que deban copiarse automáticamente.

No autoriza al generador a inventar usuarios, roles, métricas, procesos, módulos,
reglas de negocio, integraciones ni decisiones técnicas.

Su función es ayudar al LLM a responder:

```text
¿Qué clase de SaaS o dashboard describe el contexto?
¿Qué capacidades podrían ser necesarias?
¿Qué condiciones activan cada capacidad?
¿Qué reglas de negocio deben derivarse?
¿Qué riesgos y trampas de alcance deben evitarse?
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
project_type = saas
```

La normalización puede provenir de términos como:

```text
saas
dashboard
panel operativo
sistema de gestión
plataforma de operaciones
herramienta interna
software de administración
portal de trabajo
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
→ necesidad
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
gestionar información persistente
coordinar operaciones
automatizar un proceso
monitorear estados o indicadores
trabajar con registros del dominio
permitir colaboración entre usuarios
administrar cuentas, espacios u organizaciones
ofrecer una herramienta de uso recurrente
centralizar una operación antes fragmentada
```

Ejemplos compatibles:

- sistema de gestión operativo;
- panel de seguimiento;
- herramienta profesional de uso individual;
- portal de trabajo para equipos;
- software de automatización;
- dashboard analítico;
- plataforma colaborativa;
- producto SaaS para múltiples organizaciones;
- backoffice o consola administrativa cuando ese panel es el producto principal.

---

# 4. CUÁNDO NO APLICARLA

No aplicar como plantilla principal cuando el producto es esencialmente:

```text
una landing de marketing
un sitio institucional informativo
un portfolio
un blog editorial simple
una tienda online cuyo núcleo es el comercio electrónico
un marketplace de oferta y demanda
una aplicación móvil cuyo comportamiento principal es nativo
```

Un proyecto puede tener un panel administrativo y no ser un SaaS.

La existencia de:

```text
login
dashboard
administrador
formularios
```

no es suficiente por sí sola para clasificarlo como SaaS.

Debe existir una operación, proceso, servicio o producto persistente que constituya
el valor central.

---

# 5. VARIANTES SaaS SOPORTADAS

Antes de derivar capacidades, clasificar la variante predominante.

Puede existir más de una, pero debe identificarse una principal.

## 5.1 SaaS operativo interno

Señales:

```text
empleados
operadores
sucursales
tareas repetitivas
registros diarios
cierres
aprobaciones
seguimiento interno
```

Valor típico:

```text
reducir trabajo manual
centralizar operaciones
reducir errores
hacer trazables los procesos
```

No implica automáticamente:

```text
suscripciones
multi-tenancy
autoservicio
billing
```

## 5.2 SaaS de autoservicio para clientes

Señales:

```text
clientes finales
creación de cuenta
gestión de su propio servicio
configuración personal
consulta de estado
consumo recurrente
```

Valor típico:

```text
permitir que el cliente complete acciones sin intervención del equipo
```

Puede requerir identidad y acceso, pero no obliga a incluir roles complejos.

## 5.3 Dashboard analítico

Señales:

```text
métricas
KPIs
tendencias
comparaciones
seguimiento
alertas
resúmenes
```

Valor típico:

```text
transformar datos en decisiones
```

No obliga a tener CRUD.

Debe existir evidencia de:

```text
qué se mide
quién lo interpreta
qué decisión permite tomar
```

## 5.4 Automatización de workflows

Señales:

```text
pasos
estados
aprobaciones
asignaciones
disparadores
reglas
excepciones
```

Valor típico:

```text
coordinar un proceso y reducir intervención manual
```

El núcleo son los estados y las transiciones, no un CRUD genérico.

## 5.5 Herramienta profesional individual

Señales:

```text
un usuario principal
uso especializado
información privada
trabajo recurrente
sin colaboración obligatoria
```

Valor típico:

```text
organizar o acelerar el trabajo personal
```

No inventar:

```text
roles
gestión de usuarios
organizaciones
multi-tenancy
```

## 5.6 Plataforma colaborativa

Señales:

```text
equipos
asignaciones
comentarios
responsables
actividad compartida
aprobaciones
```

Valor típico:

```text
coordinar personas sobre objetos y procesos comunes
```

La colaboración se activa solo si está respaldada por el contexto.

## 5.7 SaaS multi-organización

Señales:

```text
múltiples empresas clientes
cada organización administra sus usuarios
datos separados por cuenta
planes por organización
propietario de cuenta
```

Valor típico:

```text
servir a organizaciones independientes dentro del mismo producto
```

La existencia de varias sucursales de una misma empresa no equivale automáticamente
a multi-tenancy.

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
hacer viable el producto.

## 6.2 Condicional

La capacidad puede ser necesaria, pero debe existir evidencia contextual específica.

## 6.3 Opcional

Puede mejorar el producto, pero no debe ingresar al complete product scope sin solicitud o justificación.

## 6.4 NO INCLUIR POR DEFECTO

No se incluye por defecto salvo que sea parte explicita del nucleo del producto.

La categoría no reemplaza `base/product-scope-rules.md`.

Solo aporta una orientación inicial.

---

# 7. CAPACIDADES DEL DOMINIO

## 7.1 Identidad y acceso

### Activar cuando

```text
hay información privada
las acciones deben atribuirse a una persona
existen configuraciones personales
el producto diferencia usuarios
el usuario vuelve en distintas sesiones
```

### Comportamiento mínimo posible

```text
identificar al usuario
permitir acceso autorizado
rechazar acceso inválido
cerrar el acceso de forma explícita cuando corresponda
recuperar o restablecer acceso solo si el contexto lo requiere
```

### Alcance por defecto

```text
REQUERIDA BAJO CONDICIÓN
```

### No asumir

```text
email y contraseña
recuperación por email
social login
2FA
expiración exacta de sesión
JWT
tokens
SSO
```

El PRD define el comportamiento de acceso.

La arquitectura definirá el mecanismo técnico.

---

## 7.2 Espacio personal, cuenta u organización

### Activar cuando

```text
los datos pertenecen a un usuario
los datos pertenecen a una empresa
existen equipos
existen varias organizaciones independientes
el usuario administra un entorno propio
```

### Posibles modelos

```text
espacio individual
una sola organización
múltiples áreas de una organización
múltiples sucursales
múltiples organizaciones independientes
```

### Alcance por defecto

```text
CONDICIONAL
```

### No asumir

```text
tenant
workspace
empresa
equipo
cuenta empresarial
```

El nombre y el modelo deben derivarse del contexto.

---

## 7.3 Roles y permisos

### Activar cuando

```text
dos actores realizan acciones diferentes
una acción debe restringirse
existe supervisión
existe aprobación
alguien administra usuarios o configuración
```

### Comportamiento mínimo

```text
identificar actores
definir acciones permitidas
rechazar acciones no autorizadas
evitar acceso a información restringida
```

### Alcance por defecto

```text
REQUERIDA BAJO CONDICIÓN
```

### No asumir

```text
Admin
Usuario
Operador
Supervisor
RBAC
dos roles mínimos
gestión completa de usuarios
```

Los roles se derivan de responsabilidades reales.

Si un único actor puede completar todo el flujo, no crear roles artificiales.

---

## 7.4 Gestión de usuarios

### Activar cuando

```text
alguien debe incorporar personas
alguien debe desactivar accesos
existen cuentas administradas
la organización controla quién participa
```

### Posibles comportamientos

```text
invitar
activar
desactivar
cambiar responsabilidades
consultar usuarios
```

### Alcance por defecto

```text
CONDICIONAL
```

### No asumir

```text
autorregistro
invitación por email
cambio de rol
borrado
panel de usuarios
```

Cada operación debe derivarse del flujo real.

---

## 7.5 Entidades y registros del dominio

### Activar cuando

```text
el producto conserva información operativa
existen objetos del negocio
se registran eventos
se gestionan casos, trabajos, clientes, pedidos, turnos u otros elementos
```

### Regla principal

No convertir automáticamente cada entidad en CRUD.

Derivar solo las operaciones necesarias:

```text
crear
registrar
consultar
actualizar
asignar
aprobar
rechazar
cerrar
cancelar
archivar
reactivar
eliminar
```

### Alcance por defecto

```text
REQUERIDA BAJO CONDICIÓN
```

### No asumir

```text
crear, ver, editar y borrar todo
soft delete
paginación
tabla
formulario
modal
```

El PRD define comportamientos.

El diseño y la arquitectura decidirán su representación.

---

## 7.6 Estados y workflow

### Activar cuando

```text
una entidad evoluciona
hay etapas
existen responsables
hay aprobación
una acción depende del estado anterior
```

### Debe derivarse

```text
estado inicial
estados posibles
transiciones permitidas
actor que ejecuta cada transición
condiciones
resultado
excepciones
```

### Alcance por defecto

```text
REQUERIDA BAJO CONDICIÓN
```

### No asumir

```text
estados genéricos
aprobaciones
automatizaciones
notificaciones
```

No inventar estados solo para hacer que el producto parezca completo.

---

## 7.7 Dashboard y visualización de estado

### Activar cuando

```text
el usuario necesita monitorear
hay métricas o indicadores explícitos
el estado agregado permite decidir
el producto debe resumir operaciones
```

### Debe derivarse

```text
qué pregunta responde cada indicador
quién lo usa
qué datos resume
qué período o contexto necesita
qué acción permite tomar
```

### Alcance por defecto

```text
CONDICIONAL
```

### No asumir

```text
3 a 6 KPIs
gráficos
widgets
tiempo real
dashboard como pantalla inicial
```

Si el contexto no identifica métricas útiles, no inventar un dashboard.

---

## 7.8 Búsqueda, filtros y orden

### Activar cuando

```text
el usuario necesita localizar registros
existe volumen relevante
hay atributos de consulta
la operación depende de segmentar información
```

### Comportamiento mínimo

```text
encontrar información por criterios relevantes
identificar resultados
distinguir ausencia de coincidencias
```

### Alcance por defecto

```text
CONDICIONAL
```

### No asumir

```text
umbral de 100 registros
búsqueda avanzada
filtros múltiples
paginación
orden por todas las columnas
```

El volumen esperado es una señal, no un umbral inventado.

---

## 7.9 Colaboración

### Activar cuando

```text
varias personas trabajan sobre el mismo objeto
existen responsables
se necesitan comentarios
hay asignaciones
hay traspasos o revisiones
```

### Posibles comportamientos

```text
asignar
reasignar
comentar
mencionar
compartir
aprobar
consultar actividad
```

### Alcance por defecto

```text
CONDICIONAL
```

### No asumir

```text
chat
comentarios
presencia en tiempo real
menciones
notificaciones
```

La colaboración debe resolver un problema explícito.

---

## 7.10 Configuración administrativa

### Activar cuando

```text
el comportamiento del producto cambia por configuración
existen catálogos
hay parámetros de negocio
alguien mantiene opciones operativas
```

### Ejemplos de configuración de producto

```text
servicios disponibles
categorías
estados habilitados
reglas configurables
datos de la organización
```

### Alcance por defecto

```text
CONDICIONAL
```

### No asumir

```text
panel admin universal
configuración técnica
gestión de infraestructura
```

---

## 7.11 Notificaciones

### Activar cuando

```text
un usuario debe conocer un evento fuera del flujo actual
una demora genera daño
una aprobación requiere atención
un estado cambia sin que el usuario esté presente
```

### Debe derivarse

```text
evento
destinatario
motivo
urgencia
acción esperada
```

### Alcance por defecto

```text
CONDICIONAL
```

### No asumir

```text
email
push
SMS
notificación en tiempo real
preferencias de notificación
```

El canal es una decisión posterior salvo que el cliente lo especifique.

---

## 7.12 Historial y trazabilidad

### Activar cuando

```text
es necesario conocer quién hizo qué
hay disputas
hay datos sensibles
existen aprobaciones
el negocio exige seguimiento
```

### Comportamiento mínimo

```text
consultar cambios relevantes
identificar actor y momento
distinguir estado anterior y posterior cuando sea necesario
```

### Alcance por defecto

```text
CONDICIONAL
```

### No asumir

```text
audit log completo
retención indefinida
regulación específica
```

---

## 7.13 Reportes y exportación

### Activar cuando

```text
el usuario necesita consolidar información
debe compartir resultados fuera del producto
existen cierres
hay controles periódicos
```

### Diferenciar

```text
consulta dentro del producto
reporte consolidado
exportación
documento oficial
```

### Alcance por defecto

```text
CONDICIONAL
```

### No asumir

```text
CSV
PDF
Excel
reportes avanzados
BI
data warehouse
```

El formato solo entra si está solicitado o es una restricción explícita.

---

## 7.14 Integraciones

### Activar cuando

```text
el flujo principal depende de otro sistema
la información debe sincronizarse
el cliente identifica una plataforma externa
```

### Debe derivarse

```text
sistema externo
dato o acción intercambiada
dirección del intercambio
momento
resultado esperado
fallo relevante
```

### Alcance por defecto

```text
CONDICIONAL
```

### No asumir

```text
API pública
webhooks
ERP
CRM
email provider
pasarela de pago
```

No incluir integraciones solo porque sean habituales.

---

## 7.15 Multi-tenancy

### Activar cuando

```text
múltiples organizaciones independientes usan el mismo producto
cada organización controla sus usuarios
los datos deben permanecer separados
```

### No confundir con

```text
varias sucursales de una misma empresa
varios equipos internos
varios usuarios
```

### Alcance por defecto

```text
NO INCLUIR POR DEFECTO
```

Puede ser complete product scope cuando constituye el modelo explícito del producto.

### Debe derivarse

```text
propietario de organización
miembros
separación de datos
configuración por organización
ciclo de alta y baja
```

### No asumir

```text
tenant isolation técnica
subdominios
bases separadas
planes por organización
```

---

## 7.16 Billing y suscripciones

### Activar cuando

```text
el producto cobra dentro de la plataforma
el usuario gestiona un plan
el acceso depende del estado de pago
```

### Diferenciar

```text
modelo comercial de la empresa
facturación dentro del producto
gestión de suscripciones dentro del producto
```

Que el producto sea “SaaS” no significa que el complete product scope deba implementar billing.

### Alcance por defecto

```text
NO INCLUIR POR DEFECTO
```

Puede ser complete product scope si el cobro dentro del producto es una capacidad explícita.

### No asumir

```text
freemium
prueba gratuita
múltiples planes
upgrade
downgrade
cupones
facturas
pasarela
```

---

## 7.17 Onboarding y ayuda

### Activar cuando

```text
la primera configuración es compleja
el usuario no recibe capacitación
hay pasos obligatorios antes de obtener valor
```

### Posibles comportamientos

```text
configuración inicial
guía contextual
estado de avance
datos iniciales requeridos
```

### Alcance por defecto

```text
OPCIONAL
```

### No asumir

```text
tour
checklist
tutorial
videos
centro de ayuda
```

---

## 7.18 Personalización y preferencias

### Activar cuando

```text
el usuario necesita adaptar su experiencia
hay configuraciones que cambian comportamiento
la organización requiere identidad propia
```

### Alcance por defecto

```text
OPCIONAL
```

### No asumir

```text
dark mode
widgets configurables
temas
branding por tenant
preferencias complejas
```

---

## 7.19 API pública y webhooks

### Activar cuando

```text
terceros deben consumir el producto
el cliente solicita automatización externa
el producto funciona como plataforma
```

### Alcance por defecto

```text
NO INCLUIR POR DEFECTO
```

### No asumir

```text
API REST
GraphQL
webhooks
tokens
documentación pública
```

El PRD describe la capacidad de integración, no el protocolo técnico.

---

# 8. ACTORES CANDIDATOS

Estos actores son posibilidades del dominio, no roles obligatorios.

## Usuario individual

Activar cuando una sola persona utiliza el producto para su propio trabajo.

## Miembro de equipo

Activar cuando varias personas trabajan en un espacio compartido.

## Operador

Activar cuando existe una función operativa repetitiva y diferenciada.

## Supervisor

Activar cuando alguien revisa, controla, aprueba o reasigna.

## Administrador funcional

Activar cuando alguien mantiene usuarios, catálogos o configuración del producto.

No confundir con administración técnica de infraestructura.

## Propietario de organización

Activar cuando una empresa cliente controla su cuenta, miembros o plan.

## Cliente final

Activar cuando una persona externa interactúa directamente con el producto.

## Stakeholder o responsable del negocio

Puede consumir métricas o reportes sin operar el flujo diario.

### Regla de actores

No crear un actor porque su nombre sea común.

Crear un actor solo cuando tenga:

```text
objetivo propio
responsabilidad propia
acción propia
permiso o información diferenciada
```

---

# 9. FLUJOS CANDIDATOS

Los siguientes son patrones condicionales.

No deben copiarse automáticamente.

## Acceso

Activar si existe identidad.

```text
identificación
→ validación
→ acceso o rechazo
→ llegada a un estado útil
```

## Configuración inicial

Activar si el producto requiere datos previos para funcionar.

```text
inicio
→ ingreso de datos necesarios
→ validación
→ entorno listo
```

## Operación principal

Siempre debe existir un flujo principal derivado del problema.

```text
actor
→ inicia acción
→ aporta o selecciona información
→ el producto valida
→ se produce un resultado observable
```

## Seguimiento de estado

Activar cuando el objeto principal evoluciona.

```text
consulta
→ interpretación
→ acción permitida
→ nuevo estado
```

## Aprobación

Activar cuando una acción requiere revisión.

```text
solicitud
→ revisión
→ aprobación o rechazo
→ comunicación del resultado
```

## Cierre periódico

Activar cuando existe una operación diaria, semanal o mensual.

```text
selección de período
→ consolidación
→ revisión
→ cierre
→ resultado consultable
```

## Gestión de miembros

Activar cuando existe administración funcional de usuarios.

```text
alta o invitación
→ asignación de responsabilidad
→ acceso
→ cambio o desactivación
```

## Consulta analítica

Activar cuando hay métricas explícitas.

```text
selección de contexto
→ visualización de indicador
→ interpretación
→ acción o decisión
```

---

# 10. REGLAS DE NEGOCIO QUE DEBEN DERIVARSE

Para cada proyecto SaaS, revisar si existen reglas sobre:

```text
quién puede hacer cada acción
qué información puede consultar cada actor
qué campos son necesarios
qué condiciones habilitan una acción
qué estados existen
qué transiciones están permitidas
qué cálculo produce un resultado
qué elemento puede modificarse después de cierto estado
qué eventos requieren revisión
qué condiciones cierran un proceso
qué información pertenece a una organización o sucursal
qué ocurre con registros inactivos o cancelados
```

No inventar:

```text
porcentajes
límites
tiempos
planes
precios
fórmulas
períodos
permisos
estados
```

Si una regla es necesaria para el flujo principal y no puede derivarse, aplicar:

```text
methodology/ambiguity-rules.md
```

---

# 11. PATRONES DE HISTORIAS DE USUARIO

Estos patrones solo se activan cuando existe el requisito correspondiente.

## Acceso

```text
Como [actor identificado],
quiero acceder al espacio que me corresponde,
para realizar mis acciones autorizadas.
```

## Registro operativo

```text
Como [actor],
quiero registrar [evento u objeto],
para que [resultado de negocio].
```

## Consulta

```text
Como [actor],
quiero consultar [información],
para decidir o completar [acción].
```

## Cambio de estado

```text
Como [actor autorizado],
quiero cambiar [objeto] de [estado] a [estado],
para continuar o cerrar [proceso].
```

## Supervisión

```text
Como [supervisor],
quiero revisar [información o solicitud],
para aprobar, rechazar o corregir [resultado].
```

## Métrica

```text
Como [actor],
quiero conocer [indicador],
para tomar [decisión].
```

## Administración funcional

```text
Como [administrador funcional],
quiero mantener [catálogo, miembro o configuración],
para que la operación use información vigente.
```

### Regla

Los patrones no introducen capacidades.

Solo convierten requisitos ya activados en historias.

---

# 12. PATRONES DE CRITERIOS DE ACEPTACIÓN

Los criterios finales deben seguir `base/acceptance-criteria.md`.

## Acceso

Cuando la identidad está activa, considerar:

```text
un usuario autorizado accede a la información permitida
un acceso inválido es rechazado
un actor no puede acceder a funciones restringidas
el rechazo no expone información protegida
```

## Registro

Cuando existe creación o registro:

```text
información válida produce un resultado observable
información inválida no produce un registro aceptado
el usuario conoce qué dato debe corregir
el resultado puede consultarse en el flujo correspondiente
```

## Edición

Cuando existe modificación:

```text
solo actores autorizados pueden modificar
los cambios válidos quedan reflejados
las restricciones del estado se respetan
un cambio inválido no reemplaza información válida
```

## Cambio de estado

```text
solo transiciones permitidas pueden completarse
el resultado muestra el nuevo estado
una transición inválida es rechazada
las consecuencias del cambio quedan reflejadas
```

## Dashboard o métrica

```text
el indicador responde una pregunta definida
usa el contexto o período correspondiente
distingue ausencia de datos de un valor real
no muestra información fuera del permiso del actor
```

## Separación por organización

```text
un miembro consulta únicamente información de su organización
un actor autorizado administra solo el espacio que le corresponde
los datos de organizaciones diferentes no se mezclan
```

No convertir estas frases en criterios finales sin actores, entidades y condiciones reales.

---

# 13. REQUISITOS NO FUNCIONALES RELEVANTES

Incorporar solo cuando exista soporte contextual.

## Usabilidad

Puede ser relevante cuando el producto se usa diariamente o por usuarios no técnicos.

No escribir:

```text
interfaz moderna
interfaz intuitiva
```

Definir comportamientos observables.

## Accesibilidad

Aplicar según las reglas generales del motor y necesidades del público.

No inventar un estándar específico si el contexto no lo exige.

## Privacidad y confidencialidad

Activar cuando existen datos personales, comerciales o sensibles.

Describir:

```text
quién puede consultar
qué debe permanecer restringido
qué datos no deben exponerse
```

## Rendimiento

Relacionar con:

```text
volumen esperado
frecuencia de uso
flujo crítico
```

No inventar segundos exactos.

## Disponibilidad

Incluir solo si el negocio depende de acceso continuo o de horarios definidos.

## Localización

Activar si el público, idioma, moneda, zona horaria o formato regional lo requiere.

## Escalabilidad

No usar como excusa para diseñar una solución enterprise.

El PRD puede indicar crecimiento esperado sin decidir arquitectura.

---

# 14. RIESGOS ESPECÍFICOS DEL DOMINIO

Evaluar solo los aplicables.

## Alcance inflado por patrones SaaS

Riesgo:

```text
agregar roles, dashboard, billing, notificaciones y reportes
sin que el contexto los requiera
```

## Modelo de permisos ambiguo

Riesgo:

```text
actores con acciones no definidas
acceso excesivo
contradicciones entre secciones
```

## Entidad principal mal identificada

Riesgo:

```text
construir el producto alrededor de un registro que no representa el proceso real
```

## CRUD como sustituto del workflow

Riesgo:

```text
permitir editar o borrar cuando el negocio requiere estados, cierres o aprobaciones
```

## Métricas sin decisión

Riesgo:

```text
mostrar números que no ayudan al usuario a actuar
```

## Multi-tenancy asumido

Riesgo:

```text
introducir complejidad de organizaciones cuando el producto sirve a una sola empresa
```

## Billing confundido con modelo comercial

Riesgo:

```text
implementar cobros dentro del producto solo porque se comercializa como SaaS
```

## Automatización sin excepciones

Riesgo:

```text
definir un flujo ideal sin contemplar rechazo, cancelación o corrección
```

## Datos históricos no definidos

Riesgo:

```text
modificar registros críticos sin conservar el contexto necesario para cierres o auditoría
```

## Uso móvil o escritorio asumido

Riesgo:

```text
tomar decisiones de experiencia sin datos sobre el entorno real de uso
```

---

# 15. TRAMPAS DE ALCANCE

No incorporar automáticamente:

```text
autenticación
recuperación de contraseña
dos roles
administrador
dashboard
CRUD completo
perfil
sidebar
paginación
filtros
notificaciones
auditoría
exportación
multi-tenancy
billing
API pública
webhooks
dark mode
onboarding
```

Cada elemento requiere una condición de activación.

No usar frases como:

```text
todo SaaS necesita
es estándar
es buena práctica
puede servir más adelante
```

Una buena práctica técnica no es automáticamente un requisito de producto.

---

# 16. CLASIFICACIÓN ORIENTATIVA DE ALCANCE

La clasificación final pertenece a `base/product-scope-rules.md`.

## Requeridas bajo condición

```text
identidad, cuando hay datos privados o acciones atribuibles
permisos, cuando los actores tienen responsabilidades distintas
persistencia, cuando el producto conserva estado
workflow, cuando el objeto evoluciona
separación organizacional, cuando hay organizaciones independientes
```

## Condicionales

```text
gestión de usuarios
dashboard
búsqueda
filtros
colaboración
configuración
notificaciones
historial
reportes
exportación
integraciones
```

## Opcionales

```text
onboarding guiado
personalización
preferencias visuales
widgets configurables
atajos
```

## NO INCLUIR POR DEFECTO

```text
multi-tenancy no solicitado
billing no solicitado
múltiples planes
API pública general
marketplace de extensiones
analítica avanzada
automatizaciones secundarias
personalización enterprise
recomendaciones
funciones de IA no solicitadas
```

Una capacidad NO INCLUIR POR DEFECTO puede ingresar al complete product scope si es parte explícita
del valor central.

---

# 17. MAPEO DESDE `project-context.md`

Usar los campos reales disponibles.

## `project_name`

Aporta identidad.

No determina funcionalidades.

## `purpose`

Aporta el resultado principal esperado.

Debe guiar el problema, los flujos y el complete product scope.

## `project_type`

Activa esta plantilla después de normalización.

No activa módulos automáticamente.

## `client_profile.audience`

Ayuda a identificar usuarios y stakeholders.

## `client_profile.persona`

Ayuda a definir el actor primario.

No crear actores secundarios sin evidencia.

## `client_profile.primary_actions`

Es una fuente principal para:

```text
necesidades
flujos
requisitos
historias
```

## `complete_product_scope.must_have_features`

Es Fuente autoritativa de prioridad de construccion.

Cada función debe rastrearse hasta requisitos, historias y criterios.

## `scale.expected_volume`

Puede activar consideraciones de consulta, rendimiento o separación.

No autoriza umbrales inventados.

## `brand.visual_style`

Aporta contexto de identidad visual.

No debe convertirse en requisito funcional.

## `brand.reference_url` y notas

Pueden aportar expectativas de experiencia.

No deben copiarse como arquitectura ni como lista automática de funciones.

---

# 18. PROTOCOLO DE GENERACIÓN SaaS

Después de seleccionar esta plantilla:

```text
1. Identificar la variante SaaS predominante.
2. Extraer actores explícitos.
3. Extraer acciones principales.
4. Identificar la operación o resultado central.
5. Revisar capacidades del dominio.
6. Activar solo las capacidades cuya condición esté presente.
7. Aplicar ambiguity-rules.md a cada faltante.
8. Derivar flujos completos.
9. Derivar requisitos y reglas de negocio.
10. Crear historias y criterios.
11. Clasificar complete product scope, Deferred Scope y Out of Scope.
12. Registrar decisiones y supuestos en prd.md.
13. Renderizar con prd-base.md.
14. Autoevaluar con validation-rules.md.
```

---

# 19. REGISTRO EN `prd.md`

Cuando esta plantilla se use, registrar:

```text
template = project-types/saas/prd-template.md
saas_variant
activated_capabilities
rejected_capabilities
conditional_capabilities
scope_decisions
ambiguity_resolutions
unsupported_patterns_not_added
```

Ejemplo conceptual:

```markdown
## SaaS Template Decisions

- Variant: internal operational SaaS
- Activated:
  - identity, because actions belong to employees;
  - operational records, because completed services must be stored;
  - periodic closing, because monthly commissions are required.
- Not activated:
  - billing;
  - multi-tenancy;
  - customer-facing accounts;
  - generic KPI dashboard.
```

No crear otro archivo para estas decisiones.

---

# 20. VALIDACIÓN ESPECÍFICA SaaS

Antes de aceptar el PRD, comprobar:

```text
[ ] La variante SaaS está justificada.
[ ] El problema no se redujo a “necesita un dashboard”.
[ ] Los actores provienen del contexto.
[ ] No se crearon roles genéricos.
[ ] Las operaciones de entidad provienen de flujos.
[ ] No se forzó CRUD completo.
[ ] El dashboard existe solo si hay métricas útiles.
[ ] Cada métrica responde una pregunta.
[ ] Multi-tenancy no fue asumido.
[ ] Billing no fue asumido.
[ ] La autenticación no fue asumida sin condición.
[ ] Los permisos reflejan responsabilidades reales.
[ ] Los estados y reglas no fueron inventados.
[ ] Los umbrales numéricos tienen fuente.
[ ] No hay decisiones técnicas.
[ ] No existe un Implementation Plan.
[ ] No se duplicó la estructura de prd-base.md.
[ ] Los elementos opcionales no inflaron el complete product scope.
```

Hallazgos posibles, además de los generales:

```text
PRD_SAAS_VARIANT_UNSUPPORTED
PRD_SAAS_ROLE_INVENTED
PRD_SAAS_CRUD_ASSUMED
PRD_SAAS_DASHBOARD_UNGROUNDED
PRD_SAAS_METRIC_UNGROUNDED
PRD_SAAS_MULTITENANCY_ASSUMED
PRD_SAAS_BILLING_ASSUMED
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
definir stack
definir JWT
definir RBAC como implementación
definir tablas
definir APIs
definir soft delete
definir paginación exacta
definir tiempos de respuesta inventados
definir duración de sesión inventada
definir resolución de pantalla
definir cantidad fija de KPIs
definir dos roles obligatorios
definir Admin como actor universal
definir CRUD como patrón universal
```

---

# 22. INTEGRACIÓN

Invocado por:

```text
prd-spec-generator
```

Condición:

```text
normalized_project_type == "saas"
```

También puede cubrir alias como `dashboard` cuando `template-registry.json` los normalice
a `saas`.

No escribe archivos directamente.

No modifica `prd.md`.

No es leído obligatoriamente por `prd-validation-gate` durante un PASS normal.

Puede ser consultado en reparación cuando el hallazgo se relaciona con viabilidad o
alcance específico del dominio SaaS.

---

# 23. REGLA FINAL

No conviertas un proyecto en un SaaS genérico.

Usa esta plantilla para comprender el dominio y derivar únicamente el producto que el
cliente describió.

Cuando una capacidad común no está respaldada por el contexto:

```text
no la agregues
```

Cuando una capacidad es necesaria para que una función explícita sea viable:

```text
actívala en su forma mínima
registra la razón
mantén neutralidad técnica
```
