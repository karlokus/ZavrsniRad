import { ChangeDetectionStrategy, Component, input } from '@angular/core';

// TODO(§5/§6/§7 — detalj kompozicije: tabovi Note/Tekst/Mediji/Mastery).
@Component({
  selector: 'app-composition-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h1>Kompozicija {{ id() }}</h1>`,
})
export class CompositionDetailPage {
  // Vezano iz rute `repertoire/:id` preko withComponentInputBinding().
  readonly id = input.required<string>();
}
