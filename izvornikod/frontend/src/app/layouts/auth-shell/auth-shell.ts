import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Auth shell — okvir za /auth rute (sign-in, sign-up).
 *
 * TODO(§5.3 — Faza 1 styling): `.auth-wrap` grid `1fr 1fr`, lijevo
 * `.auth-aside` (brand + Instrument Serif quote), desno `.auth-form`.
 * Zasad samo prazni okvir oko <router-outlet />.
 */
@Component({
  selector: 'app-auth-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
  templateUrl: './auth-shell.html',
  styleUrl: './auth-shell.css',
})
export class AuthShell {}
