import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../icon/icon';

export interface Crumb {
  label: string;
  link?: string;
}

/**
 * Breadcrumb staza. Stil iz dizajn `.topbar__crumb`.
 * Zadnji element je tekući (bez linka).
 *
 * Usage: <app-breadcrumb [items]="[{label:'Repertoar',link:'/repertoire'},{label:'Đelozija'}]" />
 */
@Component({
  selector: 'app-breadcrumb',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon],
  template: `
    <nav class="crumb" aria-label="Putanja">
      @for (c of items(); track $index; let last = $last) {
        @if (c.link && !last) {
          <a [routerLink]="c.link">{{ c.label }}</a>
        } @else {
          <span [class.current]="last">{{ c.label }}</span>
        }
        @if (!last) {
          <app-icon name="chevron_right" [size]="13" />
        }
      }
    </nav>
  `,
  styles: [
    `
    .crumb {
      display: flex; align-items: center; gap: 6px;
      color: var(--muted); font-size: 13px;
    }
    .crumb a:hover { color: var(--ink); }
    .crumb .current { color: var(--ink-2); }
    `,
  ],
})
export class Breadcrumb {
  readonly items = input.required<Crumb[]>();
}
