---
name: ecommerce-prd-template
description: |
  Plantilla interna de conocimiento de dominio para productos e-commerce.
  Ayuda a prd-spec-generator a detectar modelos de venta, capacidades, actores,
  flujos, reglas comerciales, dependencias y límites propios del comercio digital
  sin convertir patrones comunes en requerimientos obligatorios.
allowed-tools: [Read]
applyTo: ["**/project-context.md", "**/prd.md"]
bawe_network_role: prd-domain-template
bawe_dependencies_on:
  - {skill: prd-spec-generator, relation_type: invocado-por}
bawe_depended_by: []
---

# BAWE PRD DOMAIN TEMPLATE — E-commerce

Version: 1.0  
Status: Stable domain template

## 1. PROPÓSITO

Este archivo aporta conocimiento específico del dominio e-commerce a
`prd-spec-generator`.

No es un PRD terminado.

No define la estructura final de `prd.md`.

No contiene funcionalidades que deban copiarse automáticamente.

No autoriza al generador a inventar catálogo, carrito, checkout, pagos, cuentas,
promociones, logística, impuestos, stock, devoluciones ni panel administrativo.

Su función es ayudar al LLM a responder:

```text
¿Qué modelo de comercio describe el contexto?
¿Qué se vende?
¿Quién compra y quién opera?
¿Qué capacidades son necesarias para completar la transacción?
¿Qué dependencias externas existen?
¿Qué reglas comerciales deben definirse?
¿Qué riesgos y límites deben quedar explícitos?
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
project_type = ecommerce
```

La normalización puede provenir de términos como:

```text
ecommerce
e-commerce
tienda online
comercio electrónico
venta online
catálogo con compra
shop
store
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
→ necesidad comercial
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
presentar una oferta vendible
permitir seleccionar productos o servicios
recibir pedidos
procesar una transacción comercial
coordinar pago, entrega o acceso
administrar disponibilidad, precio o cumplimiento
permitir seguimiento de una compra
```

Ejemplos compatibles:

- tienda de productos físicos;
- venta de productos digitales;
- venta de servicios con compra directa;
- catálogo con pedido y pago;
- comercio B2C;
- comercio B2B;
- venta por encargo;
- venta con retiro;
- venta con entrega;
- suscripción comercial cuando el producto principal es la compra recurrente;
- tienda de un único vendedor;
- catálogo de preventa.

---

# 4. CUÁNDO NO APLICARLA

No aplicar como plantilla principal cuando el producto es esencialmente:

```text
un catálogo informativo sin transacción
una landing de producto
un marketplace multi-vendedor
un sistema de reservas sin compra
un sistema de cotizaciones sin pedido
un SaaS operativo cuyo módulo de ventas es secundario
un sitio institucional con formulario de contacto
```

La existencia de productos, precios o imágenes no basta para clasificar el proyecto
como e-commerce.

Debe existir una intención real de:

```text
comprar
pedir
pagar
reservar con compromiso comercial
o completar una transacción equivalente
```

---

# 5. VARIANTES E-COMMERCE SOPORTADAS

Antes de derivar capacidades, clasificar la variante predominante.

Puede existir más de una, pero debe identificarse una principal.

## 5.1 Productos físicos B2C

Señales:

```text
consumidor final
catálogo
precio público
entrega o retiro
pedido individual
```

Valor típico:

```text
permitir compra directa y cumplimiento del pedido
```

Puede requerir:

```text
carrito
checkout
pago
dirección
envío
stock
seguimiento
```

pero ninguna capacidad se activa sin la condición correspondiente.

## 5.2 Productos físicos B2B

Señales:

```text
empresas compradoras
listas de precios
cantidades mínimas
condiciones comerciales
aprobación
cuenta corriente
cotización
```

Valor típico:

```text
digitalizar pedidos entre empresas
```

No asumir:

```text
precio público
pago inmediato
checkout B2C
guest checkout
```

## 5.3 Productos digitales

Señales:

```text
archivo
licencia
acceso
descarga
entrega inmediata
sin envío físico
```

Valor típico:

```text
entregar acceso digital después de una condición comercial válida
```

Puede requerir:

```text
entrega digital
control de acceso
licencia
límite de descarga
```

No requiere logística física.

## 5.4 Servicios comprables

Señales:

```text
servicio
fecha
duración
turno
capacidad
compra o reserva
```

Valor típico:

```text
permitir seleccionar y contratar un servicio
```

