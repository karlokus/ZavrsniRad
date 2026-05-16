import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

/**
 * App shell — okvir za prijavljene rute (sidebar 248px + topbar + main).
 *
 * TODO(§4/§5 — UI primitivi & Faza 1): zamijeniti privremenu navigaciju
 * pravim `Sidebar` (brand, sekcije Pregled/Repertoar/Učenje, user-chip)
 * i `Topbar` (serif naslov + breadcrumb + akcije). Privremeni nav postoji
 * isključivo da je 3. korak (Routing) ručno provjerljiv.
 */
@Component({
  selector: 'app-app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.css',
})
export class AppShell {
  /** Privremena navigacija — uklanja se u §4/§5. */
  protected readonly navLinks = [
    { path: '/dashboard', label: 'Nadzorna ploča' },
    { path: '/repertoire', label: 'Repertoar' },
    { path: '/categories', label: 'Kategorije' },
    { path: '/setlists', label: 'Setliste' },
    { path: '/plan', label: 'Plan' },
    { path: '/plan/templates', label: 'Rutine' },
    { path: '/exercises', label: 'Vježbe' },
    { path: '/profile', label: 'Profil' },
  ];
}
