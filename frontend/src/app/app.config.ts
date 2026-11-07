import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import localeEsCo from '@angular/common/locales/es-CO';
import {
  ApplicationConfig,
  DEFAULT_CURRENCY_CODE,
  isDevMode,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { MAT_ICON_DEFAULT_OPTIONS } from '@angular/material/icon';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { provideStore } from '@ngrx/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { sessionInterceptor } from './core/interceptors/session.interceptor';
import * as authEffects from './features/auth/store/auth.effects';
import { authFeature } from './features/auth/store/auth.reducer';

registerLocaleData(localeEsCo);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, sessionInterceptor])),
    provideStore({ [authFeature.name]: authFeature.reducer }),
    provideEffects(authEffects),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() }),
    { provide: LOCALE_ID, useValue: 'es-CO' },
    { provide: DEFAULT_CURRENCY_CODE, useValue: 'COP' },
    // Íconos redondeados (Material Icons Round, cargados en index.html)
    { provide: MAT_ICON_DEFAULT_OPTIONS, useValue: { fontSet: 'material-icons-round' } },
  ],
};