Puede combinar comercio con agenda.

No asumir que el carrito es necesario.

## 5.5 Pedido sin pago online

Señales:

```text
pedido
pago contra entrega
transferencia
confirmación manual
cotización
contacto posterior
```

Valor típico:

```text
capturar y organizar la intención de compra
```

No asumir pasarela de pago.

## 5.6 Compra recurrente o suscripción comercial

Señales:

```text
renovación
entrega periódica
membresía
pago recurrente
```

Valor típico:

```text
mantener una relación comercial periódica
```

No activar billing recurrente solo por la palabra SaaS o suscripción sin evidencia.

## 5.7 Venta de un único producto

Señales:

```text
un producto principal
una oferta
una landing transaccional
sin catálogo amplio
```

Valor típico:

```text
reducir fricción y completar una compra concreta
```

Puede no necesitar:

```text
categorías
búsqueda
filtros
carrito
cuenta de comprador
```

## 5.8 Preventa o venta por encargo

Señales:

```text
reserva
seña
fecha futura
cupo
producción posterior
```

Valor típico:

```text
capturar demanda antes de disponibilidad inmediata
```

Debe definir:

```text
condición de reserva
confirmación
cancelación
fecha esperada
```

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
completar la transacción.

## 6.2 Condicional

La capacidad puede ser necesaria, pero depende del modelo comercial o de una decisión
del cliente.

## 6.3 Opcional

Puede mejorar la experiencia o conversión, pero no entra al complete product scope sin justificación.

## 6.4 NO INCLUIR POR DEFECTO

Se excluye salvo que constituya parte explícita del núcleo del producto.

La clasificación final pertenece a `base/product-scope-rules.md`.

---

# 7. CAPACIDADES DEL DOMINIO

## 7.1 Oferta vendible

### Activar cuando

```text
existe algo que el cliente puede comprar, pedir o contratar
```

### Puede representar

```text
producto
variante
servicio
plan
paquete
licencia
reserva
```

### Debe derivarse

```text
nombre
información necesaria para decidir
precio o forma de cotización
disponibilidad
condiciones relevantes
```

### Alcance por defecto

```text
REQUERIDA BAJO CONDICIÓN
```

### No asumir

```text
categorías
SKU
variantes
múltiples imágenes
descripción extensa
precio público
```

## 7.2 Catálogo

### Activar cuando

```text
hay más de una oferta
el comprador necesita explorar
existen grupos o categorías útiles
```

### Comportamiento mínimo

```text
consultar ofertas disponibles
distinguir información relevante
abrir el detalle cuando sea necesario
```

### Alcance por defecto

```text
REQUERIDA BAJO CONDICIÓN
```

### No asumir

```text
categorías
filtros
búsqueda
orden
paginación
grilla
```

## 7.3 Detalle de producto o servicio

### Activar cuando

```text
la decisión requiere información adicional
existen opciones
hay condiciones comerciales
la compra no puede resolverse desde un listado
```

### Debe derivarse

```text
información esencial
precio o condición
opciones
disponibilidad
acción principal
restricciones
```

### Alcance por defecto

```text
CONDICIONAL
```

## 7.4 Variantes y opciones

### Activar cuando

```text
el comprador debe elegir talle, color, tamaño, formato, duración u otra opción
```

### Debe derivarse

```text
opciones válidas
combinaciones permitidas
impacto en precio
impacto en disponibilidad
```

### Alcance por defecto

```text
CONDICIONAL
```

### No asumir

```text
SKU por variante
matriz compleja
stock por variante
```

## 7.5 Carrito

### Activar cuando

```text
el comprador puede combinar más de un ítem
necesita revisar una selección antes de confirmar
puede modificar cantidades
```

### Comportamiento mínimo

```text
agregar
consultar selección
modificar cuando corresponda
quitar
conocer total o resumen comercial
```

### Alcance por defecto

```text
REQUERIDA BAJO CONDICIÓN
```

### No asumir

```text
persistencia entre sesiones
carrito para compra de un solo producto
carrito para servicios simples
actualización en tiempo real
```

## 7.6 Compra directa sin carrito

### Activar cuando

```text
se compra una única oferta
la acción puede completarse sin selección acumulativa
```

### Comportamiento mínimo

```text
seleccionar oferta
aportar datos necesarios
confirmar
completar pago o pedido
```

### Alcance por defecto

```text
CONDICIONAL
```

## 7.7 Checkout

### Activar cuando

