import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/auth/auth.service';
import { SkillLevel } from '../../core/auth/auth.types';
import { LookupsService } from '../../core/lookups/lookups.service';
import { applyServerErrorsToForm } from '../../core/errors/form-error.mapper';
import { formatApiMessage } from '../../core/errors/format-api-message';
import { Button } from '../../shared/ui/button/button';
import { TextField } from '../../shared/ui/text-field/text-field';
import { Select, SelectOption } from '../../shared/ui/select/select';
import { Combobox, ComboOption } from '../../shared/ui/combobox/combobox';

const SKILL_OPTIONS: SelectOption[] = [
  { value: '', label: 'Odaberite razinu...' },
  { value: SkillLevel.BEGINNER, label: 'Početnik' },
  { value: SkillLevel.INTERMEDIATE, label: 'Srednji' },
  { value: SkillLevel.ADVANCED, label: 'Napredni' },
];

@Component({
  selector: 'app-sign-up-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, Button, TextField, Select, Combobox],
  template: `
    <div class="auth-form">
      <div class="auth-form__head">
        <h1 class="auth-form__title">Registracija</h1>
        <p class="auth-form__sub">Stvorite svoj glazbeni dnevnik.</p>
      </div>

      <form [formGroup]="form" (ngSubmit)="submit()" class="auth-form__body">
        <div class="row-2">
          <app-text-field
            label="Ime"
            formControlName="firstName"
            [error]="fieldError('firstName')"
          />
          <app-text-field
            label="Prezime"
            formControlName="lastName"
            [error]="fieldError('lastName')"
          />
        </div>
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
          placeholder="Min. 6 znakova"
          formControlName="password"
          [error]="fieldError('password')"
        />
        <app-combobox
          label="Instrument (opcionalno)"
          placeholder="Pretražite instrumente..."
          [options]="instrumentOptions()"
          formControlName="instrumentId"
        />
        <app-select
          label="Razina (opcionalno)"
          [options]="skillOptions"
          formControlName="skillLevel"
        />

        @if (serverError()) {
          <p class="form-error">{{ serverError() }}</p>
        }

        <button appButton variant="primary" block type="submit" [disabled]="loading()">
          {{ loading() ? 'Kreiranje računa...' : 'Kreiraj račun' }}
        </button>
      </form>

      <p class="auth-form__footer">
        Već imate račun? <a class="link" routerLink="/auth/sign-in">Prijavite se</a>
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
    .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  `],
})
export class SignUpPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly lookups = inject(LookupsService);

  readonly form = this.fb.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    instrumentId: [''],
    skillLevel: [''],
  });

  readonly loading = signal(false);
  readonly serverError = signal('');
  readonly skillOptions = SKILL_OPTIONS;

  readonly instrumentOptions = computed<ComboOption[]>(() =>
    this.lookups.instruments().map((i) => ({ value: i.id, label: i.instrumentName })),
  );

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
    const v = this.form.getRawValue();
    this.auth
      .signUp({
        firstName: v.firstName!,
        lastName: v.lastName!,
        email: v.email!,
        password: v.password!,
        ...(v.instrumentId ? { instrumentId: v.instrumentId } : {}),
        ...(v.skillLevel ? { skillLevel: v.skillLevel as SkillLevel } : {}),
      })
      .subscribe({
        next: () => this.router.navigateByUrl('/dashboard'),
        error: (err: HttpErrorResponse) => {
          this.loading.set(false);
          if (!applyServerErrorsToForm(this.form, err)) {
            this.serverError.set(formatApiMessage(err?.error?.message));
          }
        },
      });
  }
}
