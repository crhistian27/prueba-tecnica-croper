import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { AuthActions } from '../../features/auth/store/auth.actions';
import { authFeature } from '../../features/auth/store/auth.reducer';

/** Layout de las páginas autenticadas: barra superior + contenido. */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, MatToolbarModule, MatButtonModule, MatIconModule, MatMenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-toolbar class="toolbar">
      <mat-icon class="brand-icon" aria-hidden="true">agriculture</mat-icon>
      <span class="brand">Croper <span class="brand-sub">Productos</span></span>
      <span class="spacer"></span>
      @if (user(); as u) {
        <button mat-button [matMenuTriggerFor]="menu" aria-label="Menú de usuario">
          <mat-icon>account_circle</mat-icon>
          <span class="user-name">{{ u.name }}</span>
        </button>
        <mat-menu #menu="matMenu" xPosition="before">
          <div class="menu-email">{{ u.email }}</div>
          <button mat-menu-item (click)="logout()">
            <mat-icon>logout</mat-icon>
            <span>Cerrar sesión</span>
          </button>
        </mat-menu>
      }
    </mat-toolbar>
    <main class="content">
      <router-outlet />
    </main>
  `,
  styles: `
    .toolbar {
      position: sticky;
      top: 0;
      z-index: 10;
      background: var(--mat-sys-primary);
      color: var(--mat-sys-on-primary);
      gap: 8px;
    }
    .toolbar button {
      color: inherit;
    }
    .brand {
      font-weight: 600;
    }
    .brand-sub {
      font-weight: 400;
      opacity: 0.8;
      margin-left: 4px;
    }
    .spacer {
      flex: 1;
    }
    .menu-email {
      padding: 8px 16px;
      font-size: 13px;
      color: var(--mat-sys-on-surface-variant);
    }
    .content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px 16px;
    }
    @media (max-width: 599px) {
      .user-name,
      .brand-sub {
        display: none;
      }
      .content {
        padding: 16px 12px;
      }
    }
  `,
})
export class Shell {
  private readonly store = inject(Store);
  protected readonly user = this.store.selectSignal(authFeature.selectUser);

  protected logout(): void {
    this.store.dispatch(AuthActions.logout());
  }
}
