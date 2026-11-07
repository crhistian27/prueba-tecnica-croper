import { BreakpointObserver } from '@angular/cdk/layout';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { map } from 'rxjs';
import { AuthActions } from '../../features/auth/store/auth.actions';
import { authFeature } from '../../features/auth/store/auth.reducer';
import { initials } from '../models/product-display';

/** Layout de las páginas autenticadas: menú lateral + barra superior + contenido. */
@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  private readonly store = inject(Store);

  protected readonly user = this.store.selectSignal(authFeature.selectUser);
  protected readonly userInitials = computed(() => initials(this.user()?.name ?? ''));

  /** Por debajo de 960 px el menú lateral se vuelve un panel deslizable. */
  protected readonly isCompact = toSignal(
    inject(BreakpointObserver)
      .observe('(max-width: 959.98px)')
      .pipe(map((r) => r.matches)),
    { initialValue: false },
  );

  protected logout(): void {
    this.store.dispatch(AuthActions.logout());
  }
}