```text
el comprador debe revisar y confirmar la transacción
debe aportar datos comerciales
debe elegir entrega o pago
```

### Debe derivarse

```text
resumen
datos requeridos
condiciones
método de cumplimiento
método de pago si aplica
confirmación final
```

### Alcance por defecto

```text
REQUERIDA BAJO CONDICIÓN
```

### No asumir

```text
una sola página
múltiples pasos
registro obligatorio
dirección
envío
pago online
```

## 7.8 Identidad del comprador

### Activar cuando

```text
se necesita historial
existe seguimiento personal
hay beneficios asociados
se requiere acceso posterior
la compra está vinculada a una cuenta
```

### Posibles modelos

```text
compra como invitado
cuenta opcional
cuenta obligatoria
cuenta empresarial
```

### Alcance por defecto

```text
CONDICIONAL
```

### No asumir

```text
registro
login
guest checkout
recuperación de contraseña
```

## 7.9 Datos del comprador

### Activar cuando

```text
la transacción requiere identificación, contacto, facturación o entrega
```

### Debe derivarse

```text
dato
motivo
momento
obligatoriedad
uso
```

### Alcance por defecto

```text
REQUERIDA BAJO CONDICIÓN
```

### No asumir

```text
todos los datos de dirección
documento
teléfono
facturación
```

Solo pedir datos necesarios.

## 7.10 Pago

### Activar cuando

```text
el producto debe cobrar dentro del flujo
```

### Diferenciar

```text
pago online
transferencia
pago contra entrega
seña
pago posterior
pago fuera del sistema
```

### Debe derivarse

```text
momento
estado esperado
confirmación
fallo
cancelación
relación con el pedido
```

### Alcance por defecto

```text
REQUERIDA BAJO CONDICIÓN
```

### No asumir

```text
pasarela
MercadoPago
Stripe
PayPal
webhook
tarjeta
```

El PRD describe la capacidad comercial.

La arquitectura define el mecanismo técnico.

## 7.11 Confirmación de compra o pedido

### Activar cuando

```text
se completa una transacción o intención de compra
```

### Comportamiento mínimo

```text
mostrar resultado
identificar la operación
resumir lo confirmado
indicar próximos pasos
```

### Alcance por defecto

```text
REQUERIDA BAJO CONDICIÓN
```

### No asumir

```text
email
SMS
página de éxito
notificación push
```

## 7.12 Pedido

### Activar cuando

```text
la transacción debe persistir y ser operada
```

### Debe derivarse

```text
contenido
comprador
importe o condición comercial
estado
cumplimiento
```

### Alcance por defecto

```text
REQUERIDA BAJO CONDICIÓN
```

### No asumir

```text
paid
processing
shipped
delivered
```

## 7.13 Estados del pedido

### Activar cuando

```text
el pedido evoluciona antes de completarse
```

### Debe derivarse

```text
estado inicial
transiciones
actor
condición
resultado
cancelación
```

### Alcance por defecto

```text
REQUERIDA BAJO CONDICIÓN
```

### No asumir una secuencia universal

```text
pending → paid → processing → shipped → delivered
```

Un producto digital o un pedido manual puede tener otro flujo.

## 7.14 Entrega física

### Activar cuando

```text
se venden bienes físicos que deben llegar al comprador
```

### Posibles modelos

```text
envío
retiro
entrega local
transportista externo
acuerdo posterior
```

### Debe derivarse

```text
opciones
costo
zona
plazo
seguimiento si aplica
```

### Alcance por defecto

```text
REQUERIDA BAJO CONDICIÓN
```

### No asumir

```text
cotizador
transportista
número de seguimiento
envío nacional
```

## 7.15 Entrega digital

### Activar cuando

```text
se venden archivos, licencias, accesos o contenido digital
```

### Debe derivarse

```text
qué se entrega
cuándo
a quién
cómo se vuelve a acceder
qué limitaciones existen
```

### Alcance por defecto

```text
REQUERIDA BAJO CONDICIÓN
```

### No asumir

```text
descarga ilimitada
email
licencia permanente
```

## 7.16 Stock y disponibilidad

### Activar cuando

```text
la cantidad disponible afecta la venta
hay unidades limitadas
existen variantes
se debe evitar sobreventa
```

### Debe derivarse

```text
qué se controla
momento de reserva
momento de descuento
qué ocurre sin disponibilidad
qué actor actualiza
```

### Alcance por defecto

```text
CONDICIONAL
```

