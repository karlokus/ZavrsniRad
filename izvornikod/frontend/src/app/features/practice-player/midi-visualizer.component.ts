import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  viewChild,
} from '@angular/core';
import { MidiPlayerService } from './midi-player.service';

const PX_PER_SEC = 90;
const ROW_H = 8;
/** Fallback piano range if the file has no notes (88-key: A0..C8). */
const FALLBACK_MIN = 21;
const FALLBACK_MAX = 108;

/**
 * SVG piano-roll (§6.3, FZ-L04). x = time, y = pitch. Reads the
 * route-scoped MidiPlayerService directly: `activeNoteIndex` drives the
 * highlighted note, `currentTime` the playhead cursor. Click-to-seek.
 * SVG (not Canvas) so signal reactivity binds straight to attributes.
 */
@Component({
  selector: 'app-midi-visualizer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div #scroll class="roll-scroll">
      @if (player.allNotes().length === 0) {
        <p class="empty">MIDI nema nota za prikaz.</p>
      } @else {
        <svg
          class="roll"
          [attr.width]="width()"
          [attr.height]="height()"
          [attr.viewBox]="'0 0 ' + width() + ' ' + height()"
          (click)="onSeek($event)"
        >
          @for (note of player.allNotes(); track $index) {
            <rect
              class="note"
              [class.is-active]="$index === player.activeNoteIndex()"
              [attr.x]="note.time * PX_PER_SEC"
              [attr.y]="(maxMidi() - note.midi) * ROW_H"
              [attr.width]="max(2, note.duration * PX_PER_SEC)"
              [attr.height]="ROW_H - 1"
              rx="1.5"
            >
              <title>{{ note.name }}</title>
            </rect>
          }
          <line
            class="cursor"
            [attr.x1]="player.currentTime() * PX_PER_SEC"
            [attr.x2]="player.currentTime() * PX_PER_SEC"
            y1="0"
            [attr.y2]="height()"
          />
        </svg>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        overflow: hidden;
      }
      .roll-scroll {
        overflow-x: auto;
        overflow-y: hidden;
        padding: 12px;
      }
      .roll {
        display: block;
        cursor: crosshair;
      }
      .note {
        fill: var(--accent-soft);
        stroke: var(--accent);
        stroke-width: 0.5;
        transition: fill 0.08s;
      }
      .note.is-active {
        fill: var(--accent);
      }
      .cursor {
        stroke: var(--ink);
        stroke-width: 1.5;
        pointer-events: none;
      }
      .empty {
        color: var(--muted);
        font-size: 13px;
        padding: 24px;
        text-align: center;
      }
    `,
  ],
})
export class MidiVisualizerComponent {
  protected readonly player = inject(MidiPlayerService);
  protected readonly PX_PER_SEC = PX_PER_SEC;
  protected readonly ROW_H = ROW_H;
  protected readonly max = Math.max;

  private readonly scrollEl =
    viewChild<ElementRef<HTMLDivElement>>('scroll');

  private readonly pitchRange = computed(() => {
    const notes = this.player.allNotes();
    if (notes.length === 0) return { min: FALLBACK_MIN, max: FALLBACK_MAX };
    let min = Infinity;
    let max = -Infinity;
    for (const n of notes) {
      if (n.midi < min) min = n.midi;
      if (n.midi > max) max = n.midi;
    }
    // One row of padding above/below for breathing room.
    return { min: min - 1, max: max + 1 };
  });

  protected readonly maxMidi = computed(() => this.pitchRange().max);
  protected readonly width = computed(() =>
    Math.max(1, Math.ceil(this.player.duration() * PX_PER_SEC)),
  );
  protected readonly height = computed(() => {
    const r = this.pitchRange();
    return Math.max(ROW_H, (r.max - r.min + 1) * ROW_H);
  });

  constructor() {
    // Keep the playhead in view while playing (~1/3 from the left edge).
    effect(() => {
      const x = this.player.currentTime() * PX_PER_SEC;
      const host = this.scrollEl()?.nativeElement;
      if (!host || !this.player.isPlaying()) return;
      const target = x - host.clientWidth / 3;
      host.scrollLeft = Math.max(0, target);
    });
  }

  protected onSeek(event: MouseEvent): void {
    const svg = event.currentTarget as SVGSVGElement;
    const rect = svg.getBoundingClientRect();
    const x = event.clientX - rect.left;
    this.player.seek(x / PX_PER_SEC);
  }
}
