import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Skeleton placeholder s shimmer animacijom (Faza 4 zamjenjuje spinnere).
 *
 * Usage: <app-skeleton width="100%" height="18px" radius="6px" />
 */
@Component({
  selector: 'app-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ``,
  host: {
    '[style.width]': 'width()',
    '[style.height]': 'height()',
    '[style.borderRadius]': 'radius()',
  },
  styles: [
    `
    :host {
      display: block;
      background: linear-gradient(
        90deg,
        var(--surface-2) 25%,
        var(--surface-3) 37%,
        var(--surface-2) 63%
      );
      background-size: 400% 100%;
      animation: skeleton-shimmer 1.4s ease infinite;
    }
    @keyframes skeleton-shimmer {
      0% { background-position: 100% 50%; }
      100% { background-position: 0 50%; }
    }
    `,
  ],
})
export class Skeleton {
  readonly width = input('100%');
  readonly height = input('16px');
  readonly radius = input('6px');
}