### No asumir

```text
stock por SKU
umbral de reposición
reserva automática
bloqueo al agregar al carrito
```

El volumen esperado no activa stock por sí solo.

## 7.17 Precios

### Activar cuando

```text
la oferta tiene valor comercial visible o calculable
```

### Posibles modelos

```text
precio fijo
precio por variante
precio por cantidad
precio por cliente
cotización
precio promocional
```

### Debe derivarse

```text
qué ve el comprador
qué confirma
qué puede cambiar
qué incluye
```

### Alcance por defecto

```text
REQUERIDA BAJO CONDICIÓN
```

### No asumir

```text
impuestos incluidos
moneda
redondeo
precio final
lista única
```

## 7.18 Promociones y descuentos

### Activar cuando

```text
client_profile.promotions lo declara
el cliente solicita cupones
existen reglas comerciales de descuento
```

### Debe derivarse

```text
condición
beneficio
vigencia
aplicabilidad
combinación
límite
```

### Alcance por defecto

```text
CONDICIONAL
```

### No asumir

```text
cupones
porcentajes
promociones automáticas
stacking
```

## 7.19 Impuestos y facturación

### Activar cuando

```text
el producto debe calcular, mostrar o emitir información fiscal
```

### Diferenciar

```text
mostrar impuestos
calcular impuestos
solicitar datos fiscales
emitir comprobante
integrarse con autoridad fiscal
```

### Alcance por defecto

```text
CONDICIONAL
```

### No asumir

```text
IVA incluido
AFIP
factura electrónica
tipo de comprobante
```

Las reglas fiscales no se inventan.

## 7.20 Gestión de catálogo

### Activar cuando

```text
alguien debe mantener la oferta
```

### Posibles acciones

```text
crear
publicar
editar
ocultar
archivar
actualizar precio
actualizar disponibilidad
```

### Alcance por defecto

```text
REQUERIDA BAJO CONDICIÓN
```

### No asumir

```text
CRUD completo
borrado
múltiples imágenes
categorías
panel admin
```

## 7.21 Gestión de pedidos

### Activar cuando

```text
el negocio debe revisar, preparar, aprobar, entregar o cerrar pedidos
```

### Debe derivarse

```text
actor
estados
acciones permitidas
datos visibles
excepciones
```

### Alcance por defecto

```text
REQUERIDA BAJO CONDICIÓN
```

## 7.22 Historial del comprador

### Activar cuando

```text
el comprador tiene cuenta
necesita seguimiento
necesita repetir o consultar compras
```

### Alcance por defecto

```text
CONDICIONAL
```

### No asumir

```text
cuenta obligatoria
recompra
descarga de factura
```

## 7.23 Cancelaciones

### Activar cuando

```text
el negocio permite cancelar
el estado del pedido puede revertirse
```

### Debe derivarse

```text
quién puede cancelar
hasta cuándo
con qué efecto
qué ocurre si hubo pago
```

### Alcance por defecto

```text
CONDICIONAL
```

## 7.24 Devoluciones y reembolsos

### Activar cuando

```text
el modelo comercial lo requiere
la legislación aplicable lo exige
el cliente lo declara
```

### Diferenciar

```text
solicitud de devolución
aprobación
recepción
reembolso
cambio
```

### Alcance por defecto

```text
NO INCLUIR POR DEFECTO
```

Puede ser complete product scope si es esencial o explícito.

### No asumir

```text
plazos
condiciones
automatización
```

## 7.25 Búsqueda, filtros y orden

### Activar cuando

```text
el comprador necesita localizar ofertas
el catálogo tiene volumen o complejidad
existen atributos relevantes
```

### Alcance por defecto

```text
CONDICIONAL
```

### No asumir

```text
más de 50 productos
filtros avanzados
orden por precio
búsqueda por categoría
```

## 7.26 Favoritos o wishlist

### Activar cuando

```text
el usuario necesita guardar interés para después
hay recurrencia
la decisión no es inmediata
```

### Alcance por defecto

```text
OPCIONAL
```

No justificarla solo por conversión.

## 7.27 Reseñas y valoraciones

### Activar cuando

```text
la confianza entre compradores forma parte del valor
existe volumen suficiente
el cliente lo solicita
```

### Alcance por defecto

```text
OPCIONAL
```

### Debe derivarse

```text
quién puede opinar
sobre qué
moderación
visibilidad
```

## 7.28 Productos relacionados y recomendaciones

### Activar cuando

