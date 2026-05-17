import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Dialog } from '@angular/cdk/dialog';
import { UsersApiService, UpdateProfileDto } from './users-api.service';
import { ChangePasswordDialog } from './change-password.dialog';
import { AuthStateService } from '../../core/auth/auth-state.service';
import { AuthService } from '../../core/auth/auth.service';
import { SkillLevel, User } from '../../core/auth/auth.types';
import { LookupsService } from '../../core/lookups/lookups.service';
import { applyServerErrorsToForm } from '../../core/errors/form-error.mapper';
import { formatApiMessage } from '../../core/errors/format-api-message';
import { ToastService } from '../../core/notifications/toast.service';
import { Card } from '../../shared/ui/card/card';
import { Button } from '../../shared/ui/button/button';
import { TextField } from '../../shared/ui/text-field/text-field';
import { Select, SelectOption } from '../../shared/ui/select/select';
import { Combobox, ComboOption } from '../../shared/ui/combobox/combobox';
import { Spinner } from '../../shared/ui/spinner/spinner';

const SKILL_OPTIONS: SelectOption[] = [
  { value: '', label: 'Odaberite razinu...' },
  { value: SkillLevel.BEGINNER, label: 'Početnik' },
  { value: SkillLevel.INTERMEDIATE, label: 'Srednji' },
  { value: SkillLevel.ADVANCED, label: 'Napredni' },
];

@Component({
  selector: 'app-profile-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Card, Button, TextField, Select, Combobox, Spinner],
  template: `
    <div class="page-wrap">
      <h1 class="page-title">Profil</h1>

      @if (loading()) {
        <div class="center"><app-spinner /></div>
      } @else {
        <div class="profile-grid">
          <app-card title="Osobni podaci">
            <form [formGroup]="form" (ngSubmit)="saveProfile()" class="profile-form">
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
              <app-combobox
                label="Instrument"
                placeholder="Pretražite instrumente..."
                [options]="instrumentOptions()"
                formControlName="instrumentId"
              />
              <app-select
                label="Razina"
                [options]="skillOptions"
                formControlName="skillLevel"
              />

              @if (serverError()) {
                <p class="form-error">{{ serverError() }}</p>
              }

              <div class="form-actions">
                <button appButton variant="primary" size="sm" type="submit" [disabled]="saving()">
                  {{ saving() ? 'Sprema...' : 'Spremi izmjene' }}
                </button>
              </div>
            </form>
          </app-card>

          <app-card title="Račun">
            <dl class="account-info">
              <div class="info-row">
                <dt>E-mail</dt>
                <dd>{{ user()?.email }}</dd>
              </div>
            </dl>
            <div class="account-actions">
              <button appButton variant="ghost" size="sm" (click)="openChangePassword()">
                Promijeni lozinku
              </button>
              <button appButton variant="danger" size="sm" (click)="confirmDelete()">
                Obriši račun
              </button>
            </div>
          </app-card>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-wrap { display: flex; flex-direction: column; gap: 24px; }
    .page-title { font-family: var(--font-serif); font-size: 24px; }
    .center { display: flex; justify-content: center; padding: 40px; }
    .profile-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start; }
    .profile-form { display: flex; flex-direction: column; gap: 14px; }
    .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .form-error { font-size: 13px; color: var(--danger); }
    .form-actions { display: flex; justify-content: flex-end; }
    .account-info { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
    .info-row { display: flex; justify-content: space-between; font-size: 14px; }
    .info-row dt { color: var(--muted); }
    .info-row dd { font-weight: 500; }
    .account-actions { display: flex; flex-direction: column; gap: 8px; }
    @media (max-width: 640px) { .profile-grid { grid-template-columns: 1fr; } }
  `],
})
export class ProfilePage implements OnInit {
  private readonly usersApi = inject(UsersApiService);
  private readonly authState = inject(AuthStateService);
  private readonly authService = inject(AuthService);
  private readonly lookups = inject(LookupsService);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(Dialog);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly user = this.authState.currentUser;
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly serverError = signal('');
  readonly skillOptions = SKILL_OPTIONS;

  readonly form = this.fb.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    instrumentId: [''],
    skillLevel: [''],
  });

  readonly instrumentOptions = computed<ComboOption[]>(() =>
    this.lookups.instruments().map((i) => ({ value: i.id, label: i.instrumentName })),
  );

  ngOnInit(): void {
    this.usersApi.getMe().subscribe({
      next: (u: User) => {
        this.authState.setUser(u);
        this.form.patchValue({
          firstName: u.firstName,
          lastName: u.lastName,
          instrumentId: u.instrument?.id ?? '',
          skillLevel: u.skillLevel ?? '',
        });
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  fieldError(name: string): string {
    const c = this.form.get(name);
    if (!c || !c.touched || !c.errors) return '';
    if (c.errors['required']) return 'Ovo polje je obavezno.';
    if (c.errors['server']) return c.errors['server'] as string;
    return '';
  }

  saveProfile(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);
    this.serverError.set('');
    const v = this.form.getRawValue();
    const dto: UpdateProfileDto = {
      firstName: v.firstName!,
      lastName: v.lastName!,
      instrumentId: v.instrumentId || undefined,
      skillLevel: v.skillLevel || undefined,
    };
    this.usersApi.updateMe(dto).subscribe({
      next: (u: User) => {
        this.authState.setUser(u);
        this.saving.set(false);
        this.toast.success('Profil ažuriran.');
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        if (!applyServerErrorsToForm(this.form, err)) {
          this.serverError.set(formatApiMessage(err?.error?.message));
        }
      },
    });
  }

  openChangePassword(): void {
    this.dialog.open(ChangePasswordDialog);
  }

  confirmDelete(): void {
    if (!confirm('Jeste li sigurni da želite trajno obrisati račun?')) return;
    this.usersApi.deleteMe().subscribe({
      next: () => {
        this.authService.signOut();
        this.router.navigateByUrl('/auth/sign-in');
      },
      error: (err) => this.toast.error(formatApiMessage(err?.error?.message)),
    });
  }
}
