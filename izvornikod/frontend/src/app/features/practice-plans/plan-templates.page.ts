import { ChangeDetectionStrategy, Component } from '@angular/core';

// TODO(§6 — Faza 2, Plans): lista recurring template-a ("moje rutine").
@Component({
  selector: 'app-plan-templates-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h1>Rutine</h1>`,
})
export class PlanTemplatesPage {}
