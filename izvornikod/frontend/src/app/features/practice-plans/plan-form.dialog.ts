import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { formatApiMessage } from '../../core/errors/format-api-message';
import { Dialog } from '../../shared/ui/dialog/dialog';
import { Button } from '../../shared/ui/button/button';
import { TextField } from '../../shared/ui/text-field/text-field';
import { TextArea } from '../../shared/ui/text-area/text-area';
import { Select, SelectOption } from '../../shared/ui/select/select';
import { PracticePlansApiService } from './practice-plans-api.service';
import { CreatePracticePlanDto, PracticePlan, RecurrencePattern } from './practice-plan.types';

export interface PlanFormDialogData {
  /** Prefill scheduledDate (clicked calendar day), ISO yyyy-mm-dd. */
  date?: string;
}

const PATTERN_OPTIONS: SelectOption[] = [
  { value: 'DAILY', label: 'Svaki dan' },
  { value: 'WEEKDAYS', label: 'Radnim danima (pon–pet)' },
  { value: 'WEEKLY', label: 'Tjedno (isti dan)' },
  { value: 'CUSTOM', label: 'Prilagođeno (odaberi dane)' },
];

// DOW 0..6, 0 = nedjelja (Postgres EXTRACT(DOW) konvencija, vidi backend enum).
const DOW = [
  { dow: 1, label: 'Pon' },
  { dow: 2, label: 'Uto' },
  { dow: 3, label: 'Sri' },
  { dow: 4, label: 'Čet' },
  { dow: 5, label: 'Pet' },
  { dow: 6, label: 'Sub' },
  { dow: 0, label: 'Ned' },
];

/**
 * Create plan / recurring template (§6.6). Mirrors CreatePracticePlanDto
 * validation: isRecurring → pattern required; CUSTOM → ≥1 day; and when
 * NOT recurring the recurrence fields are *omitted entirely* from the DTO
 * (backend rejects them even as null).
 */
@Component({
  selector: 'app-plan-form-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Dialog, Button, TextField, TextArea, Select],
  template: `
    <app-dialog title="Novi plan vježbanja" (dismiss)="ref.close()">
      <form [formGroup]="form" class="form-body">
        <app-text-field
          label="Naziv"
          placeholder="npr. Jutarnja vježba"
          formControlName="name"
          [error]="err('name')"
        />

        <div class="row-2">
          <div class="field">
            <label class="field__label" for="sd">Datum</label>
            <input id="sd" type="date" class="native" formControlName="scheduledDate" />
            @if (err('scheduledDate')) {
              <span class="field__hint err">{{ err('scheduledDate') }}</span>
            }
          </div>
          <div class="field">
            <label class="field__label" for="dur">Trajanje (min)</label>
            <input
              id="dur"
              type="number"
              min="1"
              max="1440"
              class="native"
              formControlName="durationMinutes"
            />
            @if (err('durationMinutes')) {
              <span class="field__hint err">{{ err('durationMinutes') }}</span>
            }
          </div>
        </div>

        <app-text-area
          label="Bilješke (opcionalno)"
          formControlName="notes"
          [rows]="2"
        />

        <label class="check">
          <input type="checkbox" formControlName="isRecurring" />
          Ponavljajući plan (rutina)
        </label>

        @if (form.controls.isRecurring.value) {
          <app-select
            label="Obrazac ponavljanja"
            placeholder="Odaberi obrazac"
            [options]="patternOptions"
            formControlName="recurrencePattern"
            [error]="recurrenceError()"
          />

          @if (form.controls.recurrencePattern.value === 'CUSTOM') {
            <div class="field">
              <label class="field__label">Dani u tjednu</label>
              <div class="dow">
                @for (d of dows; track d.dow) {
                  <button
                    type="button"
                    class="dow__btn"
                    [class.is-on]="selectedDays().has(d.dow)"
                    (click)="toggleDay(d.dow)"
                  >
                    {{ d.label }}
                  </button>
                }
              </div>
            </div>
          }

          <div class="field">
            <label class="field__label" for="red">Završetak ponavljanja (opcionalno)</label>
            <input id="red" type="date" class="native" formControlName="recurrenceEndDate" />
          </div>
        }

        @if (serverError()) {
          <p class="form-error">{{ serverError() }}</p>
        }
      </form>

      <div dialog-footer>
        <button appButton variant="ghost" type="button" (click)="ref.close()">Odustani</button>
        <button
          appButton
          variant="primary"
          type="button"
          [disabled]="saving()"
          (click)="submit()"
        >
          {{ saving() ? 'Spremam…' : 'Kreiraj' }}
        </button>
      </div>
    </app-dialog>
  `,
  styles: [
    `
      .form-body {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .row-2 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      .field {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .field__label {
        font-size: 12px;
        color: var(--muted);
        letter-spacing: 0.01em;
      }
      .field__hint.err {
        font-size: 12px;
        color: var(--danger);
      }
      .native {
        padding: 9px 12px;
        border: 1px solid var(--border-strong);
        border-radius: var(--radius-sm);
        background: var(--surface);
        outline: none;
      }
      .native:focus {
        border-color: var(--accent);
        box-shadow: 0 0 0 3px var(--accent-soft);
      }
      .check {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        color: var(--ink-2);
      }
      .dow {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      .dow__btn {
        padding: 6px 10px;
        border: 1px solid var(--border-strong);
        border-radius: var(--radius-sm);
        background: var(--surface);
        font-size: 12px;
        cursor: pointer;
      }
      .dow__btn.is-on {
        background: var(--accent);
        color: #fff;
        border-color: var(--accent);
      }
      .form-error {
        font-size: 13px;
        color: var(--danger);
      }
    `,
  ],
})
export class PlanFormDialog {
  readonly ref = inject<DialogRef<PracticePlan>>(DialogRef);
  private readonly data = inject<PlanFormDialogData>(DIALOG_DATA);
  private readonly api = inject(PracticePlansApiService);
  private readonly fb = inject(FormBuilder);

