import { ChangeDetectionStrategy, Component, input } from '@angular/core';

// TODO(§7 — Faza 3, Setlists): detalj + drag-drop reorder (SetlistWithMastery).
@Component({
  selector: 'app-setlist-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h1>Setlista {{ id() }}</h1>`,
})
export class SetlistDetailPage {
  // Vezano iz rute `setlists/:id`.
  readonly id = input.required<string>();
}
