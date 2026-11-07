export type ProductCategory =
  | 'fertilizantes'
  | 'semillas'
  | 'agroquimicos'
  | 'herramientas'
  | 'nutricion-animal'
  | 'riego'
  | 'otros';

export const PRODUCT_CATEGORIES: ReadonlyArray<{ value: ProductCategory; label: string }> = [
  { value: 'fertilizantes', label: 'Fertilizantes' },
  { value: 'semillas', label: 'Semillas' },
  { value: 'agroquimicos', label: 'Agroquímicos' },
  { value: 'herramientas', label: 'Herramientas' },
  { value: 'nutricion-animal', label: 'Nutrición animal' },
  { value: 'riego', label: 'Riego' },
  { value: 'otros', label: 'Otros' },
];

export function categoryLabel(value: ProductCategory): string {
  return PRODUCT_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: ProductCategory;
  sku: string;
  createdAt: string;
  updatedAt: string;
}

export type ProductInput = Pick<
  Product,
  'name' | 'description' | 'price' | 'stock' | 'category' | 'sku'
>;

export type SortField = 'name' | 'price' | 'stock' | 'createdAt';

export interface ProductQuery {
  page: number;
  limit: number;
  search: string;
  category: ProductCategory | null;
  sortBy: SortField;
  order: 'asc' | 'desc';
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProductStats {
  totalProducts: number;
  totalUnits: number;
  inventoryValue: number;
  lowStock: number;
  outOfStock: number;
  lowStockThreshold: number;
}
