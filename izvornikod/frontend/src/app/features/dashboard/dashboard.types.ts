export interface DashboardSummary {
  totalSongs: number;
  learnedCount: number;
  /** Backend ga i dalje vraća; tile je zamijenjen StreakWidgetom (§6.6) pa se ne renderira. */
  activeStreak: number;
  upcomingPractices: number;
}

/**
 * GET /dashboard/needs-practice (dashboard-stats.provider.ts) vraća
 * `{ compositionId, title, avgMastery, lastPracticedAt }` — NIJE `id`.
 */
export interface NeedsPracticeItem {
  compositionId: string;
  title: string;
  avgMastery: number;
  lastPracticedAt?: string | null;
}
