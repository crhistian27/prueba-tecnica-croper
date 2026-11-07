import { AuthSession } from '../../../core/models/auth.model';

const KEY = 'croper.session';

/**
 * Persistencia de la sesión en localStorage para sobrevivir recargas.
 * Nota de seguridad: localStorage es accesible desde JS (riesgo ante XSS).
 * En producción se preferiría un refresh token en cookie httpOnly; aquí se
 * mitiga con tokens de vida corta y validando la expiración al cargar.
 */
export const authStorage = {
  load(): AuthSession | null {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const session = JSON.parse(raw) as AuthSession;
      if (!session.token || session.expiresAt <= Date.now()) {
        localStorage.removeItem(KEY);
        return null;
      }
      return session;
    } catch {
      return null;
    }
  },
  save(session: AuthSession): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(session));
    } catch {
      /* almacenamiento no disponible: la sesión vive solo en memoria */
    }
  },
  clear(): void {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* noop */
    }
  },
};
