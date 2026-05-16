import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface SelectOption {
  value: string;
  label: string;
}

let uid = 0;

/**
 * Nativni <select> stiliziran kao `.input` (dizajn `.select`, custom strelica).
 * Custom Overlay verzija dolazi tek u Fazi 4 (§8.5). ControlValueAccessor.
 *
 * Usage: <app-select label="Instrument" [options]="instruments()" formControlName="instrumentId" />
 */
@Component({
  selector: 'app-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="field">
      @if (label()) {
        <label class="field__label" [attr.for]="id">{{ label() }}</label>
      }
      <select
        class="select"
        [id]="id"
        [disabled]="disabled()"
        [class.has-error]="!!error()"
        (change)="onSelect($event)"
        (blur)="onTouched()"
      >
        @if (placeholder()) {
          <option value="" [selected]="!value()">{{ placeholder() }}</option>
        }
        @for (o of options(); track o.value) {
          <option [value]="o.value" [selected]="o.value === value()">{{ o.label }}</option>
        }
      </select>
      @if (error()) {
        <span class="field__hint err">{{ error() }}</span>
      } @else if (hint()) {
        <span class="field__hint">{{ hint() }}</span>
      }
    </div>
  `,
  styles: [
    `
    .field { display: flex; flex-direction: column; gap: 6px; }
    .field__label { font-size: 12px; color: var(--muted); letter-spacing: 0.01em; }
    .field__hint { font-size: 12px; color: var(--muted); }
    .field__hint.err { color: var(--danger); }
    .select {
      width: 100%;
      padding: 9px 32px 9px 12px;
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-sm);
      background: var(--surface);
      outline: none;
      appearance: none;
      transition: border-color 0.12s, box-shadow 0.12s;
      background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23807c73' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 12px center;
    }
    .select:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
    .select.has-error { border-color: var(--danger); }
    .select:disabled { opacity: 0.6; }
    `,
  ],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Select), multi: true },
  ],
})
export class Select implements ControlValueAccessor {
  readonly label = input('');
  readonly hint = input('');
  readonly error = input('');
  readonly placeholder = input('');
  readonly options = input.required<SelectOption[]>();

  protected readonly id = `sel-${++uid}`;
  protected readonly value = signal('');
  protected readonly disabled = signal(false);

  private onChange: (v: string) => void = () => {};
  protected onTouched: () => void = () => {};

  onSelect(e: Event): void {
    const v = (e.target as HTMLSelectElement).value;
    this.value.set(v);
    this.onChange(v);
  }

  writeValue(v: string | null): void {
    this.value.set(v ?? '');
  }
  registerOnChange(fn: (v: string) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(d: boolean): void {
    this.disabled.set(d);
  }
}
