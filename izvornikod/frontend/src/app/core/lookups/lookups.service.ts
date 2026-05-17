import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, forkJoin, tap } from 'rxjs';
import { Artist, Instrument, KeySignature } from './lookup.types';

@Injectable({ providedIn: 'root' })
export class LookupsService {
  private readonly http = inject(HttpClient);

  readonly instruments = signal<Instrument[]>([]);
  readonly artists = signal<Artist[]>([]);
  readonly keySignatures = signal<KeySignature[]>([]);

  loadAll(): Observable<unknown> {
    return forkJoin([
      this.http.get<Instrument[]>('/instruments').pipe(tap((d) => this.instruments.set(d))),
      this.http.get<Artist[]>('/artists').pipe(tap((d) => this.artists.set(d))),
      this.http.get<KeySignature[]>('/key-signatures').pipe(tap((d) => this.keySignatures.set(d))),
    ]);
  }
}
