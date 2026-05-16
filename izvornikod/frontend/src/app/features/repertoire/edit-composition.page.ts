import { ChangeDetectionStrategy, Component, input } from '@angular/core';

// TODO(§5 — Faza 1, Repertoire): forma za uređivanje kompozicije.
@Component({
  selector: 'app-edit-composition-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h1>Uredi kompoziciju {{ id() }}</h1>`,
})
export class EditCompositionPage {
  // Vezano iz rute `repertoire/:id/edit`.
  readonly id = input.required<string>();
}
