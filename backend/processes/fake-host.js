/**
 * fake-host.js — Simula un LLM que hace preguntas para construir un proyecto.
 * 
 * Protocolo:
 * 1. Al arrancar, emite { "type": "ready" } (sin sessionId todavía)
 * 2. El backend responde con { "type": "init", "sessionId": "..." }
 * 3. El script almacena el sessionId y empieza a emitir preguntas
 * 4. Cada pregunta incluye el sessionId: { "sessionId": "...", "type": "question", "id": "A1", "text": "..." }
 * 5. El backend envía respuestas: { "type": "message", "text": "..." }
 * 6. Al recibir 5 respuestas, emite interview_summary y luego interview_complete
 */

const readline = require('readline');

const rl = readline.createInterface({ input: process.stdin });

let sessionId = null;
let initialized = false;

// Estado interno — simula lo que hace BaWe con BAWE_PHASE_STATE.json
const state = {
  currentQuestion: 0,
  answers: {}
};

// 5 preguntas clásicas del onboarding BaWe
const preguntas = [
  { id: "A1", text: "¿Cuál es el nombre de tu proyecto?" },
  { id: "A2", text: "En una sola frase, ¿qué hace tu sitio web?" },
  { id: "A3", text: "¿Qué tipo de web es? (E-Commerce / SaaS / Landing / Blog / Portal)" },
  { id: "A4", text: "¿Quiénes van a usar el sitio?" },
  { id: "A5", text: "¿Qué 2 cosas son las más importantes que la gente podrá hacer en tu web?" },
];

/**
 * Emite un mensaje JSON a stdout.
 * Si ya tenemos sessionId, lo incluye en el mensaje.
 */
function emit(obj) {
  const payload = sessionId ? { sessionId, ...obj } : obj;
  process.stdout.write(JSON.stringify(payload) + '\n');
}

/**
 * Al arrancar, el proceso avisa que está listo.
 * El backend espera este "ready" antes de enviar cualquier cosa.
 */
setTimeout(() => {
  emit({ type: "ready" });
}, 100);

/**
 * Event listener: cuando llega un mensaje por stdin.
 */
rl.on('line', (linea) => {
  const mensaje = linea.trim();
  if (!mensaje) return;

  let parsed;
  try {
    parsed = JSON.parse(mensaje);
  } catch {
    // Si no es JSON válido, tratar como texto plano
    parsed = { type: "message", text: mensaje };
  }

  // PRIMER MENSAJE: debe ser init para establecer el sessionId
  if (!initialized) {
    if (parsed.type === "init" && parsed.sessionId) {
      sessionId = parsed.sessionId;
      initialized = true;
      // No emitir nada — el backend ya sabe que está listo por el "ready" inicial
      return;
    }
    // Si no es init, ignora y sigue esperando
    return;
  }

  // A partir de acá, todos los mensajes son respuestas del usuario
  const textoUsuario = parsed.text || parsed;

  // Guardar la respuesta de la pregunta anterior (si no es la primera)
  if (state.currentQuestion > 0) {
    const anterior = preguntas[state.currentQuestion - 1];
    state.answers[anterior.id] = textoUsuario;
  }

  // Emitir siguiente pregunta O cerrar entrevista
  if (state.currentQuestion < preguntas.length) {
    const pregunta = preguntas[state.currentQuestion];
    emit({ type: "question", id: pregunta.id, text: pregunta.text });
    state.currentQuestion++;
  } else {
    // Entrevista terminada — emitir resumen
    emit({ type: "interview_summary", answers: state.answers });

    setTimeout(() => {
      emit({ type: "progress", phase: "planning", text: "Analizando respuestas..." });
    }, 500);

    setTimeout(() => {
      emit({ type: "interview_complete" });
    }, 2000);
  }
});

/**
 * Graceful shutdown
 */
process.on('SIGTERM', () => {
  rl.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  rl.close();
  process.exit(0);
});
