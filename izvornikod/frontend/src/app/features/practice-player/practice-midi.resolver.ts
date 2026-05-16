import { ResolveFn } from '@angular/router';

/**
 * Resolver za rutu `practice/:compositionId`.
 *
 * TODO(§6 — Faza 2, MIDI Player): preko CompositionFilesApi dohvatiti datoteke
 * kompozicije; ako nema MIDI datoteke, preusmjeriti na `/repertoire/:compositionId`
 * (RedirectCommand) jer player nema što reproducirati. Po potrebi vratiti
 * parsirani `ParsedMidiData` da player ne radi dvostruki dohvat.
 *
 * Zasad passthrough (vraća true) da oblik rute bude finalan već u 3. koraku.
 */
export const practiceMidiResolver: ResolveFn<boolean> = () => true;
