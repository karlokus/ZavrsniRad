import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

let uid = 0;

/**
 * Tekstualni input s labelom. Stil iz dizajn `.field` / `.field__label` / `.input`.
 * ControlValueAccessor — radi s Reactive Forms (formControlName).
 *
 * Usage: <app-text-field label="Email" type="email" formControlName="email" [error]="emailError()" />
 */
@Component({
  selector: 'app-text-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="field">
      @if (label()) {
        <label class="field__label" [attr.for]="id">{{ label() }}</label>
      }
      <input
        class="input"
        [id]="id"
        [type]="type()"
        [placeholder]="placeholder()"
        [value]="value()"
        [disabled]="disabled()"
        [class.has-error]="!!error()"
        (input)="onInput($event)"
        (blur)="onTouched()"
      />
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
    .input {
      width: 100%;
      padding: 9px 12px;
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-sm);
      background: var(--surface);
      outline: none;
      transition: border-color 0.12s, box-shadow 0.12s;
    }
    .input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
    .input.has-error { border-color: var(--danger); }
    .input:disabled { opacity: 0.6; }
    `,
  ],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => TextField), multi: true },
  ],
})
export class TextField implements ControlValueAccessor {
  readonly label = input('');
  readonly hint = input('');
  readonly error = input('');
  readonly type = input('text');
  readonly placeholder = input('');

  protected readonly id = `tf-${++uid}`;
  protected readonly value = signal('');
  protected readonly disabled = signal(false);

  private onChange: (v: string) => void = () => {};
  protected onTouched: () => void = () => {};

  onInput(e: Event): void {
    const v = (e.target as HTMLInputElement).value;
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
