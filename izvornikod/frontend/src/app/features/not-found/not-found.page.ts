import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

// TODO(§8 — Faza 4, Polish): pravi 404 prikaz (ilustracija + CTA).
@Component({
  selector: 'app-not-found-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <h1>404 — Stranica nije pronađena</h1>
    <a routerLink="/dashboard">Natrag na nadzornu ploču</a>
  `,
})
export class NotFoundPage {}
