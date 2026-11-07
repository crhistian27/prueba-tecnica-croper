import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CATEGORY_META, stockStatus } from '../../../../core/models/product-display';
import { Product, ProductCategory, categoryLabel } from '../../../../core/models/product.model';

/** Vista de lista para móviles: una tarjeta por producto en vez de una tabla. */
@Component({
  selector: 'app-product-cards',
  imports: [CurrencyPipe, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul class="cards">
      @for (p of products(); track p.id) {
        <li class="card">
          <div class="card-top">
            <span class="icon-tile" [class]="'tone-' + meta(p.category).tone">
              <mat-icon>{{ meta(p.category).icon }}</mat-icon>
            </span>
            <div class="title">
              <strong>{{ p.name }}</strong>
              <span class="mono">{{ p.sku }}</span>
            </div>
          </div>

          <div class="tags">
            <span class="chip" [class]="'tone-' + meta(p.category).tone">{{
              label(p.category)
            }}</span>
            <span class="badge" [class]="status(p.stock).tone">{{ status(p.stock).label }}</span>
          </div>

          <dl class="figures">
            <div>
              <dt>Precio</dt>
              <dd class="price">{{ p.price | currency: 'COP' : 'symbol-narrow' : '1.0-0' }}</dd>
            </div>
            <div>
              <dt>Stock</dt>
              <dd>{{ p.stock }} und</dd>
            </div>
          </dl>

          <div class="actions">
            <button mat-stroked-button (click)="edit.emit(p)">
              <mat-icon>edit</mat-icon> Editar
            </button>
            <button
              mat-stroked-button
              class="danger"
              (click)="remove.emit(p)"
              [disabled]="deleting().has(p.id)"
            >
              <mat-icon>delete_outline</mat-icon> Eliminar
            </button>
          </div>
        </li>
      }
    </ul>
  `,
  styles: `
    .cards {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 12px;
    }

    .card {
      display: flex;
      flex-direction: column;
      gap: 14px;
      padding: 16px;
      border-radius: var(--app-radius);
      background: var(--app-surface);
      border: 1px solid var(--app-border);
      box-shadow: var(--app-shadow-sm);
    }

    .card-top {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .title {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;

      strong {
        font-size: 15px;
        font-weight: 600;
        line-height: 1.3;
      }
    }

    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .figures {
      display: grid;
      grid-template-columns: 1fr 1fr;
      margin: 0;
      padding: 12px 0 0;
      border-top: 1px solid var(--app-border);

      dt {
        font-size: 12px;
        color: var(--app-text-subtle);
        margin-bottom: 2px;
      }
      dd {
        margin: 0;
        font-weight: 500;
        font-variant-numeric: tabular-nums;
      }
      .price {
        font-size: 16px;
        font-weight: 700;
      }
    }

    .actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;

      button {
        min-height: 44px; /* área táctil cómoda */
      }
    }

    .danger {
      color: var(--app-danger);
    }
  `,
})
export class ProductCards {
  readonly products = input.required<Product[]>();
  readonly deleting = input<Set<string>>(new Set());
  readonly edit = output<Product>();
  readonly remove = output<Product>();

  protected readonly label = categoryLabel;
  protected readonly meta = (c: ProductCategory) => CATEGORY_META[c];
  protected readonly status = stockStatus;
}
