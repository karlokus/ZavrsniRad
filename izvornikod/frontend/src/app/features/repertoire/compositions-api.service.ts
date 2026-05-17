import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Composition,
  CreateCompositionDto,
  PaginatedCompositions,
  QueryCompositionsParams,
  UpdateCompositionDto,
} from './composition.types';

@Injectable({ providedIn: 'root' })
export class CompositionsApiService {
  private readonly http = inject(HttpClient);

  list(params: QueryCompositionsParams = {}): Observable<PaginatedCompositions> {
    let p = new HttpParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        p = p.set(k, String(v));
      }
    });
    return this.http.get<PaginatedCompositions>('/compositions', { params: p });
  }

  get(id: string): Observable<Composition> {
    return this.http.get<Composition>(`/compositions/${id}`);
  }

  create(dto: CreateCompositionDto): Observable<Composition> {
    return this.http.post<Composition>('/compositions', dto);
  }

  update(id: string, dto: UpdateCompositionDto): Observable<Composition> {
    return this.http.patch<Composition>(`/compositions/${id}`, dto);
  }

  remove(id: string): Observable<unknown> {
    return this.http.delete(`/compositions/${id}`);
  }

  setCategories(id: string, categoryIds: string[]): Observable<Composition> {
    return this.http.put<Composition>(`/compositions/${id}/categories`, { categoryIds });
  }
}
