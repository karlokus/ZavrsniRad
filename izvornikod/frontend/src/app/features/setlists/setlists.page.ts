import { ChangeDetectionStrategy, Component } from '@angular/core';

// TODO(§7 — Faza 3, Setlists): lista setlista (SetlistsApi).
@Component({
  selector: 'app-setlists-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h1>Setliste</h1>`,
})
export class SetlistsPage {}
