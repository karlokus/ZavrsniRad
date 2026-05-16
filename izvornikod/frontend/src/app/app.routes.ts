import { Routes } from '@angular/router';

import { authGuard, publicOnlyGuard } from './core/auth/auth.guard';
import { practiceMidiResolver } from './features/practice-player/practice-midi.resolver';

/**
 * Top-level rute — sve lazy preko `loadComponent`.
 * Dva shell layouta: AuthShell (javne /auth rute) i AppShell (zaštićene).
 * `withComponentInputBinding()` (vidi app.config.ts) veže rutne parametre
 * na `input()` signale komponenti — zato param rute deklariraju matching input.
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
        loadComponent: () => import('./features/auth/sign-in.page').then((m) => m.SignInPage),
      },
      {
        path: 'sign-up',
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
        loadComponent: () =>
          import('./features/dashboard/dashboard.page').then((m) => m.DashboardPage),
      },
      {
        path: 'repertoire',
        loadComponent: () =>
          import('./features/repertoire/repertoire-list.page').then((m) => m.RepertoireListPage),
      },
      {
        path: 'repertoire/new',
        loadComponent: () =>
          import('./features/repertoire/new-composition.page').then((m) => m.NewCompositionPage),
      },
      {
        path: 'repertoire/:id',
        loadComponent: () =>
          import('./features/repertoire/composition-detail.page').then(
            (m) => m.CompositionDetailPage,
          ),
      },
      {
        path: 'repertoire/:id/edit',
        loadComponent: () =>
          import('./features/repertoire/edit-composition.page').then((m) => m.EditCompositionPage),
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./features/categories/categories.page').then((m) => m.CategoriesPage),
      },
      {
        path: 'setlists',
        loadComponent: () =>
          import('./features/setlists/setlists.page').then((m) => m.SetlistsPage),
      },
      {
        path: 'setlists/:id',
        loadComponent: () =>
          import('./features/setlists/setlist-detail.page').then((m) => m.SetlistDetailPage),
      },
      {
        path: 'plan',
        loadComponent: () =>
          import('./features/practice-plans/plan-calendar.page').then((m) => m.PlanCalendarPage),
      },
      {
        path: 'plan/templates',
        loadComponent: () =>
          import('./features/practice-plans/plan-templates.page').then((m) => m.PlanTemplatesPage),
      },
      {
        path: 'practice/session/:id/report',
        loadComponent: () =>
          import('./features/practice-sessions/session-report.page').then(
            (m) => m.SessionReportPage,
          ),
      },
      {
        path: 'practice/:compositionId',
        resolve: { midi: practiceMidiResolver },
        loadComponent: () =>
          import('./features/practice-player/practice-player.page').then(
            (m) => m.PracticePlayerPage,
          ),
      },
      {
        path: 'exercises',
        loadComponent: () =>
          import('./features/exercises/exercises.page').then((m) => m.ExercisesPage),
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile.page').then((m) => m.ProfilePage),
      },
    ],
  },

  {
    path: '**',
    loadComponent: () => import('./features/not-found/not-found.page').then((m) => m.NotFoundPage),
  },
];
