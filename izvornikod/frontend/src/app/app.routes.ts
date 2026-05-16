import { Routes } from '@angular/router';

import { authGuard, publicOnlyGuard } from './core/auth/auth.guard';
import { practiceMidiResolver } from './features/practice-player/practice-midi.resolver';

/**
 * Top-level rute — sve lazy preko `loadComponent`.
 * Dva shell layouta: AuthShell (javne /auth rute) i AppShell (zaštićene).
 * `withComponentInputBinding()` (vidi app.config.ts) veže rutne parametre
 * na `input()` signale komponenti — zato param rute deklariraju matching input.
 * `title` čita Topbar (§4) za serif naslov; Angular ga zrcali i u document.title.
 *
 * Napomena o redoslijedu: `repertoire/new` mora biti PRIJE `repertoire/:id`
 * (oba 2-segmentna) inače bi "new" bilo uhvaćeno kao `:id`.
 */
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },

  {
    path: 'auth',
    canActivate: [publicOnlyGuard],
    loadComponent: () => import('./layouts/auth-shell/auth-shell').then((m) => m.AuthShell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'sign-in' },
      {
        path: 'sign-in',
        title: 'Prijava',
        loadComponent: () => import('./features/auth/sign-in.page').then((m) => m.SignInPage),
      },
      {
        path: 'sign-up',
        title: 'Registracija',
        loadComponent: () => import('./features/auth/sign-up.page').then((m) => m.SignUpPage),
      },
    ],
  },

  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layouts/app-shell/app-shell').then((m) => m.AppShell),
    children: [
      {
        path: 'dashboard',
        title: 'Nadzorna ploča',
        loadComponent: () =>
          import('./features/dashboard/dashboard.page').then((m) => m.DashboardPage),
      },
      {
        path: 'repertoire',
        title: 'Repertoar',
        loadComponent: () =>
          import('./features/repertoire/repertoire-list.page').then((m) => m.RepertoireListPage),
      },
      {
        path: 'repertoire/new',
        title: 'Nova pjesma',
        loadComponent: () =>
          import('./features/repertoire/new-composition.page').then((m) => m.NewCompositionPage),
      },
      {
        path: 'repertoire/:id',
        title: 'Detalj pjesme',
        loadComponent: () =>
          import('./features/repertoire/composition-detail.page').then(
            (m) => m.CompositionDetailPage,
          ),
      },
      {
        path: 'repertoire/:id/edit',
        title: 'Uredi pjesmu',
        loadComponent: () =>
          import('./features/repertoire/edit-composition.page').then((m) => m.EditCompositionPage),
      },
      {
        path: 'categories',
        title: 'Kategorije',
        loadComponent: () =>
          import('./features/categories/categories.page').then((m) => m.CategoriesPage),
      },
      {
        path: 'setlists',
        title: 'Setliste',
        loadComponent: () =>
          import('./features/setlists/setlists.page').then((m) => m.SetlistsPage),
      },
      {
        path: 'setlists/:id',
        title: 'Setlista',
        loadComponent: () =>
          import('./features/setlists/setlist-detail.page').then((m) => m.SetlistDetailPage),
      },
      {
        path: 'plan',
        title: 'Plan vježbanja',
        loadComponent: () =>
          import('./features/practice-plans/plan-calendar.page').then((m) => m.PlanCalendarPage),
      },
      {
        path: 'plan/templates',
        title: 'Rutine',
        loadComponent: () =>
          import('./features/practice-plans/plan-templates.page').then((m) => m.PlanTemplatesPage),
      },
      {
        path: 'practice/session/:id/report',
        title: 'Izvještaj sesije',
        loadComponent: () =>
          import('./features/practice-sessions/session-report.page').then(
            (m) => m.SessionReportPage,
          ),
      },
      {
        path: 'practice/:compositionId',
        title: 'Vježbanje',
        resolve: { midi: practiceMidiResolver },
        loadComponent: () =>
          import('./features/practice-player/practice-player.page').then(
            (m) => m.PracticePlayerPage,
          ),
      },
      {
        path: 'exercises',
        title: 'Vježbe',
        loadComponent: () =>
          import('./features/exercises/exercises.page').then((m) => m.ExercisesPage),
      },
      {
        path: 'profile',
        title: 'Profil',
        loadComponent: () => import('./features/profile/profile.page').then((m) => m.ProfilePage),
      },
    ],
  },

  {
    path: '**',
    title: 'Nije pronađeno',
    loadComponent: () => import('./features/not-found/not-found.page').then((m) => m.NotFoundPage),
  },
];
