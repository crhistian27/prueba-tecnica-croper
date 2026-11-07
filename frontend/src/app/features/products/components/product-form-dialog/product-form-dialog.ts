import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { take } from 'rxjs';
import {
  PRODUCT_CATEGORIES,
  Product,
  ProductCategory,
  ProductInput,
} from '../../../../core/models/product.model';
import { ProductsApiActions, ProductsPageActions } from '../../store/products.actions';
import { productsFeature } from '../../store/products.reducer';

export interface ProductFormDialogData {
  product?: Product;
}

/**
 * Formulario de crear/editar. El diálogo despacha la acción y solo se cierra
 * cuando la API confirma el éxito: si falla (ej. SKU duplicado), el usuario
 * conserva lo que escribió y puede corregirlo.
 */
@Component({
  selector: 'app-product-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './product-form-dialog.html',
  styleUrl: './product-form-dialog.scss',
})
export class ProductFormDialog {
  private readonly store = inject(Store);
  private readonly actions$ = inject(Actions);
  private readonly dialogRef = inject(MatDialogRef<ProductFormDialog>);
  private readonly destroyRef = inject(DestroyRef);
  private readonly data = inject<ProductFormDialogData>(MAT_DIALOG_DATA, { optional: true });

  protected readonly categories = PRODUCT_CATEGORIES;
  protected readonly saving = this.store.selectSignal(productsFeature.selectSaving);
  protected readonly isEdit = !!this.data?.product;

  protected readonly form = inject(NonNullableFormBuilder).group({
    name: [this.data?.product?.name ?? '', [Validators.required, Validators.maxLength(120)]],
    sku: [
      this.data?.product?.sku ?? '',
      [Validators.required, Validators.pattern(/^[A-Za-z0-9-]{3,30}$/)],
    ],
    category: [this.data?.product?.category ?? ('' as ProductCategory | ''), Validators.required],
    price: [
      this.data?.product?.price ?? (null as number | null),
      [Validators.required, Validators.min(0)],
    ],
    stock: [
      this.data?.product?.stock ?? (null as number | null),
      [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)],
    ],
    description: [this.data?.product?.description ?? '', Validators.maxLength(1000)],
  });

  constructor() {
    this.actions$
      .pipe(
        ofType(ProductsApiActions.createSuccess, ProductsApiActions.updateSuccess),
        take(1),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.dialogRef.close(true));

    // No cerrar accidentalmente con clic afuera mientras se guarda
    this.dialogRef.disableClose = true;
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const input: ProductInput = {
      name: value.name.trim(),
      sku: value.sku.trim().toUpperCase(),
      category: value.category as ProductCategory,
      price: Number(value.price),
      stock: Number(value.stock),
      description: value.description.trim(),
    };

    const product = this.data?.product;
    if (product) {
      this.store.dispatch(ProductsPageActions.updateRequested({ id: product.id, changes: input }));
    } else {
      this.store.dispatch(ProductsPageActions.createRequested({ input }));
    }
  }

  protected cancel(): void {
    this.dialogRef.close(false);
  }
}
