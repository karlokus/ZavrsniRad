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
 * Textarea s labelom. Stil iz dizajn `.field` / `.textarea`.
 * ControlValueAccessor — radi s Reactive Forms.
 *
 * Usage: <app-text-area label="Opis" formControlName="description" [rows]="4" />
 */
@Component({
  selector: 'app-text-area',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="field">
      @if (label()) {
        <label class="field__label" [attr.for]="id">{{ label() }}</label>
      }
      <textarea
        class="textarea"
        [id]="id"
        [rows]="rows()"
        [placeholder]="placeholder()"
        [value]="value()"
        [disabled]="disabled()"
        [class.has-error]="!!error()"
        (input)="onInput($event)"
        (blur)="onTouched()"
      ></textarea>
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
    .textarea {
      width: 100%;
      padding: 9px 12px;
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-sm);
      background: var(--surface);
      outline: none;
      min-height: 90px;
      resize: vertical;
      line-height: 1.5;
      transition: border-color 0.12s, box-shadow 0.12s;
    }
    .textarea:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
    .textarea.has-error { border-color: var(--danger); }
    .textarea:disabled { opacity: 0.6; }
    `,
  ],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => TextArea), multi: true },
  ],
})
export class TextArea implements ControlValueAccessor {
  readonly label = input('');
  readonly hint = input('');
  readonly error = input('');
  readonly placeholder = input('');
  readonly rows = input(4);

  protected readonly id = `ta-${++uid}`;
  protected readonly value = signal('');
  protected readonly disabled = signal(false);

  private onChange: (v: string) => void = () => {};
  protected onTouched: () => void = () => {};

  onInput(e: Event): void {
    const v = (e.target as HTMLTextAreaElement).value;
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
