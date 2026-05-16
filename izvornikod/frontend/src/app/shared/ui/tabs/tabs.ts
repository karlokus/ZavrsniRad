import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

export interface TabItem {
  id: string;
  label: string;
}

/**
 * Tabovi. Stil iz dizajn `.tabs` + `.tab.is-active` (border-bottom 2px ink).
 * Dvosmjerno: [(active)]="tabId".
 *
 * Usage: <app-tabs [tabs]="tabs" [(active)]="active" />
 */
@Component({
  selector: 'app-tabs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tabs" role="tablist">
      @for (t of tabs(); track t.id) {
        <button
          type="button"
          role="tab"
          class="tab"
          [class.is-active]="t.id === active()"
          [attr.aria-selected]="t.id === active()"
          (click)="active.set(t.id)"
        >
          {{ t.label }}
        </button>
      }
    </div>
  `,
  styles: [
    `
    .tabs { display: flex; gap: 2px; border-bottom: 1px solid var(--border); }
    .tab {
      padding: 9px 14px;
      font-size: 13.5px;
      color: var(--muted);
      cursor: pointer;
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
      user-select: none;
    }
    .tab:hover { color: var(--ink); }
    .tab.is-active { color: var(--ink); border-color: var(--ink); }
    `,
  ],
})
export class Tabs {
  readonly tabs = input.required<TabItem[]>();
  readonly active = model<string>('');
}
