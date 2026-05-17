import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { catchError, of } from 'rxjs';

import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { AuthStateService } from './core/auth/auth-state.service';
import { AuthService } from './core/auth/auth.service';
import { LookupsService } from './core/lookups/lookups.service';
import { authInterceptor } from './core/auth/auth.interceptor';
import { ENV } from './core/config/environment.token';
import { baseUrlInterceptor } from './core/http/base-url.interceptor';
import { errorInterceptor } from './core/http/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
    provideHttpClient(withInterceptors([baseUrlInterceptor, authInterceptor, errorInterceptor])),
    provideAnimationsAsync(),
    { provide: ENV, useValue: environment },
    provideAppInitializer(() => {
      const state = inject(AuthStateService);
      const auth = inject(AuthService);
      if (!state.accessToken()) return;
      return auth.loadMe().pipe(catchError(() => of(null)));
    }),
    provideAppInitializer(() => {
      const lookups = inject(LookupsService);
      return lookups.loadAll().pipe(catchError(() => of(null)));
    }),
  ],
};
