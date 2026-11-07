export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  /** Segundos de vigencia del token */
  expiresIn: number;
  user: AuthUser;
}

/** Lo que se persiste en localStorage. */
export interface AuthSession {
  token: string;
  /** Epoch en milisegundos */
  expiresAt: number;
  user: AuthUser;
}
