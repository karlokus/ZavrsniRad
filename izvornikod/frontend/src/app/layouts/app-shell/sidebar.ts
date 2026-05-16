import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStateService } from '../../core/auth/auth-state.service';
import { AuthService } from '../../core/auth/auth.service';
import { Icon } from '../../shared/ui/icon/icon';

interface NavItem {
  path: string;
  name: string;
  icon: string;
  exact?: boolean;
}

/**
 * Sidebar (248px). Stil iz dizajn `.sidebar*` / `.nav-item*` / `.user-chip`.
 * Nav je mapiran na STVARNE rute iz §3 (ne na demo iz dizajna).
 */
@Component({
  selector: 'app-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, Icon],
  template: `
    <aside class="sidebar">
      <div class="sidebar__brand">
        <div class="sidebar__brand-mark">M</div>
        <div class="sidebar__brand-name">Metronoma</div>
      </div>

      @for (section of nav; track section.label) {
        <div class="sidebar__section">
          <div class="sidebar__label">{{ section.label }}</div>
          @for (item of section.items; track item.path) {
            <a
              class="nav-item"
              [routerLink]="item.path"
              routerLinkActive="is-active"
              [routerLinkActiveOptions]="{ exact: !!item.exact }"
            >
              <app-icon class="nav-item__icon" [name]="item.icon" [size]="15" />
              <span>{{ item.name }}</span>
            </a>
          }
        </div>
      }

      <div class="sidebar__footer">
        <a class="user-chip" routerLink="/profile">
          <div class="avatar">{{ initials() }}</div>
          <div class="user-chip__meta">
            <div class="user-chip__name">{{ displayName() }}</div>
            <div class="muted user-chip__email">{{ email() }}</div>
          </div>
          <app-icon name="settings" [size]="14" />
        </a>
        <button type="button" class="nav-item nav-item--btn" (click)="signOut()">
          <app-icon class="nav-item__icon" name="log_out" [size]="15" />
          <span>Odjava</span>
        </button>
      </div>
    </aside>
  `,
  styles: [
    `
    .sidebar {
      background: var(--surface-2);
      border-right: 1px solid var(--border);
      display: flex; flex-direction: column;
      padding: 22px 14px 18px;
      overflow-y: auto;
    }
    .sidebar__brand { display: flex; align-items: center; gap: 10px; padding: 4px 8px 22px; }
    .sidebar__brand-mark {
      width: 30px; height: 30px;
      display: grid; place-items: center;
      background: var(--ink); color: var(--bg);
      border-radius: 8px;
      font-family: var(--font-serif); font-size: 19px; line-height: 1;
    }
    .sidebar__brand-name { font-family: var(--font-serif); font-size: 21px; letter-spacing: -0.01em; }
    .sidebar__section { margin-top: 12px; display: flex; flex-direction: column; gap: 1px; }
    .sidebar__label {
      font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em;
      color: var(--muted); padding: 8px 10px 4px;
    }
    .nav-item {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 10px;
      border-radius: var(--radius-sm);
      color: var(--ink-2);
      font-size: 13.5px;
      cursor: pointer; user-select: none;
      border: 1px solid transparent;
      background: transparent;
      width: 100%; text-align: left;
    }
    .nav-item:hover { background: rgba(26, 24, 21, 0.04); }
    .nav-item.is-active {
      background: var(--surface); color: var(--ink);
      border-color: var(--border); box-shadow: var(--shadow-sm);
    }
    .nav-item__icon { color: var(--muted); flex: 0 0 16px; }
    .nav-item.is-active .nav-item__icon { color: var(--accent-ink); }
    .sidebar__footer { margin-top: auto; padding-top: 12px; border-top: 1px solid var(--border); }
    .user-chip {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 10px; border-radius: var(--radius-sm); cursor: pointer;
    }
    .user-chip:hover { background: rgba(26, 24, 21, 0.04); }
    .user-chip__meta { flex: 1; min-width: 0; }
    .user-chip__name { font-size: 13px; }
    .user-chip__email { font-size: 11px; }
    .avatar {
      width: 28px; height: 28px;
      background: var(--accent-soft); color: var(--accent-ink);
      border-radius: 999px;
      display: grid; place-items: center;
      font-weight: 500; font-size: 12px; flex-shrink: 0;
    }
    .nav-item--btn { margin-top: 4px; }
    `,
  ],
})
export class Sidebar {
  private readonly authState = inject(AuthStateService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly nav: { label: string; items: NavItem[] }[] = [
    { label: 'Pregled', items: [{ path: '/dashboard', name: 'Početna', icon: 'home' }] },
    {
      label: 'Repertoar',
      items: [
        { path: '/repertoire', name: 'Pjesme', icon: 'music' },
        { path: '/categories', name: 'Kategorije', icon: 'folder' },
        { path: '/setlists', name: 'Setliste', icon: 'list' },
      ],
    },
    {
      label: 'Učenje',
      items: [
        { path: '/exercises', name: 'Vježbe', icon: 'sparkles' },
        { path: '/plan', name: 'Plan vježbanja', icon: 'calendar', exact: true },
        { path: '/plan/templates', name: 'Rutine', icon: 'book' },
      ],
    },
  ];

  private readonly user = this.authState.currentUser;

  protected readonly displayName = computed(() => {
    const u = this.user();
    return u ? `${u.firstName} ${u.lastName}` : 'Korisnik';
  });
  protected readonly email = computed(() => this.user()?.email ?? '');
  protected readonly initials = computed(() => {
    const u = this.user();
    if (!u) return '?';
    return `${u.firstName[0] ?? ''}${u.lastName[0] ?? ''}`.toUpperCase() || '?';
  });

  signOut(): void {
    this.auth.signOut();
    void this.router.navigateByUrl('/auth/sign-in');
  }
}
