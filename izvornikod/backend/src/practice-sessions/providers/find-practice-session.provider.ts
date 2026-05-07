import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  RequestTimeoutException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PracticeSession } from '../entities/practice-session.entity';
import { QueryPracticeSessionsDto } from '../dtos/query-practice-sessions.dto';
import { FindCompositionProvider } from '../../compositions/providers/find-composition.provider';

export interface PaginatedSessions {
  items: PracticeSession[];
  total: number;
  page: number;
  limit: number;
}

export interface SessionStats {
  compositionId: string;
  count: number;
  avgNoteAccuracy: number | null;
  avgRhythmAccuracy: number | null;
  avgTempoStability: number | null;
  avgTempoBpm: number | null;
  totalDurationSeconds: number;
  firstSessionAt: Date | null;
  lastSessionAt: Date | null;
}

export interface TrendPoint {
  date: string; // 'YYYY-MM-DD'
  avgNoteAccuracy: number;
  avgRhythmAccuracy: number;
  avgTempoStability: number;
  sessionCount: number;
}

@Injectable()
export class FindPracticeSessionProvider {
  constructor(
    @InjectRepository(PracticeSession)
    private readonly sessionsRepository: Repository<PracticeSession>,
    private readonly findCompositionProvider: FindCompositionProvider,
  ) {}

  public async findOneById(
    id: string,
    userId: string,
  ): Promise<PracticeSession | null> {
    const session = await this.sessionsRepository.findOne({
      where: { id },
      relations: ['user', 'composition'],
    });
    if (!session) return null;
    if (session.user.id !== userId) {
      throw new ForbiddenException('Nemate pristup ovoj sesiji');
    }
    return session;
  }

  /**
   * Paginirana lista korisnikovih sesija s filterima.
   * Sortirano startedAt DESC (najnovije prve).
   */
  public async findAll(
    userId: string,
    query: QueryPracticeSessionsDto,
  ): Promise<PaginatedSessions> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    try {
      const qb = this.sessionsRepository
        .createQueryBuilder('s')
        .leftJoinAndSelect('s.composition', 'composition')
        .where('s.userId = :userId', { userId });

      if (query.compositionId) {
        qb.andWhere('s.compositionId = :cid', { cid: query.compositionId });
      }
      if (query.dateFrom) {
        qb.andWhere('s.startedAt >= :df', { df: query.dateFrom });
      }
      if (query.dateTo) {
        qb.andWhere('s.startedAt <= :dt', { dt: query.dateTo });
      }

      qb.orderBy('s.startedAt', 'DESC').addOrderBy('s.id', 'ASC');

      const total = await qb.getCount();
      qb.offset((page - 1) * limit).limit(limit);
      const items = await qb.getMany();

      return { items, total, page, limit };
    } catch (error: unknown) {
      const errMessage = (error as Error).message;
      throw new RequestTimeoutException(
        'Unable to process your request at the moment, please try later',
        {
          description:
            'Error connecting to the database, error message: ' + errMessage,
        },
      );
    }
  }

  /**
   * Agregirane statistike za jednu kompoziciju.
   * Validira pristup pjesmi prije agregacije.
   */
  public async getStatsForComposition(
    compositionId: string,
    userId: string,
  ): Promise<SessionStats> {
    const composition = await this.findCompositionProvider.findOneById(
      compositionId,
      userId,
    );
    if (!composition) {
      throw new NotFoundException('Kompozicija nije pronađena');
    }

    const raw = await this.sessionsRepository
      .createQueryBuilder('s')
      .select('COUNT(s.id)', 'count')
      .addSelect('AVG(s.noteAccuracy)', 'avgNote')
      .addSelect('AVG(s.rhythmAccuracy)', 'avgRhythm')
      .addSelect('AVG(s.tempoStability)', 'avgTempoStab')
      .addSelect('AVG(s.tempoBpm)', 'avgBpm')
      .addSelect('COALESCE(SUM(s.durationSeconds), 0)', 'totalDur')
      .addSelect('MIN(s.startedAt)', 'firstAt')
      .addSelect('MAX(s.startedAt)', 'lastAt')
      .where('s.userId = :userId', { userId })
      .andWhere('s.compositionId = :cid', { cid: compositionId })
      .getRawOne();

    const count = parseInt(raw.count, 10) || 0;
    const round2 = (v: string | null) =>
      v === null ? null : Math.round(parseFloat(v) * 100) / 100;

    return {
      compositionId,
      count,
      avgNoteAccuracy: count > 0 ? round2(raw.avgNote) : null,
      avgRhythmAccuracy: count > 0 ? round2(raw.avgRhythm) : null,
      avgTempoStability: count > 0 ? round2(raw.avgTempoStab) : null,
      avgTempoBpm: count > 0 ? round2(raw.avgBpm) : null,
      totalDurationSeconds: parseInt(raw.totalDur, 10) || 0,
      firstSessionAt: raw.firstAt ? new Date(raw.firstAt) : null,
      lastSessionAt: raw.lastAt ? new Date(raw.lastAt) : null,
    };
  }

  /**
   * Trendovi performansi kroz vrijeme (FZ-D06).
   * Grupira sesije po danu i vraća prosjek 3 metrike po danu.
   */
  public async getTrends(
    userId: string,
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<TrendPoint[]> {
    const qb = this.sessionsRepository
      .createQueryBuilder('s')
      .select(`TO_CHAR(s.startedAt, 'YYYY-MM-DD')`, 'date')
      .addSelect('AVG(s.noteAccuracy)', 'avgNote')
      .addSelect('AVG(s.rhythmAccuracy)', 'avgRhythm')
      .addSelect('AVG(s.tempoStability)', 'avgTempoStab')
      .addSelect('COUNT(s.id)', 'cnt')
      .where('s.userId = :userId', { userId });

    if (dateFrom) qb.andWhere('s.startedAt >= :df', { df: dateFrom });
    if (dateTo) qb.andWhere('s.startedAt <= :dt', { dt: dateTo });

    qb.groupBy(`TO_CHAR(s.startedAt, 'YYYY-MM-DD')`).orderBy('date', 'ASC');

    const rows = await qb.getRawMany();
    const round2 = (v: string) => Math.round(parseFloat(v) * 100) / 100;
    return rows.map((r) => ({
      date: r.date,
      avgNoteAccuracy: round2(r.avgNote),
      avgRhythmAccuracy: round2(r.avgRhythm),
      avgTempoStability: round2(r.avgTempoStab),
      sessionCount: parseInt(r.cnt, 10),
    }));
  }
}
