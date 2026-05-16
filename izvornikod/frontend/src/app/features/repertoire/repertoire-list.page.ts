import { ChangeDetectionStrategy, Component } from '@angular/core';

// TODO(§5 — Faza 1, Repertoire): paginirana lista + filteri (CompositionsApi).
@Component({
  selector: 'app-repertoire-list-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h1>Repertoar</h1>`,
})
export class RepertoireListPage {}
