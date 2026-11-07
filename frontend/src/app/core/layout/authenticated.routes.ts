import { MatPaginatorIntl } from '@angular/material/paginator';
import { Routes } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { provideState } from '@ngrx/store';
import { ProductsPage } from '../../features/products/pages/products-page/products.page';
import * as productsEffects from '../../features/products/store/products.effects';
import { productsFeature } from '../../features/products/store/products.reducer';
import { SpanishPaginatorIntl } from '../utils/paginator-intl';
import { Shell } from './shell';

/**
 * Área autenticada en UN solo chunk diferido (layout + productos).
 *
 * Antes el router cargaba el Shell y, recién después, descubría el chunk de
 * productos: dos viajes de red seguidos antes de poder pedir los datos a la API.
 * En 4G lento cada viaje cuesta cientos de ms. Agrupándolos se elimina un nivel
 * de la cadena de peticiones sin agregar nada al bundle inicial (login).
 */
export const AUTHENTICATED_ROUTES: Routes = [
  {
    path: '',
    component: Shell,
    children: [
      {
        path: 'products',
        title: 'Productos · Croper',
        // Estado y effects de la feature: se registran solo al entrar aquí
        providers: [
          provideState(productsFeature),
          provideEffects(productsEffects),
          { provide: MatPaginatorIntl, useClass: SpanishPaginatorIntl },
        ],
        component: ProductsPage,
      },
      { path: '', pathMatch: 'full', redirectTo: 'products' },
    ],
  },
];
