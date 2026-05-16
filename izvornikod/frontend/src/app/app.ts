import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ToastHostComponent } from './core/notifications/toast-host.component';

// Toast host živi u rootu (ne u AppShell-u) da toastovi rade i na /auth
// stranicama — npr. 401/400 prikaz pri sign-in/sign-up.
@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, ToastHostComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
