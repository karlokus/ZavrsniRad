import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { Button } from '../../shared/ui/button/button';

function mmss(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * Loop-segment selector (§6.3, FZ-L06). The user drags start/end markers
 * (range thumbs — keyboard-accessible) to bound an A–B practice loop, or
 * snaps either marker to the current playhead. State is two-way bound
 * (`start`/`end`/`enabled`); PracticePlayerPage owns the actual looping
 * via MidiPlayerService.seek().
 */
@Component({
  selector: 'app-segment-selector',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button],
  template: `
    <div class="seg">
      <label class="seg__toggle">
        <input
          type="checkbox"
          [checked]="enabled()"
          (change)="enabled.set($any($event.target).checked)"
        />
        Petlja segmenta (A–B)
      </label>

      <div class="seg__row" [class.is-off]="!enabled()">
        <span class="seg__cap">A</span>
        <input
          type="range"
          min="0"
          [max]="duration()"
          step="0.1"
          [value]="start()"
          (input)="onStart($event)"
          aria-label="Početak segmenta"
        />
        <span class="seg__t mono">{{ startLabel() }}</span>
        <button appButton variant="ghost" size="sm" (click)="snapStart()">
          Ovdje
        </button>
      </div>

      <div class="seg__row" [class.is-off]="!enabled()">
        <span class="seg__cap">B</span>
        <input
          type="range"
          min="0"
          [max]="duration()"
          step="0.1"
          [value]="end()"
          (input)="onEnd($event)"
          aria-label="Kraj segmenta"
        />
        <span class="seg__t mono">{{ endLabel() }}</span>
        <button appButton variant="ghost" size="sm" (click)="snapEnd()">
          Ovdje
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .seg {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .seg__toggle {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        color: var(--ink-2);
      }
      .seg__row {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .seg__row.is-off {
        opacity: 0.5;
      }
      .seg__row input[type='range'] {
        flex: 1;
        accent-color: var(--accent);
      }
      .seg__cap {
        font-size: 12px;
        font-weight: 600;
        color: var(--muted);
        width: 14px;
        text-align: center;
      }
      .seg__t {
        font-size: 12px;
        color: var(--muted);
        min-width: 38px;
        text-align: right;
      }
    `,
  ],
})
export class SegmentSelectorComponent {
  /** Track length in seconds — bounds the markers. */
  readonly duration = input<number>(0);
  /** Current playhead position, used by the "Ovdje" snap buttons. */
  readonly currentTime = input<number>(0);

  readonly start = model<number>(0);
  readonly end = model<number>(0);
  readonly enabled = model<boolean>(false);

  protected readonly startLabel = computed(() => mmss(this.start()));
  protected readonly endLabel = computed(() => mmss(this.end()));

  protected onStart(event: Event): void {
    const v = Number((event.target as HTMLInputElement).value);
    // Keep A strictly before B.
    this.start.set(Math.min(v, this.end()));
  }

  protected onEnd(event: Event): void {
    const v = Number((event.target as HTMLInputElement).value);
    this.end.set(Math.max(v, this.start()));
  }

  protected snapStart(): void {
    this.start.set(Math.min(this.currentTime(), this.end()));
  }

  protected snapEnd(): void {
    const v = this.currentTime();
    this.end.set(Math.max(v, this.start()));
  }
}
