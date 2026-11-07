import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { authFeature } from '../../features/auth/store/auth.reducer';

/** Solo usuarios autenticados. Guarda la URL para volver después del login. */
export const authGuard: CanActivateFn = (_route, state) => {
  const isAuthenticated = inject(Store).selectSignal(authFeature.selectIsAuthenticated)();
  return isAuthenticated
    ? true
    : inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

/** Evita que un usuario con sesión vuelva a ver el login. */
export const guestGuard: CanActivateFn = () => {
  const isAuthenticated = inject(Store).selectSignal(authFeature.selectIsAuthenticated)();
  return isAuthenticated ? inject(Router).createUrlTree(['/products']) : true;
};
