import { ProductCategory } from './product.model';

/** Ícono y tono visual por categoría (los tonos están definidos en styles.scss). */
export const CATEGORY_META: Record<ProductCategory, { icon: string; tone: string }> = {
  fertilizantes: { icon: 'eco', tone: 'green' },
  semillas: { icon: 'grass', tone: 'lime' },
  agroquimicos: { icon: 'science', tone: 'purple' },
  herramientas: { icon: 'handyman', tone: 'slate' },
  'nutricion-animal': { icon: 'pets', tone: 'amber' },
  riego: { icon: 'water_drop', tone: 'blue' },
  otros: { icon: 'category', tone: 'gray' },
};

export type StockTone = 'success' | 'warning' | 'danger';

export interface StockStatus {
  label: string;
  tone: StockTone;
}

export const LOW_STOCK_THRESHOLD = 10;

export function stockStatus(stock: number): StockStatus {
  if (stock <= 0) return { label: 'Agotado', tone: 'danger' };
  if (stock < LOW_STOCK_THRESHOLD) return { label: 'Stock bajo', tone: 'warning' };
  return { label: 'Disponible', tone: 'success' };
}

/** Iniciales para el avatar del usuario. */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');
}
