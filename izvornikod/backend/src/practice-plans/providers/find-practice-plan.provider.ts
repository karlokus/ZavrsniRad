import {
  ForbiddenException,
  Injectable,
  RequestTimeoutException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PracticePlan } from '../entities/practice-plan.entity';
import { QueryPracticePlansDto } from '../dtos/query-practice-plans.dto';
import { RecurringPlanProvider } from './recurring-plan.provider';

@Injectable()
export class FindPracticePlanProvider {
  constructor(
    @InjectRepository(PracticePlan)
    private readonly repo: Repository<PracticePlan>,
    private readonly recurringProvider: RecurringPlanProvider,
  ) {}

  public async findOneById(
    id: string,
    userId: string,
  ): Promise<PracticePlan | null> {
    const plan = await this.repo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.user', 'user')
      .leftJoinAndSelect('p.songs', 'song')
      .leftJoinAndSelect('song.composition', 'composition')
      .leftJoinAndSelect('composition.artist', 'artist')
      .leftJoinAndSelect('composition.keySignature', 'keySignature')
      .where('p.id = :id', { id })
      .orderBy('song.position', 'ASC')
      .getOne();
    if (!plan) return null;
    if (plan.user.id !== userId) {
      throw new ForbiddenException('Nemate pristup ovom planu');
    }
    return plan;
  }

  /**
   * Glavni endpoint — prvo materijalizira recurring instance, pa vraća
   * sve nepowerne planove (template-i isključeni iz liste) u rasponu.
   *
   * Defaultni raspon: ako dateFrom/dateTo nisu zadani, koristi se prošlih 30
   * dana → idućih 60 dana. Ovo ograničava lazy generation kad korisnik
   * ne specificira raspon.
   */
  public async findAllInRange(
    userId: string,
    query: QueryPracticePlansDto,
  ): Promise<PracticePlan[]> {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const dateFrom = query.dateFrom ?? this.addDays(today, -30);
    const dateTo = query.dateTo ?? this.addDays(today, 60);

    if (dateFrom > dateTo) {
      return [];
    }

    // 1. Lazy materializacija
    await this.recurringProvider.materializeForUser(userId, dateFrom, dateTo);

    // 2. Dohvat — ALI bez template-a (isRecurring=false)
    try {
      const qb = this.repo
        .createQueryBuilder('p')
        .where('p.userId = :userId', { userId })
        .andWhere('p.isRecurring = false')
        .andWhere('p.scheduledDate >= :df', {
          df: this.toDateString(dateFrom),
        })
        .andWhere('p.scheduledDate <= :dt', {
          dt: this.toDateString(dateTo),
        });

      if (query.isCompleted !== undefined) {
        // DTO drži string ('true'/'false'); ručno parsamo u boolean
        const ic = query.isCompleted === 'true';
        qb.andWhere('p.isCompleted = :ic', { ic });
      }

      qb.orderBy('p.scheduledDate', 'ASC').addOrderBy('p.createdAt', 'ASC');
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
   * Lista korisnikovih recurring template-a — prikaz "moji template-i"
   * odvojeno od dnevnih instanci.
   */
  public async findTemplates(userId: string): Promise<PracticePlan[]> {
    return this.repo.find({
      where: { user: { id: userId }, isRecurring: true },
      order: { name: 'ASC' },
    });
  }

  private toDateString(d: Date): string {
    return d.toISOString().slice(0, 10);
  }

  private addDays(d: Date, n: number): Date {
    const r = new Date(d);
    r.setUTCDate(r.getUTCDate() + n);
    return r;
  }
}
