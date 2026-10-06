import type { DbShape } from '../types/domain';

type SecurityStrikeDeps = {
  readDb: () => DbShape;
  writeDb: (db: DbShape) => void;
};

// Cuenta los intentos de uso indebido del chat (el LLM respondio "Intento de
// hack") por usuario. 1er intento = advertencia; 2do = bloqueo de la cuenta
// (acceso cerrado, datos conservados). El borrado definitivo no se aplica.
export function createSecurityStrikeService(deps: SecurityStrikeDeps) {
  function registerStrike(userId: string): { strikes: number; blocked: boolean } {
    const db = deps.readDb();
    const user = db.users.find(u => u.id === userId);
    if (!user) return { strikes: 0, blocked: false };
    const strikes = Number(user.securityStrikes || 0) + 1;
    user.securityStrikes = strikes;
    const blocked = strikes >= 2;
    if (blocked && !user.blockedAt) user.blockedAt = new Date().toISOString();
    deps.writeDb(db);
    return { strikes, blocked };
  }
  return { registerStrike };
}
