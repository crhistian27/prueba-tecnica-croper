import { Paginated, Product } from '../../../core/models/product.model';
import { AuthActions } from '../../auth/store/auth.actions';
import { ProductsApiActions, ProductsPageActions } from './products.actions';
import { initialProductsState, productsFeature, ProductsState } from './products.reducer';

const { reducer } = productsFeature;

function product(id: string, overrides: Partial<Product> = {}): Product {
  return {
    id,
    name: `Producto ${id}`,
    description: '',
    price: 1000,
    stock: 5,
    category: 'semillas',
    sku: `SKU-${id}`,
    createdAt: '',
    updatedAt: '',
    ...overrides,
  };
}

function page(data: Product[], extra: Partial<Paginated<Product>> = {}): Paginated<Product> {
  return { data, total: data.length, page: 1, limit: 10, totalPages: 1, ...extra };
}

describe('productsReducer', () => {
  it('al abrir la página marca loading y limpia el error', () => {
    const state = reducer(
      { ...initialProductsState, loadError: 'x' },
      ProductsPageActions.opened(),
    );
    expect(state.loading).toBe(true);
    expect(state.loadError).toBeNull();
  });

  it('cambiar búsqueda o filtro vuelve a la página 1', () => {
    const start: ProductsState = {
      ...initialProductsState,
      query: { ...initialProductsState.query, page: 4 },
    };
    const state = reducer(start, ProductsPageActions.queryChanged({ query: { search: 'urea' } }));
    expect(state.query.page).toBe(1);
    expect(state.query.search).toBe('urea');
  });

  it('cambiar de página conserva los filtros', () => {
    const start: ProductsState = {
      ...initialProductsState,
      query: { ...initialProductsState.query, search: 'urea', category: 'fertilizantes' },
    };
    const state = reducer(start, ProductsPageActions.queryChanged({ query: { page: 3 } }));
    expect(state.query).toMatchObject({ page: 3, search: 'urea', category: 'fertilizantes' });
  });

  it('loadSuccess reemplaza la página respetando el orden del servidor', () => {
    const state = reducer(
      { ...initialProductsState, loading: true },
      ProductsApiActions.loadSuccess({ result: page([product('b'), product('a')], { total: 42 }) }),
    );
    expect(state.ids).toEqual(['b', 'a']);
    expect(state.total).toBe(42);
    expect(state.loading).toBe(false);
  });

  it('si la página quedó fuera de rango, ajusta a la última página válida', () => {
    const start: ProductsState = {
      ...initialProductsState,
      query: { ...initialProductsState.query, page: 5 },
    };
    const state = reducer(
      start,
      ProductsApiActions.loadSuccess({ result: page([], { page: 5, total: 40, totalPages: 4 }) }),
    );
    expect(state.query.page).toBe(4);
  });

  it('loadFailure guarda el mensaje para mostrarlo con opción de reintentar', () => {
    const state = reducer(
      { ...initialProductsState, loading: true },
      ProductsApiActions.loadFailure({ error: 'Sin conexión' }),
    );
    expect(state.loading).toBe(false);
    expect(state.loadError).toBe('Sin conexión');
  });

  it('updateSuccess actualiza el producto en la página actual', () => {
    const loaded = reducer(
      initialProductsState,
      ProductsApiActions.loadSuccess({ result: page([product('a')]) }),
    );
    const saving = reducer(
      loaded,
      ProductsPageActions.updateRequested({ id: 'a', changes: { price: 5 } }),
    );
    expect(saving.saving).toBe(true);

    const state = reducer(
      saving,
      ProductsApiActions.updateSuccess({ product: product('a', { price: 5 }) }),
    );
    expect(state.entities['a']?.price).toBe(5);
    expect(state.saving).toBe(false);
  });

  it('createFailure libera el formulario', () => {
    const saving = reducer(
      initialProductsState,
      ProductsPageActions.createRequested({ input: { ...product('x') } }),
    );
    expect(
      reducer(saving, ProductsApiActions.createFailure({ error: 'SKU duplicado' })).saving,
    ).toBe(false);
  });

  it('marca el producto como "eliminando" y lo quita al confirmar la API', () => {
    const loaded = reducer(
      initialProductsState,
      ProductsApiActions.loadSuccess({ result: page([product('a'), product('b')]) }),
    );
    const deleting = reducer(loaded, ProductsPageActions.deleteConfirmed({ id: 'a' }));
    expect(deleting.deletingIds).toEqual(['a']);

    const state = reducer(deleting, ProductsApiActions.deleteSuccess({ id: 'a' }));
    expect(state.ids).toEqual(['b']);
    expect(state.total).toBe(1);
    expect(state.deletingIds).toEqual([]);
  });

  it('al cerrar sesión se borran los datos en memoria', () => {
    const loaded = reducer(
      initialProductsState,
      ProductsApiActions.loadSuccess({ result: page([product('a')]) }),
    );
    expect(reducer(loaded, AuthActions.logout())).toEqual(initialProductsState);
  });
});
