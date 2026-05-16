import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

/**
 * Kontejner kartica. Stil iz dizajn `.card`.
 * Naslov + opcionalni akcijski slot (`[card-actions]`), tijelo kroz ng-content.
 *
 * Usage:
 *  <app-card title="Napredak">
 *    <button card-actions appButton variant="ghost">Više</button>
 *    ...sadržaj...
 *  </app-card>
 */
@Component({
  selector: 'app-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (title() || hasHead()) {
      <div class="card__head">
        <div class="card__title">{{ title() }}</div>
        <ng-content select="[card-actions]" />
      </div>
    }
    <ng-content />
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
    :host(.flat) { box-shadow: none; }
    .card__head {
      display: flex; align-items: baseline; justify-content: space-between;
      margin-bottom: 14px;
    }
    .card__title {
      font-size: 13px; color: var(--muted); font-weight: 500;
      text-transform: uppercase; letter-spacing: 0.06em;
    }
    `,
  ],
})
export class Card {
  readonly title = input('');
  /** Prikaži head traku i bez naslova (npr. samo akcije). */
  readonly hasHead = input(false, { transform: booleanAttribute });
}
