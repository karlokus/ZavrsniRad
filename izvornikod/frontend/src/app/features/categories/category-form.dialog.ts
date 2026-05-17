import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { CategoriesApiService } from './categories-api.service';
import { Category } from './category.types';
import { applyServerErrorsToForm } from '../../core/errors/form-error.mapper';
import { formatApiMessage } from '../../core/errors/format-api-message';
import { Dialog } from '../../shared/ui/dialog/dialog';
import { Button } from '../../shared/ui/button/button';
import { TextField } from '../../shared/ui/text-field/text-field';

@Component({
  selector: 'app-category-form-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Dialog, Button, TextField],
  template: `
    <app-dialog
      [title]="isEdit ? 'Uredi kategoriju' : 'Nova kategorija'"
      (dismiss)="ref.close()"
    >
      <form [formGroup]="form" (ngSubmit)="submit()" class="form-body">
        <app-text-field
          label="Naziv"
          placeholder="npr. Dalmatinske pjesme"
          formControlName="name"
          [error]="fieldError('name')"
        />

        <div class="color-row">
          <label class="field-label">Boja (opcionalno)</label>
          <div class="color-pick">
            <input type="color" formControlName="color" class="color-input" />
            <span class="color-val">{{ form.value.color || '—' }}</span>
          </div>
        </div>

        @if (serverError()) {
          <p class="form-error">{{ serverError() }}</p>
        }
      </form>

      <div dialog-footer>
        <button appButton variant="ghost" type="button" (click)="ref.close()">Odustani</button>
        <button appButton variant="primary" type="button" [disabled]="loading()" (click)="submit()">
          {{ loading() ? 'Sprema...' : (isEdit ? 'Spremi' : 'Kreiraj') }}
        </button>
      </div>
    </app-dialog>
  `,
  styles: [`
    .form-body { display: flex; flex-direction: column; gap: 16px; }
    .field-label { font-size: 12px; color: var(--muted); letter-spacing: 0.01em; }
    .color-row { display: flex; flex-direction: column; gap: 6px; }
    .color-pick { display: flex; align-items: center; gap: 10px; }
    .color-input { width: 40px; height: 32px; padding: 2px; border: 1px solid var(--border-strong); border-radius: var(--radius-sm); cursor: pointer; }
    .color-val { font-size: 13px; color: var(--muted); font-family: var(--font-mono); }
    .form-error { font-size: 13px; color: var(--danger); }
  `],
})
export class CategoryFormDialog {
  readonly ref = inject(DialogRef);
  readonly data = inject<Category | null>(DIALOG_DATA);
  private readonly api = inject(CategoriesApiService);
  private readonly fb = inject(FormBuilder);

  readonly isEdit = !!this.data;

  readonly form = this.fb.group({
    name: [this.data?.name ?? '', [Validators.required, Validators.maxLength(100)]],
    color: [this.data?.color ?? '#808080'],
  });

  readonly loading = signal(false);
  readonly serverError = signal('');

  fieldError(name: string): string {
    const c = this.form.get(name);
    if (!c || !c.touched || !c.errors) return '';
    if (c.errors['required']) return 'Naziv je obavezan.';
    if (c.errors['maxlength']) return 'Naziv može imati najviše 100 znakova.';
    if (c.errors['server']) return c.errors['server'] as string;
    return '';
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true);
    this.serverError.set('');
    const { name, color } = this.form.getRawValue();
    const dto = { name: name!, color: color ?? undefined };

    const req = this.isEdit
      ? this.api.update(this.data!.id, dto)
      : this.api.create(dto);

    req.subscribe({
      next: (cat) => this.ref.close(cat),
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        if (!applyServerErrorsToForm(this.form, err)) {
          this.serverError.set(formatApiMessage(err?.error?.message));
        }
      },
    });
  }
}
