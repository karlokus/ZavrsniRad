import { ChangeDetectionStrategy, Component } from '@angular/core';

// TODO(§5 skeleton: summary + needs-practice; §7 full: progress/categories/heatmap/performance).
@Component({
  selector: 'app-dashboard-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h1>Nadzorna ploča</h1>`,
})
export class DashboardPage {}
