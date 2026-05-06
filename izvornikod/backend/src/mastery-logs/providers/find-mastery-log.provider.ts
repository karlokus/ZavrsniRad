import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  RequestTimeoutException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MasteryLog } from '../entities/mastery-log.entity';
import { MasteryAspect } from '../enums/mastery-aspect.enum';
import { QueryMasteryLogsDto } from '../dtos/query-mastery-logs.dto';
import { Composition } from '../../compositions/entities/composition.entity';
import { CompositionType } from '../../compositions/enums/composition-type.enum';

/**
 * Provider za dohvat povijesti mastery promjena (FZ-R15, FZ-R16, FZ-R17).
 *
 * Vlasništvo: korisnik vidi samo logove kompozicija koje su:
 * - SONG i njegove (composition.userId === userId)
 * - EXERCISE (dostupno svima)
 *
 * Provjera ide kroz join na composition aliasu jer MasteryLog
 * ne nosi userId direktno.
 */
@Injectable()
export class FindMasteryLogProvider {
  constructor(
    @InjectRepository(MasteryLog)
    private readonly masteryLogsRepository: Repository<MasteryLog>,

    @InjectRepository(Composition)
    private readonly compositionsRepository: Repository<Composition>,
  ) {}

  /**
   * Dohvaća povijest mastery logova s filterima.
   *
   * Sortirano po changedAt ASC (kronološki) — frontend grafikon
   * očekuje time-series od starijih ka novijim.
   *
   * @param userId - UUID aktivnog korisnika iz JWT-a
   * @param query - filter parametri
   */
  public async findAll(
    userId: string,
    query: QueryMasteryLogsDto,
  ): Promise<MasteryLog[]> {
    try {
      const qb = this.masteryLogsRepository
        .createQueryBuilder('log')
        .innerJoin('log.composition', 'composition')
        .addSelect([
          'composition.id',
          'composition.title',
          'composition.type',
          'composition.userId',
        ])
        .where(
          '((composition.userId = :userId AND composition.type = :songType) OR composition.type = :exerciseType)',
          {
            userId,
            songType: CompositionType.SONG,
            exerciseType: CompositionType.EXERCISE,
          },
        );

      if (query.compositionId) {
        qb.andWhere('log.compositionId = :compositionId', {
          compositionId: query.compositionId,
        });
      }
      if (query.aspect) {
        qb.andWhere('log.aspect = :aspect', { aspect: query.aspect });
      }
      if (query.dateFrom) {
        qb.andWhere('log.changedAt >= :dateFrom', { dateFrom: query.dateFrom });
      }
      if (query.dateTo) {
        qb.andWhere('log.changedAt <= :dateTo', { dateTo: query.dateTo });
      }

      qb.orderBy('log.changedAt', 'ASC').addOrderBy('log.id', 'ASC');

      return await qb.getMany();
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
   * Agregirana krivulja napretka za jednu kompoziciju.
   *
   * Vraća strukturu pogodnu za multi-line chart na frontendu:
   * - po jednoj seriji za svaki aspekt (NOTES, LYRICS, PLAYING)
   * - svaka točka: { changedAt, value } gdje je value newValue iz log zapisa
   *
   * Provjera vlasništva: ako kompozicija postoji ali nije korisnikova
   * (i nije EXERCISE), baca se ForbiddenException.
   *
   * @param compositionId - UUID kompozicije
   * @param userId - UUID aktivnog korisnika
   */
  public async getSummary(
    compositionId: string,
    userId: string,
  ): Promise<{
    compositionId: string;
    series: Record<MasteryAspect, { changedAt: Date; value: number }[]>;
  }> {
    // Validacija vlasništva preko Composition repozitorija
    const composition = await this.compositionsRepository.findOne({
      where: { id: compositionId },
      relations: ['user'],
    });
    if (!composition) {
      throw new NotFoundException('Kompozicija nije pronađena');
    }
    if (
      composition.type === CompositionType.SONG &&
      composition.user?.id !== userId
    ) {
      throw new ForbiddenException('Nemate pristup ovoj kompoziciji');
    }

    const logs = await this.masteryLogsRepository.find({
      where: { composition: { id: compositionId } },
      order: { changedAt: 'ASC', id: 'ASC' },
    });

    const series: Record<MasteryAspect, { changedAt: Date; value: number }[]> = {
      [MasteryAspect.NOTES]: [],
      [MasteryAspect.LYRICS]: [],
      [MasteryAspect.PLAYING]: [],
    };
    for (const l of logs) {
      series[l.aspect].push({ changedAt: l.changedAt, value: l.newValue });
    }
    return { compositionId, series };
  }
}
