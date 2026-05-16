import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
} from '@angular/core';

/**
 * Chip / pill. Stil iz dizajn `.chip` + `.chip__dot`.
 * Ako je zadana `color` (HEX), pozadina/tekst/rub se izvode iz nje
 * (color+'22' bg, color tekst, color+'44' rub) — isto kao dizajn.
 *
 * Usage: <app-chip color="#1E90FF">Klape</app-chip>
 */
@Component({
  selector: 'app-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (dot() && color()) {
      <span class="chip__dot" [style.background]="color()"></span>
    }
    <ng-content />
  `,
  styles: [
    `
    :host {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 2px 9px;
      border-radius: 999px;
      font-size: 12px;
      background: var(--surface-3);
      color: var(--ink-2);
      border: 1px solid transparent;
    }
    .chip__dot { width: 6px; height: 6px; border-radius: 999px; }
    `,
  ],
  host: {
    '[style.background]': 'bg()',
    '[style.color]': 'fg()',
    '[style.borderColor]': 'bd()',
  },
})
export class Chip {
  readonly color = input<string | null>(null);
  readonly dot = input(true, { transform: booleanAttribute });

  protected readonly bg = computed(() => (this.color() ? `${this.color()}22` : null));
  protected readonly fg = computed(() => this.color());
  protected readonly bd = computed(() => (this.color() ? `${this.color()}44` : null));
}
