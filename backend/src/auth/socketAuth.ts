import type { Socket } from 'socket.io';
import type { StoredUser } from '../types/domain';

type SocketAuthDeps = {
  userFromJwtToken: (token: string) => StoredUser | null;
};

export type AuthenticatedSocketUser = Pick<StoredUser, 'id' | 'email' | 'name'>;

export function authenticateSocket(socket: Socket, deps: SocketAuthDeps): AuthenticatedSocketUser | null {
  const token = String(socket.handshake.auth?.token || '');
  try {
    const dbUser = token ? deps.userFromJwtToken(token) : null;
    if (!dbUser) {
      socket.emit('auth:expired', { message: 'SesiÃ³n expirada. IniciÃ¡ sesiÃ³n nuevamente.' });
      socket.disconnect(true);
      return null;
    }
    return { id: dbUser.id, email: dbUser.email, name: dbUser.name };
  } catch {
    socket.emit('error', { message: 'Token invalido para Socket.IO' });
    socket.disconnect(true);
    return null;
  }
}
