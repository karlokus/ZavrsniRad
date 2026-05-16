import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

export type ButtonVariant = 'default' | 'primary' | 'accent' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Atributni selektor na nativnom <button>/<a> — zadržava nativnu
 * semantiku (type, disabled, click, fokus). Stil iz dizajn `.btn*`.
 *
 * Usage: <button appButton variant="primary" size="sm">Spremi</button>
 */
@Component({
  selector: 'button[appButton], a[appButton]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  host: {
    class: 'btn',
    '[class.btn--primary]': "variant() === 'primary'",
    '[class.btn--accent]': "variant() === 'accent'",
    '[class.btn--ghost]': "variant() === 'ghost'",
    '[class.btn--danger]': "variant() === 'danger'",
    '[class.btn--sm]': "size() === 'sm'",
    '[class.btn--lg]': "size() === 'lg'",
    '[class.btn--block]': 'block()',
    '[class.btn--icon]': 'iconOnly()',
  },
  styles: [
    `
    :host {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 7px 14px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-strong);
      background: var(--surface);
      color: var(--ink);
      font-size: 13px;
      font-weight: 500;
      transition: background 0.12s, border-color 0.12s, filter 0.12s;
      white-space: nowrap;
    }
    :host:hover { background: var(--surface-2); }
    :host(.btn--primary) { background: var(--ink); color: var(--bg); border-color: var(--ink); }
    :host(.btn--primary):hover { background: #2c2924; }
    :host(.btn--accent) { background: var(--accent); color: #fff; border-color: var(--accent); }
    :host(.btn--accent):hover { filter: brightness(1.08); }
    :host(.btn--ghost) { background: transparent; border-color: transparent; color: var(--ink-2); }
    :host(.btn--ghost):hover { background: rgba(26, 24, 21, 0.05); }
    :host(.btn--danger) { color: var(--danger); border-color: transparent; background: transparent; }
    :host(.btn--danger):hover { background: oklch(0.96 0.03 25); }
    :host(.btn--sm) { padding: 4px 10px; font-size: 12px; }
    :host(.btn--lg) { padding: 11px 20px; font-size: 14px; }
    :host(.btn--block) { width: 100%; justify-content: center; }
    :host(.btn--icon) { padding: 7px; }
    :host[disabled], :host(.btn--disabled) { opacity: 0.55; pointer-events: none; }
    `,
  ],
})
export class Button {
  readonly variant = input<ButtonVariant>('default');
  readonly size = input<ButtonSize>('md');
  readonly block = input(false, { transform: booleanAttribute });
  readonly iconOnly = input(false, { transform: booleanAttribute });
}
