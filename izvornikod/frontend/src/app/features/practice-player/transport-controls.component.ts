import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Icon } from '../../shared/ui/icon/icon';
import { MidiPlayerService } from './midi-player.service';

function mmss(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * Transport bar (§6.3 logic, §6.7 skin): circular transport buttons
 * (`.transport__btn` 38px, play 46px ink), scrub seek, tempo slider
 * (FZ-L05 — Transport.bpm only, no pitch shift), Geist Mono time display.
 */
@Component({
  selector: 'app-transport-controls',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    <div class="transport">
      <div class="row main">
        <button
          type="button"
          class="transport__btn transport__btn--play"
          [attr.aria-label]="player.isPlaying() ? 'Pauza' : 'Sviraj'"
          (click)="toggle()"
        >
          <app-icon [name]="player.isPlaying() ? 'pause' : 'play'" [size]="18" />
        </button>
        <button
          type="button"
          class="transport__btn"
          aria-label="Zaustavi"
          (click)="player.stop()"
        >
          <app-icon name="stop" [size]="15" />
        </button>

        <span class="time">{{ currentLabel() }}</span>
        <input
          class="seek"
          type="range"
          min="0"
          [max]="player.duration()"
          step="0.01"
          [value]="player.currentTime()"
          (input)="onSeek($event)"
          aria-label="Pozicija reprodukcije"
        />
        <span class="time">{{ durationLabel() }}</span>
      </div>

      <div class="row tempo">
        <label class="tempo-label" for="tempo">Tempo</label>
        <input
          id="tempo"
          class="seek"
          type="range"
          min="20"
          max="300"
          step="1"
          [value]="player.bpm()"
          (input)="onTempo($event)"
        />
        <span class="bpm">{{ player.bpm() }} BPM</span>
        @if (player.bpm() !== originalBpmRounded()) {
          <button type="button" class="tempo-reset" (click)="resetTempo()">
            Original ({{ originalBpmRounded() }})
          </button>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .transport {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }
      .row {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .transport__btn {
        width: 38px;
        height: 38px;
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 1px solid var(--border-strong);
        background: var(--surface);
        color: var(--ink);
        flex: 0 0 auto;
        transition: background 0.12s, filter 0.12s;
      }
      .transport__btn:hover {
        background: var(--surface-2);
      }
      .transport__btn--play {
        width: 46px;
        height: 46px;
        background: var(--ink);
        color: var(--bg);
        border-color: var(--ink);
      }
      .transport__btn--play:hover {
        filter: brightness(1.15);
        background: var(--ink);
      }
      .time {
        font-family: var(--font-mono);
        font-size: 12px;
        color: var(--muted);
        min-width: 40px;
        text-align: center;
      }
      .seek {
        flex: 1;
        accent-color: var(--accent);
      }
      .tempo-label {
        font-size: 13px;
        color: var(--muted);
      }
      .bpm {
        font-family: var(--font-mono);
        font-size: 12px;
        color: var(--muted);
        min-width: 64px;
        text-align: right;
      }
      .tempo-reset {
        font-size: 12px;
        color: var(--accent-ink);
        background: none;
        border: none;
        padding: 4px 6px;
        cursor: pointer;
      }
      .tempo-reset:hover {
        text-decoration: underline;
      }
    `,
  ],
})
export class TransportControlsComponent {
  protected readonly player = inject(MidiPlayerService);

  protected readonly currentLabel = computed(() => mmss(this.player.currentTime()));
  protected readonly durationLabel = computed(() => mmss(this.player.duration()));
  protected readonly originalBpmRounded = computed(() =>
    Math.round(this.player.originalBpm()),
  );

  protected toggle(): void {
    if (this.player.isPlaying()) this.player.pause();
    else void this.player.play();
  }

  protected onSeek(event: Event): void {
    this.player.seek(Number((event.target as HTMLInputElement).value));
  }

  protected onTempo(event: Event): void {
    this.player.setBpm(Number((event.target as HTMLInputElement).value));
  }

  protected resetTempo(): void {
    this.player.setBpm(this.originalBpmRounded());
  }
}
