import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

/**
 * Redak liste (grid). Stil iz dizajn `.list-row` / `.list-row--head`.
 * `gridTemplate` se zadaje po featureu (npr. repertoar:
 * "36px 2fr 1.5fr 1fr 1fr 1fr 28px"). Ćelije idu kroz ng-content.
 *
 * Usage:
 *  <app-list-row gridTemplate="36px 2fr 1fr 28px">
 *    <div>...</div><div>...</div>...
 *  </app-list-row>
 */
@Component({
  selector: 'app-list-row',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  host: {
    class: 'list-row',
    '[class.list-row--head]': 'head()',
    '[style.gridTemplateColumns]': 'gridTemplate()',
  },
  styles: [
    `
    :host {
      display: grid;
      gap: 12px;
      align-items: center;
      padding: 12px 14px;
      border-bottom: 1px solid var(--border);
      transition: background 0.1s;
    }
    :host(:not(.list-row--head)):hover { background: var(--surface-2); cursor: pointer; }
    :host(.list-row--head) {
      background: var(--bg);
      font-size: 11px;
      color: var(--muted);
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 10px 14px;
    }
    `,
  ],
})
export class ListRow {
  readonly gridTemplate = input('1fr');
  readonly head = input(false, { transform: booleanAttribute });
}
