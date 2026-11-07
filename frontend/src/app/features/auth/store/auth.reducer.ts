import { createFeature, createReducer, createSelector, on } from '@ngrx/store';
import { AuthSession } from '../../../core/models/auth.model';
import { authStorage } from '../data-access/auth-storage';
import { AuthActions } from './auth.actions';

export interface AuthState {
  session: AuthSession | null;
  loading: boolean;
  error: string | null;
}

export function initialAuthState(): AuthState {
  // Rehidrata la sesión guardada (descarta tokens expirados)
  return { session: authStorage.load(), loading: false, error: null };
}

export const authFeature = createFeature({
  name: 'auth',
  reducer: createReducer(
    initialAuthState(),
    on(AuthActions.login, (state) => ({ ...state, loading: true, error: null })),
    on(AuthActions.loginSuccess, (state, { session }) => ({
      ...state,
      session,
      loading: false,
      error: null,
    })),
    on(AuthActions.loginFailure, (state, { error }) => ({ ...state, loading: false, error })),
    on(AuthActions.logout, AuthActions.sessionExpired, () => ({
      session: null,
      loading: false,
      error: null,
    })),
  ),
  extraSelectors: ({ selectSession }) => ({
    selectToken: createSelector(selectSession, (s) => s?.token ?? null),
    selectUser: createSelector(selectSession, (s) => s?.user ?? null),
    selectIsAuthenticated: createSelector(selectSession, (s) => !!s && s.expiresAt > Date.now()),
  }),
});
