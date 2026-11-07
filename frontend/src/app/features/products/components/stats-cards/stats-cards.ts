import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ProductStats } from '../../../../core/models/product.model';

/** Indicadores del inventario en la parte superior de la página. */
@Component({
  selector: 'app-stats-cards',
  imports: [MatIconModule, DecimalPipe, CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="stats" aria-label="Indicadores del inventario">
      @if (stats(); as s) {
        <article class="stat">
          <div class="stat-head">
            <span class="label">Productos</span>
            <span class="icon-tile tone-green"><mat-icon>inventory_2</mat-icon></span>
          </div>
          <strong class="value">{{ s.totalProducts | number }}</strong>
          <span class="hint">En el catálogo</span>
        </article>

        <article class="stat">
          <div class="stat-head">
            <span class="label">Unidades en stock</span>
            <span class="icon-tile tone-blue"><mat-icon>layers</mat-icon></span>
          </div>
          <strong class="value">{{ s.totalUnits | number }}</strong>
          <span class="hint">Suma de existencias</span>
        </article>

        <article class="stat">
          <div class="stat-head">
            <span class="label">Valor del inventario</span>
            <span class="icon-tile tone-amber"><mat-icon>payments</mat-icon></span>
          </div>
          <strong class="value">{{
            s.inventoryValue | currency: 'COP' : 'symbol-narrow' : '1.0-0'
          }}</strong>
          <span class="hint">Precio × unidades</span>
        </article>

        <article class="stat" [class.alert]="s.lowStock + s.outOfStock > 0">
          <div class="stat-head">
            <span class="label">Requieren atención</span>
            <span class="icon-tile tone-red"><mat-icon>warning_amber</mat-icon></span>
          </div>
          <strong class="value">{{ s.lowStock + s.outOfStock | number }}</strong>
          <span class="hint"> {{ s.lowStock }} con stock bajo · {{ s.outOfStock }} agotados </span>
        </article>
      } @else {
        @for (i of placeholders; track i) {
          <article class="stat" aria-hidden="true">
            <div class="stat-head">
              <span class="skeleton" style="width: 96px; height: 14px"></span>
              <span class="skeleton" style="width: 40px; height: 40px; border-radius: 10px"></span>
            </div>
            <span class="skeleton" style="width: 120px; height: 28px"></span>
            <span class="skeleton" style="width: 140px; height: 12px"></span>
          </article>
        }
      }
    </section>
  `,
  styles: `
    .stats {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 16px;
    }

    .stat {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 18px 20px;
      border-radius: var(--app-radius);
      background: var(--app-surface);
      border: 1px solid var(--app-border);
      box-shadow: var(--app-shadow-sm);
    }

    .stat-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 4px;
    }

    .label {
      font-size: 13px;
      font-weight: 500;
      color: var(--app-text-muted);
    }

    .value {
      font-size: 26px;
      font-weight: 700;
      letter-spacing: -0.02em;
      line-height: 1.2;
      font-variant-numeric: tabular-nums;
    }

    .hint {
      font-size: 12px;
      color: var(--app-text-subtle);
    }

    .stat.alert .value {
      color: var(--app-danger);
    }

    .tone-red {
      --tone-bg: #fee2e2;
      --tone-fg: #b91c1c;
    }

    @media (max-width: 1099.98px) {
      .stats {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 599.98px) {
      .stats {
        gap: 10px;
      }
      .stat {
        padding: 14px;
      }
      .value {
        font-size: 20px;
      }
      .icon-tile {
        width: 32px;
        height: 32px;
      }
    }
  `,
})
export class StatsCards {
  readonly stats = input<ProductStats | null>(null);
  protected readonly placeholders = [1, 2, 3, 4];
}
