import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Store } from '@ngrx/store';
import { debounceTime, distinctUntilChanged, filter, map } from 'rxjs';
import {
  PRODUCT_CATEGORIES,
  Product,
  ProductCategory,
  SortField,
  categoryLabel,
} from '../../../../core/models/product.model';
import { CATEGORY_META, stockStatus } from '../../../../core/models/product-display';
import {
  ConfirmDialog,
  ConfirmDialogData,
} from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { ProductCards } from '../../components/product-cards/product-cards';
import { StatsCards } from '../../components/stats-cards/stats-cards';
import {
  ProductFormDialog,
  ProductFormDialogData,
} from '../../components/product-form-dialog/product-form-dialog';
import { ProductsPageActions } from '../../store/products.actions';
import { productsFeature } from '../../store/products.reducer';

@Component({
  selector: 'app-products-page',
  imports: [
    CurrencyPipe,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressBarModule,
    MatTooltipModule,
    ProductCards,
    StatsCards,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './products.page.html',
  styleUrl: './products.page.scss',
})
export class ProductsPage {
  private readonly store = inject(Store);
  private readonly dialog = inject(MatDialog);

  // Estado (todo viene del store de NgRx como signals)
  protected readonly products = this.store.selectSignal(productsFeature.selectProducts);
  protected readonly total = this.store.selectSignal(productsFeature.selectTotal);
  protected readonly query = this.store.selectSignal(productsFeature.selectQuery);
  protected readonly pageIndex = this.store.selectSignal(productsFeature.selectPageIndex);
  protected readonly loading = this.store.selectSignal(productsFeature.selectLoading);
  protected readonly loadError = this.store.selectSignal(productsFeature.selectLoadError);
  protected readonly isEmpty = this.store.selectSignal(productsFeature.selectIsEmpty);
  protected readonly hasFilters = this.store.selectSignal(productsFeature.selectHasFilters);
  protected readonly deleting = this.store.selectSignal(productsFeature.selectDeletingSet);
  protected readonly stats = this.store.selectSignal(productsFeature.selectStats);

  /** Rango visible para el texto "Mostrando X–Y de Z". */
  protected readonly rangeStart = computed(() =>
    this.total() === 0 ? 0 : (this.query().page - 1) * this.query().limit + 1,
  );
  protected readonly rangeEnd = computed(() =>
    Math.min(this.query().page * this.query().limit, this.total()),
  );

  /** En pantallas pequeñas se muestran tarjetas en vez de la tabla. */
  protected readonly isHandset = toSignal(
    inject(BreakpointObserver)
      .observe([Breakpoints.XSmall])
      .pipe(map((r) => r.matches)),
    { initialValue: false },
  );

  protected readonly columns = ['name', 'category', 'price', 'stock', 'status', 'actions'];
  protected readonly skeletonRows = [1, 2, 3, 4, 5, 6];
  protected readonly meta = (c: ProductCategory) => CATEGORY_META[c];
  protected readonly status = stockStatus;
  protected readonly categories = PRODUCT_CATEGORIES;
  protected readonly categoryLabel = categoryLabel;
  protected readonly pageSizes = [5, 10, 25, 50];
  protected readonly trackById = (_: number, p: Product) => p.id;

  protected readonly searchControl = new FormControl(this.query().search, { nonNullable: true });
  protected readonly categoryControl = new FormControl<ProductCategory | null>(
    this.query().category,
  );

  constructor() {
    this.store.dispatch(ProductsPageActions.opened());

    // Búsqueda con debounce: no se consulta la API en cada tecla
    this.searchControl.valueChanges
      .pipe(
        map((v) => v.trim()),
        filter((v) => v.length === 0 || v.length >= 2),
        debounceTime(400),
        distinctUntilChanged(),
        takeUntilDestroyed(),
      )
      .subscribe((search) =>
        this.store.dispatch(ProductsPageActions.queryChanged({ query: { search } })),
      );

    this.categoryControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((category) =>
        this.store.dispatch(ProductsPageActions.queryChanged({ query: { category } })),
      );
  }

  protected onPage(e: PageEvent): void {
    this.store.dispatch(
      ProductsPageActions.queryChanged({ query: { page: e.pageIndex + 1, limit: e.pageSize } }),
    );
  }

  protected onSort(sort: Sort): void {
    const sortBy = (sort.direction ? sort.active : 'createdAt') as SortField;
    const order = sort.direction || 'desc';
    this.store.dispatch(ProductsPageActions.queryChanged({ query: { sortBy, order } }));
  }

  protected clearFilters(): void {
    this.searchControl.setValue('', { emitEvent: false });
    this.categoryControl.setValue(null, { emitEvent: false });
    this.store.dispatch(
      ProductsPageActions.queryChanged({ query: { search: '', category: null } }),
    );
  }

  protected retry(): void {
    this.store.dispatch(ProductsPageActions.retry());
  }

  protected openCreate(): void {
    this.openForm({});
  }

  protected openEdit(product: Product): void {
    this.openForm({ product });
  }

  protected confirmDelete(product: Product): void {
    this.dialog
      .open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, {
        data: {
          title: 'Eliminar producto',
          message: `¿Seguro que quieres eliminar "${product.name}"? Esta acción no se puede deshacer.`,
          confirmText: 'Eliminar',
        },
        width: '440px',
        maxWidth: '95vw',
      })
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(() =>
        this.store.dispatch(ProductsPageActions.deleteConfirmed({ id: product.id })),
      );
  }

  private openForm(data: ProductFormDialogData): void {
    this.dialog.open(ProductFormDialog, {
      data,
      width: '680px',
      maxWidth: '95vw',
      autoFocus: '#name',
    });
  }
}
