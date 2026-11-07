import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, exhaustMap, map, of, tap } from 'rxjs';
import { NotificationService } from '../../../core/services/notification.service';
import { toFriendlyMessage } from '../../../core/utils/http-error';
import { AuthApiService } from '../data-access/auth-api.service';
import { authStorage } from '../data-access/auth-storage';
import { AuthActions } from './auth.actions';

export const login = createEffect(
  (actions$ = inject(Actions), api = inject(AuthApiService)) =>
    actions$.pipe(
      ofType(AuthActions.login),
      // exhaustMap: ignora clics repetidos mientras hay un login en curso
      exhaustMap(({ credentials, returnUrl }) =>
        api.login(credentials).pipe(
          map((res) =>
            AuthActions.loginSuccess({
              session: {
                token: res.accessToken,
                expiresAt: Date.now() + res.expiresIn * 1000,
                user: res.user,
              },
              returnUrl,
            }),
          ),
          catchError((error: unknown) =>
            of(AuthActions.loginFailure({ error: toFriendlyMessage(error) })),
          ),
        ),
      ),
    ),
  { functional: true },
);

export const loginSuccess = createEffect(
  (actions$ = inject(Actions), router = inject(Router)) =>
    actions$.pipe(
      ofType(AuthActions.loginSuccess),
      tap(({ session, returnUrl }) => {
        authStorage.save(session);
        void router.navigateByUrl(returnUrl || '/products');
      }),
    ),
  { functional: true, dispatch: false },
);

export const logout = createEffect(
  (actions$ = inject(Actions), router = inject(Router), notify = inject(NotificationService)) =>
    actions$.pipe(
      ofType(AuthActions.logout, AuthActions.sessionExpired),
      tap((action) => {
        authStorage.clear();
        if (action.type === AuthActions.sessionExpired.type) {
          notify.error('Tu sesión expiró. Inicia sesión de nuevo.');
        }
        void router.navigate(['/login']);
      }),
    ),
  { functional: true, dispatch: false },
);
