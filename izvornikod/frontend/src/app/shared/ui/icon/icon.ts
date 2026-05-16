import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ICON_PATHS } from './icon-paths';

/**
 * Inline SVG ikona. Set ikona iz dizajn/components.jsx (ICON_PATHS).
 * `stroke="currentColor"` → boja se nasljeđuje iz `color` roditelja.
 *
 * Usage: <app-icon name="music" [size]="16" />
 */
@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="icon" [innerHTML]="svg()"></span>`,
  styles: [
    `:host { display: inline-flex; line-height: 0; }
     .icon, .icon svg { display: block; }`,
  ],
})
export class Icon {
  private readonly sanitizer = inject(DomSanitizer);

  readonly name = input.required<string>();
  readonly size = input(16);
  readonly stroke = input(1.5);

  protected readonly svg = computed<SafeHtml>(() => {
    const inner = ICON_PATHS[this.name()] ?? '';
    const s = this.size();
    const svg =
      `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" ` +
      `stroke="currentColor" stroke-width="${this.stroke()}" ` +
      `stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  });
}
