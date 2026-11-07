import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { Product, categoryLabel } from '../../../../core/models/product.model';

/** Vista de lista para móviles: una tarjeta por producto en vez de una tabla. */
@Component({
  selector: 'app-product-cards',
  imports: [CurrencyPipe, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul class="cards">
      @for (p of products(); track p.id) {
        <li>
          <mat-card appearance="outlined">
            <mat-card-header>
              <mat-card-title>{{ p.name }}</mat-card-title>
              <mat-card-subtitle>{{ p.sku }} · {{ label(p.category) }}</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content class="meta">
              <span class="price">{{ p.price | currency: 'COP' : 'symbol-narrow' : '1.0-0' }}</span>
              <span class="stock" [class.low]="p.stock < 10">
                <mat-icon inline>inventory_2</mat-icon> {{ p.stock }} und
              </span>
            </mat-card-content>
            <mat-card-actions align="end">
              <button mat-button (click)="edit.emit(p)"><mat-icon>edit</mat-icon> Editar</button>
              <button
                mat-button
                class="danger"
                (click)="remove.emit(p)"
                [disabled]="deleting().has(p.id)"
              >
                <mat-icon>delete</mat-icon> Eliminar
              </button>
            </mat-card-actions>
          </mat-card>
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
    .meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 8px;
    }
    .price {
      font: var(--mat-sys-title-medium);
      color: var(--mat-sys-primary);
    }
    .stock {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: var(--mat-sys-on-surface-variant);
    }
    .stock.low {
      color: var(--mat-sys-error);
      font-weight: 500;
    }
    .danger {
      color: var(--mat-sys-error);
    }
    button {
      min-height: 44px;
    } /* área táctil cómoda */
  `,
})
export class ProductCards {
  readonly products = input.required<Product[]>();
  readonly deleting = input<Set<string>>(new Set());
  readonly edit = output<Product>();
  readonly remove = output<Product>();

  protected readonly label = categoryLabel;
}
