import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { concatLatestFrom } from '@ngrx/operators';
import { Store } from '@ngrx/store';
import { catchError, exhaustMap, map, mergeMap, of, switchMap, tap } from 'rxjs';
import { NotificationService } from '../../../core/services/notification.service';
import { toFriendlyMessage } from '../../../core/utils/http-error';
import { ProductsApiService } from '../data-access/products-api.service';
import { ProductsApiActions, ProductsPageActions } from './products.actions';
import { productsFeature } from './products.reducer';

/**
 * Carga la página actual. Se recarga también tras crear o eliminar, porque con
 * paginación del lado del servidor el total y el contenido de la página cambian.
 * switchMap cancela la petición anterior si el usuario sigue escribiendo/paginando.
 */
export const loadProducts = createEffect(
  (actions$ = inject(Actions), store = inject(Store), api = inject(ProductsApiService)) =>
    actions$.pipe(
      ofType(
        ProductsPageActions.opened,
        ProductsPageActions.queryChanged,
        ProductsPageActions.retry,
        ProductsApiActions.createSuccess,
        ProductsApiActions.deleteSuccess,
      ),
      concatLatestFrom(() => store.select(productsFeature.selectQuery)),
      switchMap(([, query]) =>
        api.list(query).pipe(
          map((result) => ProductsApiActions.loadSuccess({ result })),
          catchError((error: unknown) =>
            of(ProductsApiActions.loadFailure({ error: toFriendlyMessage(error) })),
          ),
        ),
      ),
    ),
  { functional: true },
);

/** Si la página quedó vacía al borrar el último elemento, carga la página anterior. */
export const reloadOutOfRangePage = createEffect(
  (actions$ = inject(Actions), store = inject(Store), api = inject(ProductsApiService)) =>
    actions$.pipe(
      ofType(ProductsApiActions.loadSuccess),
      concatLatestFrom(() => store.select(productsFeature.selectQuery)),
      switchMap(([{ result }, query]) =>
        result.data.length === 0 && result.page > query.page
          ? api.list(query).pipe(
              map((r) => ProductsApiActions.loadSuccess({ result: r })),
              catchError((error: unknown) =>
                of(ProductsApiActions.loadFailure({ error: toFriendlyMessage(error) })),
              ),
            )
          : of(),
      ),
    ),
  { functional: true },
);

export const createProduct = createEffect(
  (actions$ = inject(Actions), api = inject(ProductsApiService)) =>
    actions$.pipe(
      ofType(ProductsPageActions.createRequested),
      exhaustMap(({ input }) =>
        api.create(input).pipe(
          map((product) => ProductsApiActions.createSuccess({ product })),
          catchError((error: unknown) =>
            of(ProductsApiActions.createFailure({ error: toFriendlyMessage(error) })),
          ),
        ),
      ),
    ),
  { functional: true },
);

export const updateProduct = createEffect(
  (actions$ = inject(Actions), api = inject(ProductsApiService)) =>
    actions$.pipe(
      ofType(ProductsPageActions.updateRequested),
      exhaustMap(({ id, changes }) =>
        api.update(id, changes).pipe(
          map((product) => ProductsApiActions.updateSuccess({ product })),
          catchError((error: unknown) =>
            of(ProductsApiActions.updateFailure({ error: toFriendlyMessage(error) })),
          ),
        ),
      ),
    ),
  { functional: true },
);

export const deleteProduct = createEffect(
  (actions$ = inject(Actions), api = inject(ProductsApiService)) =>
    actions$.pipe(
      ofType(ProductsPageActions.deleteConfirmed),
      // mergeMap: se pueden eliminar varios productos en paralelo
      mergeMap(({ id }) =>
        api.delete(id).pipe(
          map(() => ProductsApiActions.deleteSuccess({ id })),
          catchError((error: unknown) =>
            of(ProductsApiActions.deleteFailure({ error: toFriendlyMessage(error) })),
          ),
        ),
      ),
    ),
  { functional: true },
);

/** Mensajes de éxito y error para el usuario. */
export const notify = createEffect(
  (actions$ = inject(Actions), notifications = inject(NotificationService)) =>
    actions$.pipe(
      ofType(
        ProductsApiActions.createSuccess,
        ProductsApiActions.updateSuccess,
        ProductsApiActions.deleteSuccess,
        ProductsApiActions.createFailure,
        ProductsApiActions.updateFailure,
        ProductsApiActions.deleteFailure,
      ),
      tap((action) => {
        switch (action.type) {
          case ProductsApiActions.createSuccess.type:
            return notifications.success(`Producto "${action.product.name}" creado`);
          case ProductsApiActions.updateSuccess.type:
            return notifications.success(`Producto "${action.product.name}" actualizado`);
          case ProductsApiActions.deleteSuccess.type:
            return notifications.success('Producto eliminado');
          default:
            return notifications.error(action.error);
        }
      }),
    ),
  { functional: true, dispatch: false },
);
