import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PracticePlan } from '../entities/practice-plan.entity';

/**
 * Provider za izračun trenutnog streak-a — broj uzastopnih dana
 * (završavajući "danas" ili zadnjim danom s aktivnošću) u kojima je
 * korisnik označio plan kao isCompleted=true (FZ-L19).
 *
 * Algoritam:
 * 1. Dohvati distinct datume korisnikovih završenih planova (sortirano DESC).
 * 2. Krene od najnovijeg završenog dana; ako razlika do "today" > 1 dan,
 *    streak je 0 (ili 1 ako je =1 dan, ovisno o definiciji — koristimo
 *    "completion mora uključivati danas ILI jučer da bi streak bio aktivan").
 * 3. Idi unatrag dan po dan dok ima uzastopnih dana s aktivnošću.
 */
@Injectable()
export class StreakCalculatorProvider {
  constructor(
    @InjectRepository(PracticePlan)
    private readonly repo: Repository<PracticePlan>,
  ) {}

  public async getCurrentStreak(userId: string): Promise<{
    currentStreak: number;
    lastCompletedDate: string | null;
  }> {
    // TO_CHAR pretvara date u 'YYYY-MM-DD' string da izbjegnemo TZ shift
    // koji se događa kad TypeORM mapira Postgres date u JS Date objekt.
    // Filtriramo scheduledDate <= today jer streak ne broji future-dated planove
    // (npr. plan za sutra koji je marked complete ne smije postavljati baseline).
    const today = this.toDateString(new Date());
    const rows = await this.repo
      .createQueryBuilder('p')
      .select(`DISTINCT TO_CHAR(p."scheduledDate", 'YYYY-MM-DD')`, 'date')
      .where('p."userId" = :userId', { userId })
      .andWhere('p."isCompleted" = true')
      .andWhere('p."isRecurring" = false')
      .andWhere(`p."scheduledDate" <= :today`, { today })
      .orderBy('date', 'DESC')
      .getRawMany();

    if (rows.length === 0) {
      return { currentStreak: 0, lastCompletedDate: null };
    }

    const dates = rows.map((r) => r.date as string);
    const yesterday = this.toDateString(this.addDays(new Date(), -1));

    // Streak je aktivan ako je najnovija completion datum danas ili jučer
    if (dates[0] !== today && dates[0] !== yesterday) {
      return { currentStreak: 0, lastCompletedDate: dates[0] };
    }

    let streak = 1;
    let cursor = new Date(dates[0] + 'T00:00:00Z');
    for (let i = 1; i < dates.length; i++) {
      const expected = this.addDays(cursor, -1);
      const expectedStr = this.toDateString(expected);
      if (dates[i] === expectedStr) {
        streak++;
        cursor = expected;
      } else {
        break;
      }
    }

    return { currentStreak: streak, lastCompletedDate: dates[0] };
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
