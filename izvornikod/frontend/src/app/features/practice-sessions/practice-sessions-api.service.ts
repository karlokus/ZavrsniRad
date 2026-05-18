import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CreatePracticeSessionDto,
  PaginatedSessions,
  PracticeSession,
  QueryPracticeSessionsParams,
  SessionStats,
  TrendPoint,
} from './practice-session.types';

@Injectable({ providedIn: 'root' })
export class PracticeSessionsApiService {
  private readonly http = inject(HttpClient);

  create(dto: CreatePracticeSessionDto): Observable<PracticeSession> {
    return this.http.post<PracticeSession>('/practice-sessions', dto);
  }

  list(params: QueryPracticeSessionsParams = {}): Observable<PaginatedSessions> {
    let p = new HttpParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') p = p.set(k, String(v));
    });
    return this.http.get<PaginatedSessions>('/practice-sessions', { params: p });
  }

  getById(id: string): Observable<PracticeSession> {
    return this.http.get<PracticeSession>(`/practice-sessions/${id}`);
  }

  getStatsForComposition(compositionId: string): Observable<SessionStats> {
    return this.http.get<SessionStats>(`/practice-sessions/composition/${compositionId}/stats`);
  }

  getTrends(dateFrom?: string, dateTo?: string): Observable<TrendPoint[]> {
    let p = new HttpParams();
    if (dateFrom) p = p.set('dateFrom', dateFrom);
    if (dateTo) p = p.set('dateTo', dateTo);
    return this.http.get<TrendPoint[]>('/practice-sessions/trends', { params: p });
  }
}
