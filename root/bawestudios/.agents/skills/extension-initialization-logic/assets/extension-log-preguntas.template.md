# extension-log-preguntas.md — Template
# Generado por: extension-initialization-logic
# USAR: copiar a [PROJECT_ROOT]/.bawe/extension-log-preguntas.md al recibir
# un item clasificado Extensión desde edit-intake.

Esta entrevista es deliberadamente más chica que `log-preguntas.md` del
producto original: cubre una sola feature nueva sobre un producto que ya
existe, no un producto entero. No se usa clasificación de confianza,
matriz de gaps ni métricas — ese aparato existe en la entrevista madre
porque errar el modelo de negocio completo es caro; acá el radio es una
sola capacidad, y el `extension-prd-validation-gate` ya cubre completitud.

```markdown
# Extension Interview Log

## Estado de entrevista

- Ultima pregunta completada: [ULTIMA_PREGUNTA_COMPLETADA]
- Siguiente pregunta pendiente: [SIGUIENTE_PREGUNTA_PENDIENTE]

## Pedido original del cliente (ya respondido, viene de edit-intake)

- Descripcion: [client_request_raw]
- Imagen adjunta: [ruta bajo PROJECT_ROOT, o ninguna]

## Preguntas y respuestas

| ID | Pregunta | Respuesta | Notas |
|----|----------|-----------|-------|
| E1 | Qué parte / qué querés que exista (ya capturado por edit-intake) | [ver Pedido original] | ALWAYS_ANSWERED |
| E2 | Confirmación de superficie/pantalla | [respuesta o NO_APLICA] | solo si E1 no deja claro dónde vive |
| E3 | Propósito y flujo principal: qué pasa cuando se usa | [respuesta] | ALWAYS_REQUIRED |
| E4 | Quién puede usarlo/dispararlo (roles) | [respuesta o NO_APLICA] | solo si el producto tiene roles |
| E5 | Qué datos necesita recordar o guardar | [respuesta o NO_APLICA] | solo si aplica |
| E6 | Se conecta con algo externo (WhatsApp, email, otro servicio) | [respuesta o NO_APLICA] | solo si el pedido lo sugiere |
| E7 | Para esta primera versión, qué es lo mínimo que te dejaría conforme / qué no hace falta todavía | [respuesta] | ALWAYS_REQUIRED |

## Resumen de cierre

- Resumen en criollo confirmado con el cliente: [texto]
- Fuera de alcance para esta versión: [lista o ninguna]
```
