import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  forwardRef,
  input,
  model,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * Mastery dots (1–5). Stil iz dizajn `.mastery` + `.is-on` + `.is-warm`.
 *
 * Dva načina:
 *  - prikaz:  <app-mastery-dots [value]="3" [label]="'3/5'" />
 *  - unos:    <app-mastery-dots interactive formControlName="notesMastery" />
 *    (ControlValueAccessor — klik na n-ti dot postavlja vrijednost n; FZ §5.2)
 */
@Component({
  selector: 'app-mastery-dots',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="mastery" [title]="value() + '/' + max()">
      @for (i of dots(); track i) {
        <span
          class="mastery__dot"
          [class.is-on]="i <= value()"
          [class.is-warm]="warm()"
          [class.clickable]="interactive()"
          (click)="pick(i)"
        ></span>
      }
      @if (label() !== null) {
        <span class="mastery__label">{{ label() }}</span>
      }
    </span>
  `,
  styles: [
    `
    .mastery { display: inline-flex; gap: 3px; align-items: center; }
    .mastery__dot { width: 7px; height: 7px; border-radius: 999px; background: var(--surface-3); }
    .mastery__dot.is-on { background: var(--accent); }
    .mastery__dot.is-on.is-warm { background: var(--warm); }
    .mastery__dot.clickable { width: 12px; height: 12px; cursor: pointer; }
    .mastery__label { font-size: 11.5px; color: var(--muted); margin-left: 6px; }
    `,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MasteryDots),
      multi: true,
    },
  ],
})
export class MasteryDots implements ControlValueAccessor {
  readonly max = input(5);
  readonly warm = input(false, { transform: booleanAttribute });
  readonly label = input<string | null>(null);
  readonly interactive = input(false, { transform: booleanAttribute });

  /** Dvosmjerno za ne-form upotrebu: [(value)]. */
  readonly value = model(0);

  protected readonly dots = computed(() => Array.from({ length: this.max() }, (_, i) => i + 1));
  private onChange: (v: number) => void = () => {};
  private onTouched: () => void = () => {};
  private disabled = false;

  pick(n: number): void {
    if (!this.interactive() || this.disabled) return;
    this.value.set(n);
    this.onChange(n);
    this.onTouched();
  }

  // ControlValueAccessor
  writeValue(v: number | null): void {
    this.value.set(v ?? 0);
  }
  registerOnChange(fn: (v: number) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
