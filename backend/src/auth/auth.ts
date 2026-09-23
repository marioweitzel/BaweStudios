import jwt from 'jsonwebtoken';
import type { DbShape, StoredUser } from '../types/domain';

type AuthDeps = {
  jwtSecret: string;
  readDb: () => DbShape;
  workspaceUserId: (userId: string) => string;
};

export function createAuth(deps: AuthDeps) {
  function findUser(email: string) {
    return deps.readDb().users.find(u => u.email === email.toLowerCase());
  }

  function findUserById(id: string | null | undefined) {
    if (!id) return null;
    return deps.readDb().users.find(u => u.id === id) || null;
  }

  function signToken(user: any) {
    return jwt.sign({ id: user.id, email: user.email }, deps.jwtSecret, { expiresIn: '7d' });
  }

  function publicUser(user: StoredUser) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      workspace_user_id: user.workspace_user_id || deps.workspaceUserId(user.id)
    };
  }

  function userFromJwtToken(token: string) {
    try {
      const tokenUser = jwt.verify(token, deps.jwtSecret) as any;
      const dbUser = findUserById(tokenUser?.id);
      return dbUser || null;
    } catch {
      return null;
    }
  }

  function authMiddleware(req: any, res: any, next: any) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ error: 'No autorizado' });
    const dbUser = userFromJwtToken(header.slice(7));
    if (!dbUser) return res.status(401).json({ error: 'Token invalido' });
    req.user = { id: dbUser.id, email: dbUser.email, name: dbUser.name };
    next();
  }

  function fileAuthMiddleware(req: any, res: any, next: any) {
    const header = req.headers.authorization;
    const queryToken = typeof req.query.token === 'string' ? req.query.token : '';
    const bearerToken = header && header.startsWith('Bearer ') ? header.slice(7) : '';
    const dbUser = userFromJwtToken(bearerToken || queryToken);
    if (!dbUser) return res.status(401).json({ error: 'Token invalido' });
    req.user = { id: dbUser.id, email: dbUser.email, name: dbUser.name };
    next();
  }

  return {
    authMiddleware,
    fileAuthMiddleware,
    findUser,
    findUserById,
    publicUser,
    signToken,
    userFromJwtToken
  };
}
