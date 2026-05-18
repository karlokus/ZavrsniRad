import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { AuthStateService } from './auth-state.service';
import { AuthService } from './auth.service';

/**
 * Refresh outcome broadcast to requests that arrived mid-refresh.
 * `failed` is the critical state: without it, queued requests would
 * subscribe forever waiting for a token that never comes.
 */
type RefreshState =
  | { status: 'pending' }
  | { status: 'success'; token: string }
  | { status: 'failed' };

let isRefreshing = false;
const refresh$ = new BehaviorSubject<RefreshState>({ status: 'pending' });

function shouldSkipAuth(url: string): boolean {
  return (
    url.includes('/auth/sign-in') ||
    url.includes('/auth/sign-up') ||
    url.includes('/auth/refresh-tokens')
  );
}

function withBearer<T>(req: HttpRequest<T>, token: string): HttpRequest<T> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const state = inject(AuthStateService);
  const auth = inject(AuthService);
  const router = inject(Router);

  const skip = shouldSkipAuth(req.url);
  const token = state.accessToken();
  const authedReq = token && !skip ? withBearer(req, token) : req;

  return next(authedReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status !== 401 || skip) {
        return throwError(() => err);
      }

      if (!isRefreshing) {
        isRefreshing = true;
        refresh$.next({ status: 'pending' });

        return auth.refresh().pipe(
          switchMap((pair) => {
            isRefreshing = false;
            refresh$.next({ status: 'success', token: pair.accessToken });
            return next(withBearer(req, pair.accessToken));
          }),
          catchError((refreshErr) => {
            isRefreshing = false;
            refresh$.next({ status: 'failed' });
            state.signOut();
            void router.navigate(['/auth/sign-in']);
            return throwError(() => refreshErr);
          }),
        );
      }

      return refresh$.pipe(
        filter((s) => s.status !== 'pending'),
        take(1),
        switchMap((s) =>
          s.status === 'success' ? next(withBearer(req, s.token)) : throwError(() => err),
        ),
      );
    }),
  );
};
