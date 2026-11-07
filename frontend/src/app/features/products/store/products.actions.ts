import { createActionGroup, emptyProps, props } from '@ngrx/store';
import {
  Paginated,
  Product,
  ProductInput,
  ProductQuery,
  ProductStats,
} from '../../../core/models/product.model';

/** Eventos disparados desde la UI. */
export const ProductsPageActions = createActionGroup({
  source: 'Products Page',
  events: {
    Opened: emptyProps(),
    'Query Changed': props<{ query: Partial<ProductQuery> }>(),
    Retry: emptyProps(),
    'Create Requested': props<{ input: ProductInput }>(),
    'Update Requested': props<{ id: string; changes: Partial<ProductInput> }>(),
    'Delete Confirmed': props<{ id: string }>(),
  },
});

/** Resultados de la comunicación con la API. */
export const ProductsApiActions = createActionGroup({
  source: 'Products API',
  events: {
    'Load Success': props<{ result: Paginated<Product> }>(),
    'Load Failure': props<{ error: string }>(),
    'Stats Loaded': props<{ stats: ProductStats }>(),
    'Create Success': props<{ product: Product }>(),
    'Create Failure': props<{ error: string }>(),
    'Update Success': props<{ product: Product }>(),
    'Update Failure': props<{ error: string }>(),
    'Delete Success': props<{ id: string }>(),
    'Delete Failure': props<{ error: string }>(),
  },
});
