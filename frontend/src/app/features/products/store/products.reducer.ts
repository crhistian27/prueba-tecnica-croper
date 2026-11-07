import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { createFeature, createReducer, createSelector, on } from '@ngrx/store';
import { Product, ProductQuery } from '../../../core/models/product.model';
import { AuthActions } from '../../auth/store/auth.actions';
import { ProductsApiActions, ProductsPageActions } from './products.actions';

export interface ProductsState extends EntityState<Product> {
  query: ProductQuery;
  total: number;
  /** Carga de la lista */
  loading: boolean;
  /** Crear / editar en curso (deshabilita el formulario) */
  saving: boolean;
  /** Ids que se están eliminando (deshabilita su botón) */
  deletingIds: string[];
  /** Error al cargar la lista (se muestra en pantalla con opción de reintentar) */
  loadError: string | null;
}

/** Sin sortComparer: se respeta el orden en que el servidor devuelve la página. */
export const productsAdapter = createEntityAdapter<Product>();

export const initialQuery: ProductQuery = {
  page: 1,
  limit: 10,
  search: '',
  category: null,
  sortBy: 'createdAt',
  order: 'desc',
};

export const initialProductsState: ProductsState = productsAdapter.getInitialState({
  query: initialQuery,
  total: 0,
  loading: false,
  saving: false,
  deletingIds: [],
  loadError: null,
});

export const productsFeature = createFeature({
  name: 'products',
  reducer: createReducer(
    initialProductsState,
    on(ProductsPageActions.opened, ProductsPageActions.retry, (state) => ({
      ...state,
      loading: true,
      loadError: null,
    })),
    on(ProductsPageActions.queryChanged, (state, { query }) => ({
      ...state,
      // Cambiar búsqueda/filtro/orden vuelve a la página 1 salvo que se indique otra
      query: { ...state.query, page: 1, ...query },
      loading: true,
      loadError: null,
    })),
    on(ProductsApiActions.loadSuccess, (state, { result }) =>
      productsAdapter.setAll(result.data, {
        ...state,
        total: result.total,
        loading: false,
        // Si la página quedó fuera de rango (ej. se borró el último ítem), ir a la última válida
        query:
          result.data.length === 0 && result.page > 1 && result.totalPages > 0
            ? { ...state.query, page: result.totalPages }
            : state.query,
      }),
    ),
    on(ProductsApiActions.loadFailure, (state, { error }) => ({
      ...state,
      loading: false,
      loadError: error,
    })),

    on(ProductsPageActions.createRequested, ProductsPageActions.updateRequested, (state) => ({
      ...state,
      saving: true,
    })),
    on(ProductsApiActions.createSuccess, (state) => ({ ...state, saving: false })),
    on(ProductsApiActions.updateSuccess, (state, { product }) =>
      productsAdapter.upsertOne(product, { ...state, saving: false }),
    ),
    on(ProductsApiActions.createFailure, ProductsApiActions.updateFailure, (state) => ({
      ...state,
      saving: false,
    })),

    on(ProductsPageActions.deleteConfirmed, (state, { id }) => ({
      ...state,
      deletingIds: [...state.deletingIds, id],
    })),
    on(ProductsApiActions.deleteSuccess, (state, { id }) =>
      productsAdapter.removeOne(id, {
        ...state,
        total: Math.max(0, state.total - 1),
        deletingIds: state.deletingIds.filter((d) => d !== id),
      }),
    ),
    on(ProductsApiActions.deleteFailure, (state) => ({ ...state, deletingIds: [] })),

    // Al cerrar sesión no deben quedar datos en memoria
    on(AuthActions.logout, AuthActions.sessionExpired, () => initialProductsState),
  ),
  extraSelectors: ({ selectProductsState, selectQuery, selectTotal, selectDeletingIds }) => {
    const { selectAll } = productsAdapter.getSelectors(selectProductsState);
    return {
      selectProducts: selectAll,
      selectPageIndex: createSelector(selectQuery, (q) => q.page - 1),
      selectHasFilters: createSelector(selectQuery, (q) => !!q.search.trim() || !!q.category),
      selectIsEmpty: createSelector(
        selectAll,
        selectTotal,
        (items, total) => items.length === 0 && total === 0,
      ),
      selectDeletingSet: createSelector(selectDeletingIds, (ids) => new Set(ids)),
    };
  },
});
