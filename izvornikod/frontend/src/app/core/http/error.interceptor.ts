import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { formatApiMessage } from '../errors/format-api-message';
import { ToastService } from '../notifications/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        return throwError(() => err);
      }

      if (err.status === 413) {
        toast.error('Datoteka je prevelika. Smanji veličinu i pokušaj ponovo.');
      } else if (err.status === 0) {
        toast.error('Nema veze s poslužiteljem. Provjeri internet i pokušaj ponovo.');
      } else if (err.status >= 500) {
        toast.error('Greška na poslužitelju. Pokušaj kasnije.');
      } else if (err.status >= 400) {
        const message = formatApiMessage(err.error?.message);
        toast.error(message);
      }

      return throwError(() => err);
    }),
  );
};
