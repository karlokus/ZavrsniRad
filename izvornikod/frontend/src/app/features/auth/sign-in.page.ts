import { ChangeDetectionStrategy, Component } from '@angular/core';

// TODO(§5 — Faza 1, Auth): prava sign-in forma (Reactive Forms, AuthService.signIn).
@Component({
  selector: 'app-sign-in-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h1>Prijava</h1>`,
})
export class SignInPage {}