```text
el cliente lo solicita
existe una lógica comercial explícita
```

### Alcance por defecto

```text
NO INCLUIR POR DEFECTO
```

No asumir motor de recomendaciones.

## 7.29 Notificaciones transaccionales

### Activar cuando

```text
el comprador u operador necesita conocer un evento fuera del flujo actual
```

### Debe derivarse

```text
evento
destinatario
motivo
canal si está definido
acción esperada
```

### Alcance por defecto

```text
CONDICIONAL
```

### No asumir

```text
email
SMS
WhatsApp
push
```

## 7.30 Integraciones comerciales

### Activar cuando

```text
el flujo depende de pagos, logística, facturación, ERP, CRM u otro sistema
```

### Debe derivarse

```text
sistema
dato o acción
momento
resultado
fallo relevante
```

### Alcance por defecto

```text
CONDICIONAL
```

No definir protocolo técnico.

## 7.31 Marketplace multi-vendedor

### Activar cuando

```text
múltiples vendedores publican y venden
la plataforma intermedia
hay comisiones o liquidaciones
```

### Alcance por defecto

```text
NO INCLUIR POR DEFECTO
```

Si es núcleo explícito, esta plantilla no basta por sí sola y debe complementarse con
conocimiento de marketplace.

No asumir multi-vendedor por tener múltiples marcas o categorías.

---

# 8. ACTORES CANDIDATOS

Estos actores son posibilidades del dominio, no roles obligatorios.

## Comprador

Activa cuando alguien selecciona y confirma una transacción.

## Comprador invitado

Activa cuando se permite comprar sin cuenta.

## Cliente registrado

Activa cuando la cuenta aporta historial, seguimiento o beneficios.

## Comprador empresarial

Activa en B2B con condiciones comerciales específicas.

## Operador de pedidos

Activa cuando alguien prepara, valida o cumple pedidos.

## Administrador comercial

Activa cuando alguien mantiene catálogo, precios o promociones.

## Responsable de stock

Activa cuando el inventario requiere una responsabilidad diferenciada.

## Responsable de logística

Activa cuando entrega o despacho es operado internamente.

## Responsable financiero

Activa cuando pagos, facturación o reembolsos requieren una función específica.

### Regla de actores

No crear un actor porque sea común.

Crear un actor solo cuando tenga:

```text
objetivo
responsabilidad
acción
información o permiso diferenciado
```

---

# 9. FLUJOS CANDIDATOS

Los siguientes son patrones condicionales.

No deben copiarse automáticamente.

## Descubrimiento

```text
entrada
→ exploración
→ consulta de oferta
→ decisión
```

## Compra con carrito

```text
selección
→ carrito
→ revisión
→ datos
→ cumplimiento
→ pago si aplica
→ confirmación
```

## Compra directa

```text
oferta
→ datos
→ confirmación
→ pago o pedido
→ resultado
```

## Pedido sin pago online

```text
selección
→ datos
→ confirmación de pedido
→ revisión comercial
→ pago o cumplimiento posterior
```

## Gestión de pedido

```text
recepción
→ revisión
→ preparación
→ entrega o cumplimiento
→ cierre
```

## Producto digital

```text
selección
→ pago o validación
→ habilitación
→ acceso o descarga
```

## Servicio comprable

```text
selección
→ disponibilidad
→ datos
→ pago o confirmación
→ prestación
```

## Cancelación

```text
solicitud
→ validación de condición
→ cancelación o rechazo
→ efecto comercial
```

## Devolución

```text
solicitud
→ revisión
→ aprobación o rechazo
→ devolución
→ reembolso o cambio
```

---

# 10. REGLAS DE NEGOCIO QUE DEBEN DERIVARSE

Para cada proyecto e-commerce, revisar si existen reglas sobre:

```text
qué se vende
quién puede comprar
qué información se muestra
cómo se determina el precio
qué opciones existen
cuándo hay disponibilidad
qué datos requiere la compra
qué confirma el pedido
qué estados existen
quién cambia estados
cuándo se cobra
qué ocurre ante fallo de pago
cómo se cumple la entrega
qué puede cancelar el comprador
qué puede modificar el operador
cómo funcionan descuentos
cómo se tratan impuestos
qué ocurre con productos inactivos
qué información se conserva
```

No inventar:

```text
precios
porcentajes
impuestos
costos de envío
plazos
estados
políticas
stock
reembolsos
límites
```

