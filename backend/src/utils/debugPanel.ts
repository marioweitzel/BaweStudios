/**
 * DebugPanel — Visualización del estado de la sesión en consola del backend.
 * 
 * Muestra un panel ASCII con:
 * - PID del proceso
 * - SessionId
 * - Estado actual
 * - Pregunta actual
 * - Contador de respuestas
 * 
 * También genera logs con timestamps ISO para cada transición de estado.
 */

export class DebugPanel {
  private state: string = 'idle';
  private currentQuestion: string | null = null;
  private answersCount: number = 0;
  private totalQuestions: number = 5;
  private pid: number | null = null;
  private sessionId: string | null = null;

  reset(): void {
    this.state = 'idle';
    this.currentQuestion = null;
    this.answersCount = 0;
    this.pid = null;
    this.sessionId = null;
  }

  /**
   * Actualiza el estado y imprime el panel
   */
  setState(newState: string, info?: string): void {
    this.state = newState;
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] estado: ${newState}${info ? ' — ' + info : ''}`);
    this.render();
  }

  /**
   * Registra el PID del proceso
   */
  setPID(pid: number | null): void {
    this.pid = pid;
    this.render();
  }

  /**
   * Registra el sessionId
   */
  setSessionId(sessionId: string): void {
    this.sessionId = sessionId;
  }

  /**
   * Registra la pregunta actual
   */
  setCurrentQuestion(id: string): void {
    this.currentQuestion = id;
  }

  setAnswersCount(count: number): void {
    this.answersCount = count;
  }

  /**
   * Incrementa el contador de respuestas
   */
  incrementAnswers(): void {
    this.answersCount++;
  }

  /**
   * Renderiza el panel en consola
   */
  render(): void {
    const pidStr = this.pid ? String(this.pid) : '(no iniciado)';
    const sessionStr = this.sessionId || '(no asignado)';
    const questionStr = this.currentQuestion || '(ninguna)';
    const adapterName = process.env.HOST_ADAPTER || 'fake';
    const adapterDisplay = adapterName === 'fake' ? 'FakeHostAdapter' :
                           adapterName === 'codex' ? 'CodexHostAdapter' :
                           adapterName === 'claude-code' ? 'ClaudeCodeHostAdapter' :
                           adapterName === 'vscode' ? 'VSCodeHostAdapter' :
                           adapterName;
    
    const panel = `
╔══════════════════════════════════════════╗
║         BAWESTUDIO — MODO DEBUG          ║
╠══════════════════════════════════════════╣
║ Adaptador activo    : ${adapterDisplay.padEnd(33)}║
║ Proceso PID         : ${pidStr.padEnd(33)}║
║ Session ID          : ${sessionStr.padEnd(33)}║
║ Estado              : ${this.state.padEnd(33)}║
║ Pregunta actual     : ${questionStr.padEnd(33)}║
║ Respuestas recibidas: ${this.answersCount} / ${this.totalQuestions}                        ║
╚══════════════════════════════════════════╝
    `;
    console.log(panel);
  }
}

// Instancia global
export const debugPanel = new DebugPanel();
