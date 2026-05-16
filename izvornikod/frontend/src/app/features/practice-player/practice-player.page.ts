import { ChangeDetectionStrategy, Component, input } from '@angular/core';

// TODO(§6 — Faza 2, MIDI Player): Tone.js player + SVG vizualizator + transport.
@Component({
  selector: 'app-practice-player-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h1>Vježbanje — kompozicija {{ compositionId() }}</h1>`,
})
export class PracticePlayerPage {
  // Vezano iz rute `practice/:compositionId`.
  readonly compositionId = input.required<string>();
}