Si una regla es necesaria para el flujo principal y no puede derivarse, aplicar:

```text
methodology/ambiguity-rules.md
```

---

# 11. PATRONES DE HISTORIAS DE USUARIO

Estos patrones solo se activan cuando existe el requisito correspondiente.

## Explorar oferta

```text
Como [comprador],
quiero consultar [ofertas],
para decidir qué adquirir.
```

## Seleccionar opción

```text
Como [comprador],
quiero elegir [variante u opción],
para adquirir la configuración que necesito.
```

## Carrito

```text
Como [comprador],
quiero revisar y modificar mi selección,
para confirmar una compra correcta.
```

## Confirmar compra

```text
Como [comprador],
quiero aportar los datos necesarios y confirmar la operación,
para completar mi pedido.
```

## Pago

```text
Como [comprador],
quiero completar el pago según las opciones disponibles,
para validar la transacción.
```

## Seguimiento

```text
Como [comprador],
quiero conocer el estado de mi pedido,
para saber qué ocurrirá a continuación.
```

## Gestión de catálogo

```text
Como [responsable comercial],
quiero mantener [oferta],
para que el comprador vea información vigente.
```

## Gestión de pedido

```text
Como [operador],
quiero avanzar el pedido según las reglas,
para completar su cumplimiento.
```

## Stock

```text
Como [responsable],
quiero conocer y actualizar disponibilidad,
para evitar comprometer unidades inexistentes.
```

## Promoción

```text
Como [comprador],
quiero recibir el beneficio aplicable,
para completar la compra bajo la condición comercial ofrecida.
```

### Regla

Los patrones no introducen capacidades.

Solo convierten requisitos ya activados en historias.

---

# 12. PATRONES DE CRITERIOS DE ACEPTACIÓN

Los criterios finales deben seguir `base/acceptance-criteria.md`.

## Oferta

```text
el comprador distingue la oferta disponible
la información necesaria para decidir está presente
una oferta no disponible no se presenta como comprable
```

## Carrito

```text
agregar una oferta válida actualiza la selección
modificar una cantidad válida actualiza el resumen
quitar un ítem lo excluye del total
una opción inválida es rechazada
```

## Checkout

```text
los datos obligatorios faltantes impiden confirmar
el resumen coincide con la selección
el comprador conoce el resultado de la confirmación
```

## Pago

```text
un pago confirmado produce el estado comercial correspondiente
un pago fallido no se presenta como exitoso
un resultado incierto no duplica la operación
```

## Pedido

```text
el pedido conserva la información confirmada
solo actores autorizados cambian su estado
una transición inválida es rechazada
```

## Stock

```text
la compra respeta disponibilidad cuando el stock está activo
un producto sin disponibilidad no se confirma como vendible
los cambios de disponibilidad se reflejan en el flujo correspondiente
```

## Separación de comprador

```text
un comprador consulta solo sus pedidos cuando existe cuenta
un invitado accede solo mediante el mecanismo definido
```

## Entrega

```text
la opción seleccionada se conserva
el comprador conoce condición y costo antes de confirmar
el estado refleja el progreso real cuando existe seguimiento
```

No convertir estas frases en criterios finales sin actores, ofertas, condiciones y
reglas reales.

---

# 13. REQUISITOS NO FUNCIONALES RELEVANTES

Incorporar solo cuando exista soporte contextual.

## Confianza comercial

Puede requerir:

```text
precios claros
condiciones visibles
confirmaciones observables
mensajes de error comprensibles
```

## Accesibilidad

Aplicar según reglas generales y público.

## Privacidad

Activar cuando se capturan datos personales o comerciales.

## Seguridad del proceso

Describir comportamiento esperado:

```text
evitar acceso indebido
evitar mostrar información de otro comprador
evitar confirmar una operación inválida
```

No describir mecanismos técnicos.

## Rendimiento

Relacionar con:

```text
volumen del catálogo
flujo de compra
frecuencia
contexto móvil o de conectividad
```

No inventar segundos exactos.

## Disponibilidad

Incluir solo si la operación depende de acceso continuo.

## Localización

Activar por:

```text
moneda
idioma
zona
formatos
impuestos
mercado
```

## Compatibilidad móvil

No asumir por defecto.

Activar si el público o las referencias muestran uso móvil relevante.

No fijar anchos de pantalla inventados.

---

# 14. RIESGOS ESPECÍFICOS DEL DOMINIO

Evaluar solo los aplicables.

## Compra incompleta

