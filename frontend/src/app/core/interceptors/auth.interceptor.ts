import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { environment } from '../../../environments/environment';
import { authFeature } from '../../features/auth/store/auth.reducer';

/** Adjunta el JWT solo a las peticiones dirigidas a nuestra API. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(Store).selectSignal(authFeature.selectToken)();
  if (!token || !req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
