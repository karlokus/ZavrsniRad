import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStateService } from './auth-state.service';

export const authGuard: CanActivateFn = () => {
  const state = inject(AuthStateService);
  const router = inject(Router);
  return state.isAuthenticated() ? true : router.parseUrl('/auth/sign-in');
};

export const publicOnlyGuard: CanActivateFn = () => {
  const state = inject(AuthStateService);
  const router = inject(Router);
  return state.isAuthenticated() ? router.parseUrl('/dashboard') : true;
};
