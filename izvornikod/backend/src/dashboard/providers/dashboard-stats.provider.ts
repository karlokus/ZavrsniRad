import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Composition } from '../../compositions/entities/composition.entity';
import { CompositionType } from '../../compositions/enums/composition-type.enum';
import { Category } from '../../categories/entities/category.entity';
import { MasteryLog } from '../../mastery-logs/entities/mastery-log.entity';
import { PracticeSession } from '../../practice-sessions/entities/practice-session.entity';
import { PracticePlan } from '../../practice-plans/entities/practice-plan.entity';
import { StreakCalculatorProvider } from '../../practice-plans/providers/streak-calculator.provider';
import {
  DashboardPeriod,
  DashboardQueryDto,
} from '../dtos/dashboard-query.dto';

const AVG_MASTERY_SQL =
  '(COALESCE(c."notesMastery",1) + COALESCE(c."lyricsMastery",1) + COALESCE(c."playingMastery",1)) / 3.0';

/**
 * Read-only agregacijski provider za dashboard endpointe (FZ-D01–FZ-D06).
 * Sve metode vraćaju SQL-aggregirane vrijednosti — minimum prijenosa.
 *
 * "Naučena pjesma" definicija (FZ-D01): mastery prosjek >= 4.0.
 */
@Injectable()
export class DashboardStatsProvider {
  /** Mastery threshold iznad kojeg se pjesma smatra "naučenom" */
  private static readonly LEARNED_THRESHOLD = 4.0;

  constructor(
    @InjectRepository(Composition)
    private readonly compositionsRepo: Repository<Composition>,
    @InjectRepository(Category)
    private readonly categoriesRepo: Repository<Category>,
    @InjectRepository(MasteryLog)
    private readonly masteryLogsRepo: Repository<MasteryLog>,
    @InjectRepository(PracticeSession)
    private readonly sessionsRepo: Repository<PracticeSession>,
    @InjectRepository(PracticePlan)
    private readonly plansRepo: Repository<PracticePlan>,
    private readonly streakProvider: StreakCalculatorProvider,
  ) {}

  /**
   * FZ-D01: { totalSongs, learnedCount, activeStreak, upcomingPractices }
   */
  public async getSummary(userId: string): Promise<{
    totalSongs: number;
    learnedCount: number;
    activeStreak: number;
    upcomingPractices: number;
  }> {
    const today = this.toDateString(new Date());

    const [totalSongs, learnedCount, streakRes, upcomingPractices] =
      await Promise.all([
        this.compositionsRepo
          .createQueryBuilder('c')
          .where('c."userId" = :userId', { userId })
          .andWhere('c.type = :t', { t: CompositionType.SONG })
          .getCount(),

        this.compositionsRepo
          .createQueryBuilder('c')
          .where('c."userId" = :userId', { userId })
          .andWhere('c.type = :t', { t: CompositionType.SONG })
          .andWhere(`${AVG_MASTERY_SQL} >= :th`, {
            th: DashboardStatsProvider.LEARNED_THRESHOLD,
          })
          .getCount(),

        this.streakProvider.getCurrentStreak(userId),

        this.plansRepo
          .createQueryBuilder('p')
          .where('p."userId" = :userId', { userId })
          .andWhere('p."isRecurring" = false')
          .andWhere('p."isCompleted" = false')
          .andWhere(`p."scheduledDate" >= :today`, { today })
          .getCount(),
      ]);

    return {
      totalSongs,
      learnedCount,
      activeStreak: streakRes.currentStreak,
      upcomingPractices,
    };
  }

  /**
   * FZ-D02: line chart napretka kroz vrijeme — prosjek newValue iz MasteryLog
   * po danu. Filtrirano period parametrom.
   */
  public async getProgress(
    userId: string,
    query: DashboardQueryDto,
  ): Promise<{ date: string; avgMastery: number; logCount: number }[]> {
    const period = query.period ?? DashboardPeriod.THIRTY_DAYS;
    const dateFrom = this.periodToFromDate(period);

    const qb = this.masteryLogsRepo
      .createQueryBuilder('l')
      .innerJoin('l.composition', 'c')
      .select(`TO_CHAR(l."changedAt", 'YYYY-MM-DD')`, 'date')
      .addSelect('AVG(l."newValue")', 'avgMastery')
      .addSelect('COUNT(l.id)', 'cnt')
      .where('c."userId" = :userId', { userId })
      .andWhere('c.type = :t', { t: CompositionType.SONG });

    if (dateFrom) {
      qb.andWhere('l."changedAt" >= :df', { df: dateFrom });
    }

    qb.groupBy(`TO_CHAR(l."changedAt", 'YYYY-MM-DD')`).orderBy('date', 'ASC');
    const rows = await qb.getRawMany();
    return rows.map((r) => ({
      date: r.date,
      avgMastery: round2(parseFloat(r.avgMastery)),
      logCount: parseInt(r.cnt, 10),
    }));
  }

