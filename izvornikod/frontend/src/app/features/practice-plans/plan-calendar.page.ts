import { ChangeDetectionStrategy, Component } from '@angular/core';

// TODO(§6 — Faza 2, Plans): kalendar s lazy materializacijom recurring instanci.
@Component({
  selector: 'app-plan-calendar-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h1>Plan vježbanja</h1>`,
})
export class PlanCalendarPage {}
