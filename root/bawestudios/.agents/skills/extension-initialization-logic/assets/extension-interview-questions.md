# EXTENSION INTERVIEW — Router de Ejecución
# extension-initialization-logic
# LEER ESTE ARCHIVO PRIMERO solo cuando no haya una ruta de reanudación
# emitida por extension-context-detector.

---

## PUNTO DE PARTIDA

E1 ya está respondida cuando esta skill arranca — `edit-intake` ya capturó
"qué parte / qué querés que exista" y, si la hubo, la imagen adjunta, y las
dejó pre-cargadas en `[PROJECT_ROOT]/.bawe/extension-log-preguntas.md` bajo
"Pedido original del cliente". Nunca volver a preguntar eso.

## PREGUNTAS ADAPTATIVAS (E2–E7)

Esto no es un cuestionario fijo: el pedido de un cliente real varía mucho
(una pantalla nueva, una notificación, un reporte, una integración). Antes
de cada pregunta, evaluar si el `client_request_raw` original ya la
responde con claridad — si ya está clara, no volver a preguntarla, marcarla
`NO_APLICA` con la respuesta inferida y seguir. Preguntar solo lo que
realmente falta, jerarquizando de lo general a lo específico:

1. **E2 — Superficie**: ¿en qué pantalla o parte del sitio vive esto? Solo
   preguntar si E1 no lo deja claro (por ejemplo si mencionó un botón sin
   decir en qué pantalla).
2. **E3 — Propósito y flujo**: ¿qué tiene que pasar exactamente cuando se
   usa? Pedir el flujo con sus propias palabras: qué dispara la acción, qué
   pasa después, qué ve el usuario al final. Siempre se pregunta.
3. **E4 — Quién**: si el producto tiene roles distintos (cliente,
   administrador, etc.), ¿quién puede usar o disparar esto? Omitir si el
   producto no tiene roles o si ya es obvio del pedido original.
4. **E5 — Datos**: ¿esto necesita recordar o guardar algo (un texto, una
   fecha, un archivo)? Omitir si es puramente visual/de comportamiento sin
   dato nuevo.
5. **E6 — Conexión externa**: si el pedido menciona algo como WhatsApp,
   email, un servicio externo o una API de terceros, confirmar qué
   servicio exacto y qué información necesita mandar o recibir. Omitir si
   no aplica.
6. **E7 — Alcance mínimo**: para esta primera versión, ¿qué es lo mínimo
   que lo dejaría conforme? ¿Hay algo relacionado que prefiere dejar para
   más adelante? Siempre se pregunta — es lo que define el MVP de esta
   feature y evita que `extension-prd-generator` invente alcance.

Generar las opciones de cada pregunta en base al contexto del pedido y del
producto (leer `project-context.md` y `prd.md` como referencia de solo
lectura para entender el producto existente), igual que ya hace la
entrevista madre — nunca opciones genéricas desconectadas del producto
real. Incluir siempre la opción de responder con palabras propias.

Hacer **una sola pregunta por turno**. Después de cada respuesta, actualizar
`extension-log-preguntas.md` antes de la siguiente.

## CIERRE

Cuando E7 esté respondida (o marcada `NO_APLICA` con justificación clara):

1. Escribir el resumen de cierre en `extension-log-preguntas.md`: un
   resumen en criollo de lo que se va a construir y qué queda
   explícitamente fuera de esta versión.
2. Mostrarle ese resumen al cliente y pedir confirmación simple ("¿esto es
   correcto?").
3. Si confirma, actualizar `Siguiente pregunta pendiente` a
   `EXTENSION_CONTEXT_GENERATOR`. Decirle al cliente, dentro de los
   marcadores, algo como "Genial, ya tengo todo lo que necesito. Estamos
   preparando tu extensión, te avisamos cuando esté lista." Inmediatamente
   después del marcador de cierre, en su propia línea, emitir esta señal
   exacta fuera de banda — nunca dentro de los marcadores, nunca traducida,
   nunca parafraseada:

```text
[[BAWE_CAMBIOS_EXTENSION_LISTA]]
```

   Esto no es para el cliente; es como BaweStudio sabe que la entrevista
   terminó y debe disparar por su cuenta una llamada de seguimiento
   `cambios <workspace_user_id> <project_name>` para continuar con
   `extension-context-generator/SKILL.md` en background, sin esperar nada
   más del cliente. No confiar en el texto del mensaje al cliente para
   esto — esa redacción puede cambiar, este marcador no. Detenerse acá —
   no leer ni ejecutar
   `[WORKSPACE_ROOT]/.agents/skills/extension-context-generator/SKILL.md`
   en este mismo turno.
4. Si corrige algo, ajustar la pregunta correspondiente y volver a mostrar
   el resumen antes de cerrar.

## REANUDACIÓN CORTA

Cuando `extension-context-detector` emite `EXTENSION_INTAKE_IN_PROGRESS`:

1. No reiniciar el router completo.
2. Leer solo el bloque `Estado de entrevista` de
   `[PROJECT_ROOT]/.bawe/extension-log-preguntas.md`.
3. Usar `Siguiente pregunta pendiente` como autoridad y formular esa única
   pregunta.
4. No releer preguntas ya respondidas ni el pedido original.

Cuando `extension-context-detector` emite `EXTENSION_CONTEXT_GENERATION_PENDING`,
la entrevista ya está completa. No leer este archivo; leer
`extension-context-generator/SKILL.md`.
