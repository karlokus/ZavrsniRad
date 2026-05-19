import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CreatePracticePlanDto,
  PracticePlan,
  PracticePlanSong,
  QueryPracticePlansParams,
  ReorderPlanSongItem,
  StreakData,
  UpdatePracticePlanDto,
} from './practice-plan.types';

@Injectable({ providedIn: 'root' })
export class PracticePlansApiService {
  private readonly http = inject(HttpClient);

  create(dto: CreatePracticePlanDto): Observable<PracticePlan> {
    return this.http.post<PracticePlan>('/practice-plans', dto);
  }

  list(params: QueryPracticePlansParams = {}): Observable<PracticePlan[]> {
    let p = new HttpParams();
    if (params.dateFrom) p = p.set('dateFrom', params.dateFrom);
    if (params.dateTo) p = p.set('dateTo', params.dateTo);
    // isCompleted MUST go over the wire as the literal string 'true'|'false'
    // (see QueryPracticePlansParams doc — enableImplicitConversion gotcha).
    if (params.isCompleted !== undefined) p = p.set('isCompleted', params.isCompleted);
    return this.http.get<PracticePlan[]>('/practice-plans', { params: p });
  }

  /**
   * Ergonomic wrapper for the calendar (§6.6 lazy materialization): callers
   * pass a real boolean; the string conversion for `isCompleted` is done
   * here, in one place, so the gotcha never leaks to callers.
   */
  listInRange(
    dateFrom: string,
    dateTo: string,
    completed?: boolean,
  ): Observable<PracticePlan[]> {
    return this.list({
      dateFrom,
      dateTo,
      isCompleted: completed === undefined ? undefined : completed ? 'true' : 'false',
    });
  }

  getById(id: string): Observable<PracticePlan> {
    return this.http.get<PracticePlan>(`/practice-plans/${id}`);
  }

  update(id: string, dto: UpdatePracticePlanDto): Observable<PracticePlan> {
    return this.http.patch<PracticePlan>(`/practice-plans/${id}`, dto);
  }

  remove(id: string): Observable<unknown> {
    return this.http.delete(`/practice-plans/${id}`);
  }

  markCompleted(id: string): Observable<PracticePlan> {
    return this.http.patch<PracticePlan>(`/practice-plans/${id}/complete`, {});
  }

  findTemplates(): Observable<PracticePlan[]> {
    return this.http.get<PracticePlan[]>('/practice-plans/templates');
  }

  getStreak(): Observable<StreakData> {
    return this.http.get<StreakData>('/practice-plans/streak');
  }

  /**
   * POST /:id/songs. Backend returns the created junction row (single
   * PracticePlanSong), not the whole plan. `position` is optional — when
   * given, the backend shifts existing songs down to insert at that slot;
   * when omitted it appends to the end.
   */
  addSong(
    planId: string,
    compositionId: string,
    position?: number,
  ): Observable<PracticePlanSong> {
    const body = position === undefined ? { compositionId } : { compositionId, position };
    return this.http.post<PracticePlanSong>(`/practice-plans/${planId}/songs`, body);
  }

  removeSong(planId: string, compositionId: string): Observable<{ removed: boolean }> {
    return this.http.delete<{ removed: boolean }>(
      `/practice-plans/${planId}/songs/${compositionId}`,
    );
  }

  /** PUT /:id/songs/reorder. Returns the full reordered song list. */
  reorderSongs(
    planId: string,
    items: ReorderPlanSongItem[],
  ): Observable<PracticePlanSong[]> {
    return this.http.put<PracticePlanSong[]>(
      `/practice-plans/${planId}/songs/reorder`,
      { items },
    );
  }
}
