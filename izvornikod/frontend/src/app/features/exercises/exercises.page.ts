import { ChangeDetectionStrategy, Component } from '@angular/core';

// TODO(§7 — Faza 3, Exercises): lista + preporuke + weakness scores (ExercisesApi).
@Component({
  selector: 'app-exercises-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h1>Vježbe</h1>`,
})
export class ExercisesPage {}
