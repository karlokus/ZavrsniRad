import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Auth shell — okvir za /auth rute (sign-in, sign-up).
 * Raspored u `auth-shell.html`/`.css`: `.auth-wrap` grid 1fr/1fr —
 * lijevo `.auth-aside` (brand + Instrument Serif citat), desno forma;
 * ispod 768px aside se skriva (§5.3).
 */
@Component({
  selector: 'app-auth-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
  templateUrl: './auth-shell.html',
  styleUrl: './auth-shell.css',
})
export class AuthShell {}