  /**
   * FZ-D03: pie chart — count po kategoriji.
   * Uključuje i pseudo-kategoriju "Bez kategorije" za pjesme bez asocijacije.
   */
  public async getCategoriesDistribution(
    userId: string,
  ): Promise<
    { categoryId: string | null; categoryName: string; count: number }[]
  > {
    const withCategory = await this.categoriesRepo
      .createQueryBuilder('cat')
      .leftJoin('cat.compositions', 'c')
      .select('cat.id', 'categoryId')
      .addSelect('cat.name', 'categoryName')
      .addSelect('COUNT(c.id)', 'cnt')
      .where('cat."userId" = :userId', { userId })
      .groupBy('cat.id')
      .addGroupBy('cat.name')
      .orderBy('cat.name', 'ASC')
      .getRawMany();

    const uncategorized = await this.compositionsRepo
      .createQueryBuilder('c')
      .leftJoin('c.categories', 'cat')
      .where('c."userId" = :userId', { userId })
      .andWhere('c.type = :t', { t: CompositionType.SONG })
      .andWhere('cat.id IS NULL')
      .getCount();

    const result = withCategory.map((r) => ({
      categoryId: r.categoryId,
      categoryName: r.categoryName,
      count: parseInt(r.cnt, 10),
    }));
    if (uncategorized > 0) {
      result.push({
        categoryId: null,
        categoryName: 'Bez kategorije',
        count: uncategorized,
      });
    }
    return result;
  }

  /**
   * FZ-D04: top 5 pjesama s najnižim mastery prosjekom.
   */
  public async getNeedsPractice(
    userId: string,
    limit = 5,
  ): Promise<
    {
      compositionId: string;
      title: string;
      avgMastery: number;
      lastPracticedAt: Date | null;
    }[]
  > {
    const rows = await this.compositionsRepo
      .createQueryBuilder('c')
      .leftJoin(
        PracticeSession,
        's',
        's."compositionId" = c.id AND s."userId" = c."userId"',
      )
      .select('c.id', 'id')
      .addSelect('c.title', 'title')
      .addSelect(AVG_MASTERY_SQL, 'avgMastery')
      .addSelect('MAX(s."startedAt")', 'lastAt')
      .where('c."userId" = :userId', { userId })
      .andWhere('c.type = :t', { t: CompositionType.SONG })
      .groupBy('c.id')
      .addGroupBy('c.title')
      .addGroupBy('c."notesMastery"')
      .addGroupBy('c."lyricsMastery"')
      .addGroupBy('c."playingMastery"')
      .orderBy('"avgMastery"', 'ASC')
      .addOrderBy('c.title', 'ASC')
      .limit(limit)
      .getRawMany();

    return rows.map((r) => ({
      compositionId: r.id,
      title: r.title,
      avgMastery: round2(parseFloat(r.avgMastery)),
      lastPracticedAt: r.lastAt ? new Date(r.lastAt) : null,
    }));
  }

