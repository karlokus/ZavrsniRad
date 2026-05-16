import { ChangeDetectionStrategy, Component } from '@angular/core';

// TODO(§5 — Faza 1, Profile): profil + change-password dialog (UsersApi).
@Component({
  selector: 'app-profile-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h1>Profil</h1>`,
})
export class ProfilePage {}
