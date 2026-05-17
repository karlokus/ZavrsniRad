import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { DashboardSummary, NeedsPracticeItem } from './dashboard.types';

@Injectable({ providedIn: 'root' })
export class DashboardApiService {
  private readonly http = inject(HttpClient);

  summary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>('/dashboard/summary');
  }

  needsPractice(): Observable<NeedsPracticeItem[]> {
    return this.http.get<NeedsPracticeItem[]>('/dashboard/needs-practice');
  }
}
