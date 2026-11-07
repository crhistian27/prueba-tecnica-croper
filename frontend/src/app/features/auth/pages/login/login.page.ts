import { Clipboard } from '@angular/cdk/clipboard';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { AuthActions } from '../../store/auth.actions';
import { authFeature } from '../../store/auth.reducer';

@Component({
  selector: 'app-login-page',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
})
export class LoginPage {
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);

  protected readonly loading = this.store.selectSignal(authFeature.selectLoading);
  protected readonly error = this.store.selectSignal(authFeature.selectError);
  protected readonly hidePassword = signal(true);
  protected readonly year = new Date().getFullYear();

  /** Credenciales del usuario demo (creado por el seed del backend). */
  protected readonly demoCredentials = [
    { key: 'email', label: 'Usuario', value: 'admin@croper.com' },
    { key: 'password', label: 'Contraseña', value: 'Admin123*' },
  ] as const;
  /** Qué credencial se acaba de copiar (para mostrar el check unos segundos). */
  protected readonly copied = signal<string | null>(null);
  private readonly clipboard = inject(Clipboard);
  private copiedTimer?: ReturnType<typeof setTimeout>;

  protected readonly form = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.copiedTimer));
  }

  protected copy(key: string, value: string): void {
    if (!this.clipboard.copy(value)) return;
    this.copied.set(key);
    clearTimeout(this.copiedTimer);
    this.copiedTimer = setTimeout(() => this.copied.set(null), 2000);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/products';
    // Evita redirecciones abiertas: solo rutas internas
    const safeReturnUrl =
      returnUrl.startsWith('/') && !returnUrl.startsWith('//') ? returnUrl : '/products';
    this.store.dispatch(
      AuthActions.login({ credentials: this.form.getRawValue(), returnUrl: safeReturnUrl }),
    );
  }
}
