import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { ENV } from '../config/environment.token';

export const baseUrlInterceptor: HttpInterceptorFn = (req, next) => {
  if (/^https?:\/\//i.test(req.url)) {
    return next(req);
  }
  const env = inject(ENV);
  const base = env.apiBaseUrl.replace(/\/$/, '');
  const path = req.url.startsWith('/') ? req.url : `/${req.url}`;
  return next(req.clone({ url: `${base}${path}` }));
};
