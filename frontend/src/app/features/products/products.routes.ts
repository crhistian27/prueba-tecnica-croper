import { MatPaginatorIntl } from '@angular/material/paginator';
import { Routes } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { provideState } from '@ngrx/store';
import { SpanishPaginatorIntl } from '../../core/utils/paginator-intl';
import { ProductsPage } from './pages/products-page/products.page';
import * as productsEffects from './store/products.effects';
import { productsFeature } from './store/products.reducer';

/**
 * Rutas de la feature de productos (carga diferida).
 * El estado de NgRx, los effects y Material se registran solo al entrar aquí,
 * así no pesan en el bundle inicial (login).
 */
export const PRODUCTS_ROUTES: Routes = [
  {
    path: '',
    title: 'Productos · Croper',
    providers: [
      provideState(productsFeature),
      provideEffects(productsEffects),
      { provide: MatPaginatorIntl, useClass: SpanishPaginatorIntl },
    ],
    component: ProductsPage,
  },
];
