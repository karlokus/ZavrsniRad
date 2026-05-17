export interface DashboardSummary {
  totalSongs: number;
  learnedCount: number;
  activeStreak: number;
  upcomingPractices: number;
}

export interface NeedsPracticeItem {
  id: string;
  title: string;
  avgMastery: number;
  notesMastery?: number;
  lyricsMastery?: number;
  playingMastery?: number;
}
