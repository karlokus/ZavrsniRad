import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type DeltaKind = 'good' | 'bad' | 'flat';

/**
 * Stat kartica (KPI). Stil iz dizajn `.card` + `.card__big` (serif 36px) + `.card__delta`.
 *
 * Usage: <app-stat label="Naučene pjesme" value="18" sub="od 42" delta="+3" />
 */
@Component({
  selector: 'app-stat',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card__title">{{ label() }}</div>
    <div class="card__big">{{ value() }}</div>
    @if (sub()) {
      <div class="sub">{{ sub() }}</div>
    }
    @if (delta()) {
      <div class="delta" [class.delta--bad]="deltaKind() === 'bad'" [class.delta--flat]="deltaKind() === 'flat'">
        {{ delta() }}
      </div>
    }
  `,
  styles: [
    `
    :host {
      display: block;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 20px;
    }
    .card__title {
      font-size: 13px; color: var(--muted); font-weight: 500;
      text-transform: uppercase; letter-spacing: 0.06em;
    }
    .card__big { font-family: var(--font-serif); font-size: 36px; line-height: 1; margin-top: 8px; }
    .sub { font-size: 12px; color: var(--muted); margin-top: 4px; }
    .delta { font-size: 12px; color: var(--good); margin-top: 4px; }
    .delta--bad { color: var(--danger); }
    .delta--flat { color: var(--muted); }
    `,
  ],
})
export class Stat {
  readonly label = input('');
  readonly value = input<string | number>('');
  readonly sub = input('');
  readonly delta = input('');
  readonly deltaKind = input<DeltaKind>('good');
}
