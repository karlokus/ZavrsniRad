export interface PracticeSession {
  id: string;
  composition: { id: string; title: string };
  noteAccuracy: number;
  rhythmAccuracy: number;
  tempoStability: number;
  tempoBpm: number;
  durationSeconds: number;
  startedAt: string;
  completedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedSessions {
  items: PracticeSession[];
  total: number;
  page: number;
  limit: number;
}

export interface CreatePracticeSessionDto {
  compositionId: string;
  noteAccuracy: number;
  rhythmAccuracy: number;
  tempoStability: number;
  tempoBpm: number;
  durationSeconds: number;
  startedAt: string;
  completedAt: string;
}

export interface QueryPracticeSessionsParams {
  compositionId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface SessionStats {
  compositionId: string;
  count: number;
  avgNoteAccuracy: number | null;
  avgRhythmAccuracy: number | null;
  avgTempoStability: number | null;
  avgTempoBpm: number | null;
  totalDurationSeconds: number;
  firstSessionAt: string | null;
  lastSessionAt: string | null;
}

export interface TrendPoint {
  date: string;
  avgNoteAccuracy: number;
  avgRhythmAccuracy: number;
  avgTempoStability: number;
  sessionCount: number;
}
