import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  forwardRef,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { OverlayModule } from '@angular/cdk/overlay';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Icon } from '../icon/icon';

export interface ComboOption {
  value: string;
  label: string;
}

let uid = 0;

/**
 * Combobox s typeahead filtriranjem (sign-up instrument, repertoire artist
 * picker, song search). CDK Overlay + tipkovnička navigacija. CVA.
 *
 * Usage: <app-combobox label="Izvođač" [options]="artists()" formControlName="artistId" />
 */
@Component({
  selector: 'app-combobox',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OverlayModule, Icon],
  template: `
    <div class="field">
      @if (label()) {
        <label class="field__label" [attr.for]="id">{{ label() }}</label>
      }
      <div class="cb" #origin cdkOverlayOrigin #trigger="cdkOverlayOrigin">
        <input
          class="input"
          [id]="id"
          autocomplete="off"
          role="combobox"
          [attr.aria-expanded]="open()"
          [placeholder]="placeholder()"
          [value]="query()"
          [disabled]="disabled()"
          (focus)="openPanel()"
          (input)="onType($event)"
          (keydown)="onKey($event)"
          (blur)="onTouched()"
        />
        <app-icon name="chevron_down" [size]="14" />
      </div>
    </div>

    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="trigger"
      [cdkConnectedOverlayOpen]="open()"
      [cdkConnectedOverlayWidth]="width()"
      [cdkConnectedOverlayHasBackdrop]="true"
      cdkConnectedOverlayBackdropClass="cdk-overlay-transparent-backdrop"
      (backdropClick)="closePanel()"
      (detach)="closePanel()"
    >
      <div class="cb__panel">
        @for (o of filtered(); track o.value; let i = $index) {
          <button
            type="button"
            class="cb__opt"
            [class.is-active]="i === activeIndex()"
            (mousedown)="$event.preventDefault()"
            (click)="select(o)"
          >
            {{ o.label }}
          </button>
        } @empty {
          <div class="cb__empty">Nema rezultata</div>
        }
      </div>
    </ng-template>
  `,
  styles: [
    `
    .field { display: flex; flex-direction: column; gap: 6px; }
    .field__label { font-size: 12px; color: var(--muted); letter-spacing: 0.01em; }
    .cb { position: relative; }
    .cb app-icon {
      position: absolute; right: 12px; top: 50%;
      transform: translateY(-50%); color: var(--muted); pointer-events: none;
    }
    .input {
      width: 100%;
      padding: 9px 32px 9px 12px;
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-sm);
      background: var(--surface);
      outline: none;
      transition: border-color 0.12s, box-shadow 0.12s;
    }
    .input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
    .cb__panel {
      margin-top: 4px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      box-shadow: var(--shadow);
      max-height: 240px;
      overflow-y: auto;
      padding: 4px;
    }
    .cb__opt {
      display: block; width: 100%; text-align: left;
      padding: 8px 10px;
      border: none; background: transparent;
      border-radius: var(--radius-sm);
      font-size: 13px; color: var(--ink);
    }
    .cb__opt:hover, .cb__opt.is-active { background: var(--surface-2); }
    .cb__empty { padding: 10px; font-size: 13px; color: var(--muted); }
    `,
  ],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Combobox), multi: true },
  ],
})
export class Combobox implements ControlValueAccessor {
  readonly label = input('');
  readonly placeholder = input('');
  readonly options = input<ComboOption[]>([]);

  protected readonly id = `cb-${++uid}`;
  private readonly originEl = viewChild.required<ElementRef<HTMLElement>>('origin');

  protected readonly open = signal(false);
  protected readonly query = signal('');
  protected readonly activeIndex = signal(0);
  protected readonly disabled = signal(false);

  /** Trenutno odabrana vrijednost (CVA model). */
  private readonly selected = signal<string>('');

  protected readonly width = computed(() => this.originEl().nativeElement.offsetWidth);

  protected readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const opts = this.options();
    if (!q) return opts;
    return opts.filter((o) => o.label.toLowerCase().includes(q));
  });

  private onChange: (v: string) => void = () => {};
  protected onTouched: () => void = () => {};

  openPanel(): void {
    if (this.disabled()) return;
    this.open.set(true);
  }
  closePanel(): void {
    this.open.set(false);
    // Vrati prikaz na label odabrane vrijednosti (ako tipkanje nije završilo izborom).
    this.syncQueryToSelection();
  }

  onType(e: Event): void {
    this.query.set((e.target as HTMLInputElement).value);
    this.activeIndex.set(0);
    this.open.set(true);
  }

  onKey(e: KeyboardEvent): void {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.open.set(true);
      this.activeIndex.update((i) => Math.min(i + 1, this.filtered().length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.activeIndex.update((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const o = this.filtered()[this.activeIndex()];
      if (o) this.select(o);
    } else if (e.key === 'Escape') {
      this.closePanel();
    }
  }

  select(o: ComboOption): void {
    this.selected.set(o.value);
    this.query.set(o.label);
    this.open.set(false);
    this.onChange(o.value);
    this.onTouched();
  }

  private syncQueryToSelection(): void {
    const cur = this.options().find((o) => o.value === this.selected());
    this.query.set(cur ? cur.label : '');
  }

  writeValue(v: string | null): void {
    this.selected.set(v ?? '');
    this.syncQueryToSelection();
  }
  registerOnChange(fn: (v: string) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(d: boolean): void {
    this.disabled.set(d);
  }
}
