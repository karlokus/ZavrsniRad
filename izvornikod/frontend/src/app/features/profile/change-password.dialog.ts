import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { DialogRef } from '@angular/cdk/dialog';
import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../../core/notifications/toast.service';
import { formatApiMessage } from '../../core/errors/format-api-message';
import { Dialog } from '../../shared/ui/dialog/dialog';
import { Button } from '../../shared/ui/button/button';
import { TextField } from '../../shared/ui/text-field/text-field';

@Component({
  selector: 'app-change-password-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Dialog, Button, TextField],
  template: `
    <app-dialog title="Promjena lozinke" (dismiss)="ref.close()">
      <form [formGroup]="form" (ngSubmit)="submit()" class="form-body">
        <app-text-field
          label="Trenutna lozinka"
          type="password"
          formControlName="oldPassword"
          [error]="fieldError('oldPassword')"
        />
        <app-text-field
          label="Nova lozinka"
          type="password"
          placeholder="Min. 6 znakova"
          formControlName="newPassword"
          [error]="fieldError('newPassword')"
        />
        @if (serverError()) {
          <p class="form-error">{{ serverError() }}</p>
        }
      </form>

      <div dialog-footer>
        <button appButton variant="ghost" type="button" (click)="ref.close()">Odustani</button>
        <button appButton variant="primary" type="button" [disabled]="loading()" (click)="submit()">
          {{ loading() ? 'Sprema...' : 'Promijeni lozinku' }}
        </button>
      </div>
    </app-dialog>
  `,
  styles: [`.form-body { display: flex; flex-direction: column; gap: 16px; } .form-error { font-size: 13px; color: var(--danger); }`],
})
export class ChangePasswordDialog {
  readonly ref = inject(DialogRef);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.group({
    oldPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
  });

  readonly loading = signal(false);
  readonly serverError = signal('');

  fieldError(name: string): string {
    const c = this.form.get(name);
    if (!c || !c.touched || !c.errors) return '';
    if (c.errors['required']) return 'Ovo polje je obavezno.';
    if (c.errors['minlength']) return 'Lozinka mora imati najmanje 6 znakova.';
    if (c.errors['server']) return c.errors['server'] as string;
    return '';
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true);
    this.serverError.set('');
    const { oldPassword, newPassword } = this.form.getRawValue();
    this.auth.changePassword({ oldPassword: oldPassword!, newPassword: newPassword! }).subscribe({
      next: () => {
        this.toast.success('Lozinka uspješno promijenjena.');
        this.ref.close(true);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.serverError.set(formatApiMessage(err?.error?.message));
      },
    });
  }
}
