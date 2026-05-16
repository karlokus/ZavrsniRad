import { ChangeDetectionStrategy, Component, input } from '@angular/core';

// TODO(§6 — Faza 2, Sessions): izvještaj sesije + manualne metrike (FZ-L07).
@Component({
  selector: 'app-session-report-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h1>Izvještaj sesije {{ id() }}</h1>`,
})
export class SessionReportPage {
  // Vezano iz rute `practice/session/:id/report`.
  readonly id = input.required<string>();
}
