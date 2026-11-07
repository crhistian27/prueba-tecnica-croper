import { inject, Injectable, Injector } from '@angular/core';
import type { MatSnackBar } from '@angular/material/snack-bar';

/**
 * Notificaciones al usuario (MatSnackBar).
 * El módulo de snackbar (y todo el sistema de Overlay del CDK) se carga bajo
 * demanda con import() la primera vez que se muestra un mensaje: así no pesa
 * en el bundle inicial, lo que mejora el tiempo de carga en móviles.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly injector = inject(Injector);
  private snackBar?: Promise<MatSnackBar>;

  success(message: string): void {
    void this.open(message, 'OK', 3000, 'snack-success');
  }

  error(message: string): void {
    void this.open(message, 'Cerrar', 6000, 'snack-error');
  }

  private async open(message: string, action: string, duration: number, panelClass: string) {
    this.snackBar ??= import('@angular/material/snack-bar').then((m) =>
      this.injector.get(m.MatSnackBar),
    );
    (await this.snackBar).open(message, action, { duration, panelClass });
  }
}
