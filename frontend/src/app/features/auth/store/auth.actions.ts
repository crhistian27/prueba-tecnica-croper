import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { AuthSession, LoginRequest } from '../../../core/models/auth.model';

export const AuthActions = createActionGroup({
  source: 'Auth',
  events: {
    Login: props<{ credentials: LoginRequest; returnUrl: string }>(),
    'Login Success': props<{ session: AuthSession; returnUrl: string }>(),
    'Login Failure': props<{ error: string }>(),
    Logout: emptyProps(),
    /** La API respondió 401 en una petición autenticada. */
    'Session Expired': emptyProps(),
  },
});