  protected readonly patternOptions = PATTERN_OPTIONS;
  protected readonly dows = DOW;

  protected readonly saving = signal(false);
  protected readonly serverError = signal('');
  protected readonly selectedDays = signal<Set<number>>(new Set());
  /** Bumped on submit so CUSTOM-days error shows only after a submit try. */
  private readonly submitted = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    scheduledDate: [this.data.date ?? '', Validators.required],
    durationMinutes: [60, [Validators.required, Validators.min(1), Validators.max(1440)]],
    notes: '',
    isRecurring: false,
    recurrencePattern: '' as RecurrencePattern | '',
    recurrenceEndDate: '',
  });

  protected readonly recurrenceError = computed(() => {
    if (!this.submitted()) return '';
    const v = this.form.getRawValue();
    if (v.isRecurring && !v.recurrencePattern) return 'Odaberi obrazac ponavljanja.';
    if (
      v.isRecurring &&
      v.recurrencePattern === 'CUSTOM' &&
      this.selectedDays().size === 0
    ) {
      return 'Odaberi barem jedan dan.';
    }
    return '';
  });

  protected toggleDay(dow: number): void {
    const next = new Set(this.selectedDays());
    if (next.has(dow)) next.delete(dow);
    else next.add(dow);
    this.selectedDays.set(next);
  }

  protected err(name: 'name' | 'scheduledDate' | 'durationMinutes'): string {
    const c = this.form.get(name);
    if (!c || !c.touched || !c.errors) return '';
    if (c.errors['required']) return 'Obavezno polje.';
    if (c.errors['maxlength']) return 'Predugačko.';
    if (c.errors['min']) return 'Najmanje 1.';
    if (c.errors['max']) return 'Najviše 1440.';
    if (c.errors['server']) return c.errors['server'] as string;
    return '';
  }

  protected submit(): void {
    this.submitted.set(true);
    this.form.markAllAsTouched();
    if (this.form.invalid || this.saving()) return;

    const v = this.form.getRawValue();

    if (v.isRecurring) {
      if (!v.recurrencePattern) return; // recurrenceError() shows the hint
      if (v.recurrencePattern === 'CUSTOM' && this.selectedDays().size === 0) return;
    }

    const dto: CreatePracticePlanDto = {
      name: v.name.trim(),
      scheduledDate: v.scheduledDate,
      durationMinutes: Number(v.durationMinutes),
    };
    if (v.notes.trim()) dto.notes = v.notes.trim();

    // Recurrence fields ONLY when recurring — backend rejects them otherwise
    // (even as null), so they must be entirely absent for one-off plans.
    if (v.isRecurring) {
      dto.isRecurring = true;
      dto.recurrencePattern = v.recurrencePattern as RecurrencePattern;
      if (v.recurrencePattern === 'CUSTOM') {
        dto.recurrenceDays = [...this.selectedDays()].sort((a, b) => a - b);
      }
      if (v.recurrenceEndDate) dto.recurrenceEndDate = v.recurrenceEndDate;
    }

    this.saving.set(true);
    this.serverError.set('');
    this.api.create(dto).subscribe({
      next: (plan) => this.ref.close(plan),
      error: (e: HttpErrorResponse) => {
        this.saving.set(false);
        this.serverError.set(formatApiMessage(e?.error?.message));
      },
    });
  }
}
