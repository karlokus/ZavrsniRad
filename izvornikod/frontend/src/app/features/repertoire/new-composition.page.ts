import { ChangeDetectionStrategy, Component } from '@angular/core';

// TODO(§5 — Faza 1, Repertoire): forma za novu kompoziciju (SONG).
@Component({
  selector: 'app-new-composition-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h1>Nova pjesma</h1>`,
})
export class NewCompositionPage {}
