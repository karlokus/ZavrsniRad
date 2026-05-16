import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Spinner indikator učitavanja.
 *
 * Usage: <app-spinner [size]="20" />
 */
@Component({
  selector: 'app-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="sp" [style.width.px]="size()" [style.height.px]="size()"></span>`,
  styles: [
    `
    :host { display: inline-flex; }
    .sp {
      display: block;
      border: 2px solid var(--border-strong);
      border-top-color: var(--accent);
      border-radius: 999px;
      animation: spinner-rotate 0.7s linear infinite;
    }
    @keyframes spinner-rotate { to { transform: rotate(360deg); } }
    `,
  ],
})
export class Spinner {
  readonly size = input(18);
}
