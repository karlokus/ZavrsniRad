import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PracticeSession } from '../../practice-sessions/entities/practice-session.entity';
import { TargetArea } from '../../composition-target-areas/enums/target-area.enum';

/**
 * Score po target area-u. Veći broj = veća slabost (više potrebe za vježbom).
 *
 * Skala 0-100, izračunato iz odstupanja zadnjih N sesija od ciljanog
 * accuracy-ja (default 90%). Ako korisnik ima 0 sesija, vraćamo neutralnu
 * vrijednost 50 za sve target areas (sve su podjednako "potencijalne slabosti").
 */
export type WeaknessScores = Record<TargetArea, number>;

/**
 * Provider za analizu slabosti — gleda zadnjih N PracticeSession zapisa
 * i kalkulira weakness score po target area-u (FZ-L13).
 *
 * Mapping (sesija metrike → target areas):
 * - noteAccuracy   → NOTE_ACCURACY
 * - rhythmAccuracy → RHYTHM
 * - tempoStability → TEMPO
 *
 * Ostale 3 (FINGER_DEXTERITY, SCALE, CHORD) trenutno nisu mjerene direktno
 * sesijom; koristimo prosjek tri gornje metrike kao proxy za "opću slabost".
 */
@Injectable()
export class WeaknessAnalyzerProvider {
  /** Ciljana razina accuracy-ja (90%) za izračun weakness-a */
  private static readonly TARGET_ACCURACY = 90;
  /** Default broj zadnjih sesija koje se analiziraju */
  private static readonly DEFAULT_LOOKBACK = 20;

  constructor(
    @InjectRepository(PracticeSession)
    private readonly sessionsRepository: Repository<PracticeSession>,
  ) {}

  public async getScoresForUser(
    userId: string,
    lookback = WeaknessAnalyzerProvider.DEFAULT_LOOKBACK,
  ): Promise<WeaknessScores> {
    const sessions = await this.sessionsRepository
      .createQueryBuilder('s')
      .where('s.userId = :userId', { userId })
      .orderBy('s.startedAt', 'DESC')
      .limit(lookback)
      .getMany();

    if (sessions.length === 0) {
      // Bez podataka — neutralne ocjene da recommender vrati raznolike vježbe
      return {
        [TargetArea.NOTE_ACCURACY]: 50,
        [TargetArea.RHYTHM]: 50,
        [TargetArea.TEMPO]: 50,
        [TargetArea.FINGER_DEXTERITY]: 50,
        [TargetArea.SCALE]: 50,
        [TargetArea.CHORD]: 50,
      };
    }

    const avg = (vals: number[]) =>
      vals.reduce((a, b) => a + Number(b), 0) / vals.length;

    const avgNote = avg(sessions.map((s) => s.noteAccuracy));
    const avgRhythm = avg(sessions.map((s) => s.rhythmAccuracy));
    const avgTempo = avg(sessions.map((s) => s.tempoStability));

    const target = WeaknessAnalyzerProvider.TARGET_ACCURACY;
    // weakness = max(0, target - avg). Skaliramo na [0, 100].
    const w = (avg: number) => Math.max(0, Math.min(100, target - avg));

    const general = (w(avgNote) + w(avgRhythm) + w(avgTempo)) / 3;

    return {
      [TargetArea.NOTE_ACCURACY]: round2(w(avgNote)),
      [TargetArea.RHYTHM]: round2(w(avgRhythm)),
      [TargetArea.TEMPO]: round2(w(avgTempo)),
      [TargetArea.FINGER_DEXTERITY]: round2(general),
      [TargetArea.SCALE]: round2(general),
      [TargetArea.CHORD]: round2(general),
    };
  }

  /**
   * Adaptivna težina (FZ-L15).
   * userSkillBase = prosjek korisnikovih mastery polja (1-5 → 1-10 skala).
   * performanceDelta = (avgAccuracy - target) / 10 (pozitivno = povećaj difficulty).
   */
  public async getRecommendedDifficulty(
    userId: string,
  ): Promise<number> {
    const sessions = await this.sessionsRepository
      .createQueryBuilder('s')
      .leftJoin('s.composition', 'c')
      .addSelect([
        'c.notesMastery',
        'c.lyricsMastery',
        'c.playingMastery',
      ])
      .where('s.userId = :userId', { userId })
      .orderBy('s.startedAt', 'DESC')
      .limit(WeaknessAnalyzerProvider.DEFAULT_LOOKBACK)
      .getMany();

    if (sessions.length === 0) {
      return 5; // sredina skale, default
    }

    const avg = (vals: number[]) =>
      vals.reduce((a, b) => a + Number(b), 0) / vals.length;

    // userSkillBase: composition mastery skala 1-5 → 1-10
    const masteryRaw = sessions
      .map((s) => {
        const c = s.composition;
        if (!c) return null;
        const m =
          ((c.notesMastery ?? 1) +
            (c.lyricsMastery ?? 1) +
            (c.playingMastery ?? 1)) /
          3;
        return m * 2; // 1-5 → 2-10
      })
      .filter((v): v is number => v !== null);

    const userSkillBase = masteryRaw.length > 0 ? avg(masteryRaw) : 5;

    const avgAcc = avg(
      sessions.map(
        (s) =>
          (Number(s.noteAccuracy) +
            Number(s.rhythmAccuracy) +
            Number(s.tempoStability)) /
          3,
      ),
    );
    const performanceDelta =
      (avgAcc - WeaknessAnalyzerProvider.TARGET_ACCURACY) / 10;

    const raw = userSkillBase + performanceDelta;
    return Math.round(Math.max(1, Math.min(10, raw)));
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
