import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="body">
      <span class="icon"><mat-icon>delete_outline</mat-icon></span>
      <h2 mat-dialog-title>{{ data.title }}</h2>
      <p>{{ data.message }}</p>
    </div>
    <mat-dialog-actions>
      <button mat-stroked-button [mat-dialog-close]="false">Cancelar</button>
      <button mat-flat-button class="danger" [mat-dialog-close]="true" cdkFocusInitial>
        {{ data.confirmText ?? 'Confirmar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .body {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 28px 24px 8px;
    }

    .icon {
      display: grid;
      place-items: center;
      width: 52px;
      height: 52px;
      margin-bottom: 16px;
      border-radius: 50%;
      background: var(--app-danger-soft);
      color: var(--app-danger);
      box-shadow: 0 0 0 8px #fff5f5;
    }

    h2[mat-dialog-title] {
      margin: 0 0 8px;
      padding: 0;
      font-size: 18px;
      font-weight: 600;

      &::before {
        display: none;
      }
    }

    p {
      margin: 0;
      font-size: 14px;
      line-height: 1.6;
      color: var(--app-text-muted);
    }

    mat-dialog-actions.mat-mdc-dialog-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      padding: 20px 24px 24px;
    }

    .danger {
      --mat-button-filled-container-color: var(--app-danger);
      --mat-button-filled-label-text-color: #fff;
    }
  `,
})
export class ConfirmDialog {
  protected readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
}
