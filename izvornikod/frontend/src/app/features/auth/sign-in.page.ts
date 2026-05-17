import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/auth/auth.service';
import { formatApiMessage } from '../../core/errors/format-api-message';
import { Button } from '../../shared/ui/button/button';
import { TextField } from '../../shared/ui/text-field/text-field';

@Component({
  selector: 'app-sign-in-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, Button, TextField],
  template: `
    <div class="auth-form">
      <div class="auth-form__head">
        <h1 class="auth-form__title">Prijava</h1>
        <p class="auth-form__sub">Dobrodošli natrag u Metronoma.</p>
      </div>

      <form [formGroup]="form" (ngSubmit)="submit()" class="auth-form__body">
        <app-text-field
          label="E-mail adresa"
          type="email"
          placeholder="ime@primjer.com"
          formControlName="email"
          [error]="fieldError('email')"
        />
        <app-text-field
          label="Lozinka"
          type="password"
          placeholder="••••••••"
          formControlName="password"
          [error]="fieldError('password')"
        />

        @if (serverError()) {
          <p class="form-error">{{ serverError() }}</p>
        }

        <button appButton variant="primary" block type="submit" [disabled]="loading()">
          {{ loading() ? 'Prijava...' : 'Prijavi se' }}
        </button>
      </form>

      <p class="auth-form__footer">
        Nemate račun? <a class="link" routerLink="/auth/sign-up">Registrirajte se</a>
      </p>
    </div>
  `,
  styles: [`
    .auth-form { display: flex; flex-direction: column; gap: 24px; max-width: 380px; width: 100%; }
    .auth-form__head { display: flex; flex-direction: column; gap: 6px; }
    .auth-form__title { font-family: var(--font-serif); font-size: 28px; }
    .auth-form__sub { color: var(--muted); font-size: 14px; }
    .auth-form__body { display: flex; flex-direction: column; gap: 16px; }
    .auth-form__footer { font-size: 13px; color: var(--muted); text-align: center; }
    .form-error { font-size: 13px; color: var(--danger); }
  `],
})
export class SignInPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  readonly loading = signal(false);
  readonly serverError = signal('');

  fieldError(name: string): string {
    const c = this.form.get(name);
    if (!c || !c.touched || !c.errors) return '';
    if (c.errors['required']) return 'Ovo polje je obavezno.';
    if (c.errors['email']) return 'Unesite valjanu e-mail adresu.';
    if (c.errors['minlength']) return 'Lozinka mora imati najmanje 6 znakova.';
    if (c.errors['server']) return c.errors['server'] as string;
    return '';
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true);
    this.serverError.set('');
    const { email, password } = this.form.getRawValue();
    this.auth.signIn({ email: email!, password: password! }).subscribe({
      next: () => this.router.navigateByUrl('/dashboard'),
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.serverError.set(formatApiMessage(err?.error?.message));
      },
    });
  }
}
