import { ChangeDetectionStrategy, Component } from '@angular/core';

// TODO(§5 — Faza 1, Auth): prava sign-up forma + instrument combobox (lookups).
@Component({
  selector: 'app-sign-up-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h1>Registracija</h1>`,
})
export class SignUpPage {}