  /**
   * FZ-D05: kalendarska heatmapa — aktivnost po danu (PracticeSession + PracticePlan complete).
   */
  public async getHeatmap(
    userId: string,
    query: DashboardQueryDto,
  ): Promise<{ date: string; count: number }[]> {
    const period = query.period ?? DashboardPeriod.NINETY_DAYS;
    const dateFrom = this.periodToFromDate(period);

    // sesije po danu
    const sessionQb = this.sessionsRepo
      .createQueryBuilder('s')
      .select(`TO_CHAR(s."startedAt", 'YYYY-MM-DD')`, 'date')
      .addSelect('COUNT(s.id)', 'cnt')
      .where('s."userId" = :userId', { userId });
    if (dateFrom) {
      sessionQb.andWhere('s."startedAt" >= :df', { df: dateFrom });
    }
    sessionQb.groupBy(`TO_CHAR(s."startedAt", 'YYYY-MM-DD')`);

    // completed plans po danu
    const plansQb = this.plansRepo
      .createQueryBuilder('p')
      .select(`TO_CHAR(p."scheduledDate", 'YYYY-MM-DD')`, 'date')
      .addSelect('COUNT(p.id)', 'cnt')
      .where('p."userId" = :userId', { userId })
      .andWhere('p."isCompleted" = true')
      .andWhere('p."isRecurring" = false');
    if (dateFrom) {
      plansQb.andWhere(
        `p."scheduledDate" >= :dfStr`,
        { dfStr: this.toDateString(dateFrom) },
      );
    }
    plansQb.groupBy(`TO_CHAR(p."scheduledDate", 'YYYY-MM-DD')`);

    const [sessRows, planRows] = await Promise.all([
      sessionQb.getRawMany(),
      plansQb.getRawMany(),
    ]);

    const map = new Map<string, number>();
    for (const r of sessRows) map.set(r.date, parseInt(r.cnt, 10));
    for (const r of planRows) {
      map.set(r.date, (map.get(r.date) ?? 0) + parseInt(r.cnt, 10));
    }

    return Array.from(map.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * FZ-D06: prosječne metrike performansi i trend strelice.
   * Trend: usporedi posljednju polovicu razdoblja s prvom polovicom.
   */
  public async getPerformance(
    userId: string,
    query: DashboardQueryDto,
  ): Promise<{
    avgNoteAccuracy: number | null;
    avgRhythmAccuracy: number | null;
    avgTempoStability: number | null;
    sessionCount: number;
    trends: {
      noteAccuracy: 'up' | 'down' | 'flat' | null;
      rhythmAccuracy: 'up' | 'down' | 'flat' | null;
      tempoStability: 'up' | 'down' | 'flat' | null;
    };
  }> {
    const period = query.period ?? DashboardPeriod.THIRTY_DAYS;
    const dateFrom = this.periodToFromDate(period);
    const now = new Date();

    const baseWhere = (qb: ReturnType<typeof this.sessionsRepo.createQueryBuilder>) => {
      qb.where('s."userId" = :userId', { userId });
      if (dateFrom) qb.andWhere('s."startedAt" >= :df', { df: dateFrom });
      return qb;
    };

    const overall = await baseWhere(this.sessionsRepo.createQueryBuilder('s'))
      .select('AVG(s."noteAccuracy")', 'note')
      .addSelect('AVG(s."rhythmAccuracy")', 'rhythm')
      .addSelect('AVG(s."tempoStability")', 'tempo')
      .addSelect('COUNT(s.id)', 'cnt')
      .getRawOne();

    const cnt = parseInt(overall.cnt, 10) || 0;
    if (cnt === 0) {
      return {
        avgNoteAccuracy: null,
        avgRhythmAccuracy: null,
        avgTempoStability: null,
        sessionCount: 0,
        trends: {
          noteAccuracy: null,
          rhythmAccuracy: null,
          tempoStability: null,
        },
      };
    }

    // Trend: split razdoblja na pola (sredina = (dateFrom + now) / 2)
    let mid: Date | null = null;
    if (dateFrom) {
      mid = new Date((dateFrom.getTime() + now.getTime()) / 2);
    }

    const trends: {
      noteAccuracy: 'up' | 'down' | 'flat' | null;
      rhythmAccuracy: 'up' | 'down' | 'flat' | null;
      tempoStability: 'up' | 'down' | 'flat' | null;
    } = {
      noteAccuracy: null,
      rhythmAccuracy: null,
      tempoStability: null,
    };

    if (mid && dateFrom) {
      const firstHalf = await this.sessionsRepo
        .createQueryBuilder('s')
        .select('AVG(s."noteAccuracy")', 'note')
        .addSelect('AVG(s."rhythmAccuracy")', 'rhythm')
        .addSelect('AVG(s."tempoStability")', 'tempo')
        .where('s."userId" = :userId', { userId })
        .andWhere('s."startedAt" >= :df AND s."startedAt" < :mid', {
          df: dateFrom,
          mid,
        })
        .getRawOne();

      const secondHalf = await this.sessionsRepo
        .createQueryBuilder('s')
        .select('AVG(s."noteAccuracy")', 'note')
        .addSelect('AVG(s."rhythmAccuracy")', 'rhythm')
        .addSelect('AVG(s."tempoStability")', 'tempo')
        .where('s."userId" = :userId', { userId })
        .andWhere('s."startedAt" >= :mid', { mid })
        .getRawOne();

      const arrow = (
        first: string | null,
        second: string | null,
      ): 'up' | 'down' | 'flat' | null => {
        if (!first || !second) return null;
        const a = parseFloat(first);
        const b = parseFloat(second);
        if (Math.abs(b - a) < 1) return 'flat';
        return b > a ? 'up' : 'down';
      };

      trends.noteAccuracy = arrow(firstHalf.note, secondHalf.note);
      trends.rhythmAccuracy = arrow(firstHalf.rhythm, secondHalf.rhythm);
      trends.tempoStability = arrow(firstHalf.tempo, secondHalf.tempo);
    }

    return {
      avgNoteAccuracy: round2(parseFloat(overall.note)),
      avgRhythmAccuracy: round2(parseFloat(overall.rhythm)),
      avgTempoStability: round2(parseFloat(overall.tempo)),
      sessionCount: cnt,
      trends,
    };
  }

  // helpers
  private periodToFromDate(period: DashboardPeriod): Date | null {
    if (period === DashboardPeriod.ALL) return null;
    const days =
      period === DashboardPeriod.SEVEN_DAYS
        ? 7
        : period === DashboardPeriod.THIRTY_DAYS
          ? 30
          : period === DashboardPeriod.NINETY_DAYS
            ? 90
            : 365;
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - days);
    return d;
  }

  private toDateString(d: Date): string {
    return d.toISOString().slice(0, 10);
  }
}

function round2(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.round(n * 100) / 100;
}