Riesgo:

```text
el flujo no llega a una confirmación comercial clara
```

## Estado de pago y pedido inconsistente

Riesgo:

```text
un pedido aparece pagado sin confirmación
o el pago se confirma sin pedido utilizable
```

## Stock ambiguo

Riesgo:

```text
sobreventa o bloqueo innecesario
```

## Costos inesperados

Riesgo:

```text
envío, impuestos o cargos aparecen demasiado tarde
```

## Datos excesivos

Riesgo:

```text
pedir información no necesaria aumenta fricción y exposición
```

## Estados genéricos

Riesgo:

```text
usar pending, paid, shipped sin representar el proceso real
```

## Admin universal

Riesgo:

```text
dar todas las responsabilidades a un actor genérico
```

## Catálogo forzado

Riesgo:

```text
usar categorías, filtros y carrito en una oferta simple
```

## Pago online asumido

Riesgo:

```text
forzar pasarela cuando el negocio opera por transferencia, contra entrega o cotización
```

## Guest checkout asumido

Riesgo:

```text
permitir o prohibir compra sin cuenta sin evidencia
```

## Devoluciones ignoradas

Riesgo:

```text
el negocio requiere políticas postventa y el PRD no las contempla
```

## Dependencias externas no definidas

Riesgo:

```text
el flujo depende de pago, logística o facturación sin comportamiento ante fallo
```

---

# 15. TRAMPAS DE ALCANCE

No incorporar automáticamente:

```text
catálogo con categorías
detalle de producto
carrito
checkout
pago online
guest checkout
cuenta de comprador
historial
panel admin
CRUD completo
stock
variantes
cupones
wishlist
reseñas
recomendaciones
notificaciones
logística
facturación
devoluciones
reembolsos
```

Cada elemento requiere una condición de activación.

No usar frases como:

```text
todo ecommerce necesita
es estándar
mejora conversión
es buena práctica
```

Una práctica común no es automáticamente un requisito de producto.

---

# 16. CLASIFICACIÓN ORIENTATIVA DE ALCANCE

La clasificación final pertenece a `base/product-scope-rules.md`.

## Requeridas bajo condición

```text
oferta vendible
mecanismo de selección
confirmación comercial
pedido, cuando debe persistir
pago, cuando se cobra dentro del flujo
entrega, cuando existe cumplimiento físico o digital
```

## Condicionales

```text
catálogo
detalle
variantes
carrito
identidad
historial
stock
promociones
búsqueda
filtros
notificaciones
integraciones
gestión de catálogo
gestión de pedidos
```

## Opcionales

```text
wishlist
reseñas
personalización
productos relacionados simples
```

## NO INCLUIR POR DEFECTO

```text
marketplace multi-vendedor
recomendaciones avanzadas
programa de fidelidad
motor promocional complejo
múltiples pasarelas
devoluciones automatizadas
facturación fiscal compleja
integraciones logísticas avanzadas
API pública
```

Una capacidad puede ingresar al complete product scope si es parte explícita del valor central.

---

# 17. MAPEO DESDE `project-context.md`

## `project_name`

Aporta identidad.

No determina funcionalidades.

## `purpose`

Define el resultado comercial principal.

## `project_type`

Activa esta plantilla después de normalización.

## `client_profile.audience`

Ayuda a identificar compradores y stakeholders.

## `client_profile.persona`

Ayuda a definir el actor comprador principal.

No crear administrador automáticamente.

## `client_profile.primary_actions`

Fuente principal para:

```text
descubrir
seleccionar
comprar
pedir
pagar
seguir
administrar
```

## `client_profile.commerce`

Fuente principal para:

```text
qué se vende
modelo de venta
cumplimiento
pago
tipo de comprador
```

## `client_profile.promotions`

Activa análisis de promociones.

No obliga a incluir cupones.

## `complete_product_scope.must_have_features`

Fuente autoritativa de prioridad de construccion.

Cada función debe rastrearse hasta requisitos, historias y criterios.

## `scale.expected_volume`

Puede activar:

```text
búsqueda
filtros
stock
operación de pedidos
```

No autoriza umbrales inventados.

## `brand.visual_style`

Aporta contexto visual.

No se convierte en requisito funcional.

## `brand.reference_url` y notas

Pueden aportar expectativas de experiencia.

No deben copiarse como arquitectura ni como lista automática de funciones.

---

# 18. PROTOCOLO DE GENERACIÓN E-COMMERCE

