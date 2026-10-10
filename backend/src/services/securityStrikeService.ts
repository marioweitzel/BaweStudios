import crypto from 'crypto';
import type { DbShape } from '../types/domain';

type SecurityStrikeDeps = {
  readDb: () => DbShape;
  writeDb: (db: DbShape) => void;
};

// Mismo ataque = mismo mensaje del cliente. Pasada esta ventana el mismo texto cuenta de nuevo.
const SAME_ATTACK_WINDOW_MS = Number(process.env.SECURITY_SAME_ATTACK_WINDOW_MS || 24 * 60 * 60 * 1000);

function attemptKey(attempt: string) {
  const normalized = String(attempt || '').trim().replace(/\s+/g, ' ').toLowerCase();
  return normalized ? crypto.createHash('sha256').update(normalized).digest('hex') : '';
}

// Cuenta los intentos de uso indebido del chat (el LLM respondio "Intento de
// hack") por usuario. 1er intento = advertencia; 2do = bloqueo de la cuenta
// (acceso cerrado, datos conservados). El borrado definitivo no se aplica.
// Un mismo ataque no suma dos veces: el LLM puede volver a señalar el mismo
// mensaje envenenado en el turno siguiente ("continuar", reintento). Solo cuenta
// un mensaje del cliente que todavia no se conto; si no hay mensaje (turno sin
// respuesta del cliente) tampoco se suma.
export function createSecurityStrikeService(deps: SecurityStrikeDeps) {
  const lastCounted = new Map<string, { key: string; at: number }>();

  function registerStrike(userId: string, attempt = ''): { strikes: number; blocked: boolean; counted: boolean } {
    const db = deps.readDb();
    const user = db.users.find(u => u.id === userId);
    if (!user) return { strikes: 0, blocked: false, counted: false };
    const key = attemptKey(attempt);
    const previous = lastCounted.get(userId);
    const duplicate = !key || (!!previous && previous.key === key && Date.now() - previous.at < SAME_ATTACK_WINDOW_MS);
    if (duplicate) {
      const current = Number(user.securityStrikes || 0);
      return { strikes: current, blocked: current >= 2, counted: false };
    }
    lastCounted.set(userId, { key, at: Date.now() });
    const strikes = Number(user.securityStrikes || 0) + 1;
    user.securityStrikes = strikes;
    const blocked = strikes >= 2;
    if (blocked && !user.blockedAt) user.blockedAt = new Date().toISOString();
    deps.writeDb(db);
    return { strikes, blocked, counted: true };
  }
  return { registerStrike };
}
