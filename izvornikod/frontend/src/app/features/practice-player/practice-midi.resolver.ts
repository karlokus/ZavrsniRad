import { inject } from '@angular/core';
import { RedirectCommand, ResolveFn, Router } from '@angular/router';
import { EMPTY, catchError, map } from 'rxjs';
import { CompositionFilesApiService } from './composition-files-api.service';
import { CompositionFile } from './composition-file.types';

/**
 * Resolver za rutu `practice/:compositionId`.
 *
 * Dohvaća listu datoteka kompozicije i provjerava postoji li MIDI datoteka.
 * Ako nema MIDI: RedirectCommand → `/repertoire/:compositionId`.
 * Ako ima: vraća prvu MIDI datoteku (player je koristi za dohvat midi-data).
 */
export const practiceMidiResolver: ResolveFn<CompositionFile | RedirectCommand> = (route) => {
  const api = inject(CompositionFilesApiService);
  const router = inject(Router);
  const compositionId = route.paramMap.get('compositionId')!;

  return api.listForComposition(compositionId).pipe(
    map((files) => {
      const midiFile = files.find((f) => f.fileType === 'MIDI');
      if (!midiFile) {
        return new RedirectCommand(router.parseUrl(`/repertoire/${compositionId}`));
      }
      return midiFile;
    }),
    catchError(() => {
      router.navigateByUrl(`/repertoire/${compositionId}`);
      return EMPTY;
    }),
  );
};