Después de seleccionar esta plantilla:

```text
1. Identificar la variante de comercio.
2. Identificar qué se vende.
3. Identificar comprador y actores operativos.
4. Determinar si hay transacción real.
5. Determinar si hay pago dentro del producto.
6. Determinar cómo se cumple la compra.
7. Revisar capacidades del dominio.
8. Activar solo las capacidades cuya condición exista.
9. Aplicar ambiguity-rules.md a cada faltante.
10. Derivar flujos completos.
11. Derivar requisitos y reglas comerciales.
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
template = project-types/ecommerce/prd-template.md
ecommerce_variant
sellable_offer
buyer_model
payment_model
fulfillment_model
activated_capabilities
rejected_capabilities
conditional_capabilities
scope_decisions
ambiguity_resolutions
unsupported_patterns_not_added
```

Ejemplo conceptual:

```markdown
## E-commerce Template Decisions

- Variant: physical products B2C
- Payment model: bank transfer outside platform
- Fulfillment: local pickup
- Activated:
  - catalog;
  - cart;
  - order confirmation;
  - order management.
- Not activated:
  - online payment gateway;
  - shipping calculator;
  - buyer account;
  - wishlist;
  - reviews.
```

No crear otro archivo para estas decisiones.

---

# 20. VALIDACIÓN ESPECÍFICA E-COMMERCE

Antes de aceptar el PRD, comprobar:

```text
[ ] La variante e-commerce está justificada.
[ ] Se identifica qué se vende.
[ ] Se identifica quién compra.
[ ] El flujo termina en una confirmación comercial clara.
[ ] El pago existe solo si está activado.
[ ] El carrito existe solo si es necesario.
[ ] La cuenta de comprador no fue asumida.
[ ] Guest checkout no fue asumido.
[ ] Los estados del pedido representan el proceso real.
[ ] Stock no fue activado solo por volumen.
[ ] Promociones no fueron convertidas automáticamente en cupones.
[ ] Entrega física o digital está definida cuando aplica.
[ ] No se inventaron impuestos, costos ni plazos.
[ ] No se forzó panel admin ni CRUD completo.
[ ] No se inventó una pasarela.
[ ] No hay decisiones técnicas.
[ ] No existe un Implementation Plan.
[ ] No se duplicó la estructura de prd-base.md.
[ ] Los elementos opcionales no inflaron el complete product scope.
```

Hallazgos posibles, además de los generales:

```text
PRD_ECOMMERCE_VARIANT_UNSUPPORTED
PRD_ECOMMERCE_PAYMENT_ASSUMED
PRD_ECOMMERCE_CART_ASSUMED
PRD_ECOMMERCE_GUEST_ASSUMED
PRD_ECOMMERCE_STOCK_ASSUMED
PRD_ECOMMERCE_ORDER_STATE_INVENTED
PRD_ECOMMERCE_FULFILLMENT_UNDEFINED
PRD_ECOMMERCE_TAX_RULE_INVENTED
PRD_ECOMMERCE_ADMIN_ASSUMED
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
definir webhooks
definir pasarelas concretas
definir tablas
definir soft delete
definir estados universales
definir umbrales de catálogo
definir tiempos de respuesta inventados
definir tamaños de imagen
definir anchos de pantalla
definir email como canal obligatorio
definir guest checkout
definir un Admin universal
definir CRUD como patrón universal
definir AFIP o reglas fiscales sin fuente
```

---

# 22. INTEGRACIÓN

Invocado por:

```text
prd-spec-generator
```

Condición:

```text
normalized_project_type == "ecommerce"
```

También puede cubrir alias como:

```text
e-commerce
tienda online
comercio electrónico
shop
store
```

cuando `template-registry.json` los normalice a `ecommerce`.

No escribe archivos directamente.

No modifica `prd.md`.

No es leído obligatoriamente por `prd-validation-gate` durante un PASS normal.

Puede ser consultado en reparación cuando el hallazgo se relaciona con viabilidad o
alcance específico del dominio e-commerce.

---

# 23. REGLA FINAL

No conviertas una idea comercial en una tienda genérica.

Usa esta plantilla para comprender la transacción real y derivar únicamente las
capacidades necesarias para completarla.

Cuando una capacidad común no está respaldada por el contexto:

```text
no la agregues
```

Cuando una capacidad es necesaria para que una compra explícita sea viable:

```text
actívala en su forma mínima
registra la razón
mantén neutralidad técnica
```
