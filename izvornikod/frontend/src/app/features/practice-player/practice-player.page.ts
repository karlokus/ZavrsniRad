import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Card } from '../../shared/ui/card/card';
import { Spinner } from '../../shared/ui/spinner/spinner';
import { Icon } from '../../shared/ui/icon/icon';
import { CompositionFile } from './composition-file.types';
import { CompositionFilesApiService } from './composition-files-api.service';
import { MidiPlayerService } from './midi-player.service';
import { MidiVisualizerComponent } from './midi-visualizer.component';
import { TransportControlsComponent } from './transport-controls.component';
import { SegmentSelectorComponent } from './segment-selector.component';
import { SessionRecorderControls } from './session-recorder-controls.component';

/**
 * Practice player orchestrator (§6.3). Resolves the MIDI file (route
 * resolver → `midi` input via withComponentInputBinding), fetches the
 * parsed payload, loads MidiPlayerService, and composes the visualizer,
 * transport, A–B loop selector and session recorder. The A–B loop itself
 * lives here (wraps via MidiPlayerService.seek) so the service stays §6.2.
 */
@Component({
  selector: 'app-practice-player-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    Card,
    Spinner,
    Icon,
    MidiVisualizerComponent,
    TransportControlsComponent,
    SegmentSelectorComponent,
    SessionRecorderControls,
  ],
  template: `
    <div class="player-wrap">
      <div class="player-head">
        <div>
          <h1 class="player-title">Vježbanje</h1>
          <p class="player-sub">{{ midi().fileName }}</p>
        </div>
        <a [routerLink]="['/repertoire', compositionId()]">
          <button class="back" type="button">
            <app-icon name="chevron_right" [size]="14" /> Natrag na pjesmu
          </button>
        </a>
      </div>

      @if (loading()) {
        <div class="center"><app-spinner /></div>
      } @else if (failed()) {
        <app-card>
          <p class="err">Ne mogu učitati MIDI sadržaj.</p>
        </app-card>
      } @else {
        <div class="player">
          <app-midi-visualizer />
          <app-transport-controls />

          <div class="player-grid">
            <app-card title="Segment vježbanja">
              <app-segment-selector
                [duration]="player.duration()"
                [currentTime]="player.currentTime()"
                [start]="segStart()"
                (startChange)="segStart.set($event)"
                [end]="segEnd()"
                (endChange)="segEnd.set($event)"
                [enabled]="loopEnabled()"
                (enabledChange)="loopEnabled.set($event)"
              />
            </app-card>

            <app-card title="Sesija">
              <app-session-recorder-controls [compositionId]="compositionId()" />
            </app-card>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .player-wrap {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .player-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
      }
      .player-title {
        font-family: var(--font-serif);
        font-size: 28px;
      }
      .player-sub {
        color: var(--muted);
        font-size: 14px;
        margin-top: 4px;
      }
      .back {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        color: var(--muted);
        background: none;
        border: none;
        cursor: pointer;
      }
      .back:hover {
        color: var(--ink);
      }
      .center {
        display: flex;
        justify-content: center;
        padding: 60px;
      }
      .player {
        background: var(--surface-2);
        border-radius: var(--radius-lg);
        padding: 24px 20px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .player-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 16px;
      }
      .err {
        color: var(--danger);
        font-size: 14px;
      }
    `,
  ],
})
export class PracticePlayerPage {
  /** Route param `practice/:compositionId`. */
  readonly compositionId = input.required<string>();
  /** Resolved by practiceMidiResolver (resolve key `midi`). */
  readonly midi = input.required<CompositionFile>();

  protected readonly player = inject(MidiPlayerService);
  private readonly filesApi = inject(CompositionFilesApiService);

  protected readonly loading = signal(true);
  protected readonly failed = signal(false);

  // A–B loop state (two-way bound to SegmentSelectorComponent).
  protected readonly segStart = signal(0);
  protected readonly segEnd = signal(0);
  protected readonly loopEnabled = signal(false);

  private loadedFileId: string | null = null;

  constructor() {
    // Fetch parsed MIDI once per resolved file, then hand it to the service.
    effect(() => {
      const file = this.midi();
      if (!file || this.loadedFileId === file.id) return;
      this.loadedFileId = file.id;
      this.loading.set(true);
      this.failed.set(false);
      this.filesApi.getMidiData(file.id).subscribe({
        next: (parsed) => {
          this.player.load(parsed);
          untracked(() => this.segEnd.set(this.player.duration()));
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.failed.set(true);
        },
      });
    });

    // A–B loop: wrap back to A when the playhead reaches B.
    effect(() => {
      const t = this.player.currentTime();
      if (!this.loopEnabled() || !this.player.isPlaying()) return;
      const a = untracked(this.segStart);
      const b = untracked(this.segEnd);
      if (b > a && t >= b) this.player.seek(a);
    });
  }
}
