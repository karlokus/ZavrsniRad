import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

export interface SegmentOption<T = string> {
  value: T;
  label: string;
}

/**
 * Segmentirani prekidač. Stil iz dizajn `.seg` + `.seg__btn.is-on`.
 * Npr. repertoire filter "Sve / Naučene / U učenju".
 *
 * Usage: <app-segmented [options]="opts" [(value)]="filter" />
 */
@Component({
  selector: 'app-segmented',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="seg" role="group">
      @for (o of options(); track o.value) {
        <button
          type="button"
          class="seg__btn"
          [class.is-on]="o.value === value()"
          (click)="value.set(o.value)"
        >
          {{ o.label }}
        </button>
      }
    </div>
  `,
  styles: [
    `
    .seg {
      display: inline-flex;
      background: var(--surface-2);
      border-radius: var(--radius-sm);
      padding: 3px;
      gap: 2px;
    }
    .seg__btn {
      padding: 5px 12px;
      font-size: 12.5px;
      background: transparent;
      border: none;
      border-radius: 5px;
      color: var(--muted);
    }
    .seg__btn.is-on { background: var(--surface); color: var(--ink); box-shadow: var(--shadow-sm); }
    `,
  ],
})
export class Segmented<T = string> {
  readonly options = input.required<SegmentOption<T>[]>();
  readonly value = model<T>();
}
