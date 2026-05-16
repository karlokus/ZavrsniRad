import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  ActivatedRouteSnapshot,
  NavigationEnd,
  Router,
  RouterLink,
} from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { Button } from '../../shared/ui/button/button';
import { Icon } from '../../shared/ui/icon/icon';

/**
 * Topbar. Stil iz dizajn `.topbar*`. Naslov se izvodi iz `route.title`
 * (postavljen u app.routes.ts) — prati dubinski aktiviranu rutu.
 */
@Component({
  selector: 'app-topbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Button, Icon],
  template: `
    <div class="topbar">
      <div class="topbar__title">{{ pageTitle() }}</div>
      <div class="topbar__spacer"></div>
      <div class="topbar__actions">
        <a appButton variant="accent" routerLink="/repertoire/new">
          <app-icon name="plus" [size]="13" />
          Nova pjesma
        </a>
      </div>
    </div>
  `,
  styles: [
    `
    .topbar {
      display: flex; align-items: center; gap: 16px;
      padding: 16px 32px;
      border-bottom: 1px solid var(--border);
      background: var(--bg);
      flex-shrink: 0;
    }
    .topbar__title { font-family: var(--font-serif); font-size: 22px; letter-spacing: -0.01em; }
    .topbar__spacer { flex: 1; }
    .topbar__actions { display: flex; align-items: center; gap: 8px; }
    `,
  ],
})
export class Topbar {
  private readonly router = inject(Router);

  protected readonly pageTitle = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      startWith(null),
      map(() => this.resolveTitle()),
    ),
    { initialValue: this.resolveTitle() },
  );

  private resolveTitle(): string {
    let route: ActivatedRouteSnapshot | null = this.router.routerState.snapshot.root;
    let title = '';
    while (route) {
      if (route.title) title = route.title;
      route = route.firstChild;
    }
    return title;
  }
}
