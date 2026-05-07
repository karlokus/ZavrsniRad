import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Composition } from '../../compositions/entities/composition.entity';
import { CompositionType } from '../../compositions/enums/composition-type.enum';
import { CompositionTargetArea } from '../../composition-target-areas/entities/composition-target-area.entity';
import { TargetArea } from '../../composition-target-areas/enums/target-area.enum';
import {
  WeaknessAnalyzerProvider,
  WeaknessScores,
} from './weakness-analyzer.provider';

export interface ExerciseRecommendation {
  exercise: Composition;
  matchedTargetArea: TargetArea;
  weaknessScore: number;
  difficultyDelta: number;
  recommendedDifficulty: number;
  matchScore: number;
}

/**
 * Provider koji preporučuje EXERCISE compositions korisniku (FZ-L14, FZ-L15).
 *
 * Algoritam:
 * 1. WeaknessAnalyzer → score po targetArea-u
 * 2. recommendedDifficulty iz WeaknessAnalyzer-a
 * 3. Dohvati sve EXERCISE compositions s pripadajućim targetAreas
 * 4. Za svaku target area zapisa:
 *    - matchScore = weaknessScore - 2 * |difficulty - recommendedDifficulty|
 *      (preferira vježbe blizu ciljane težine)
 * 5. Sortiraj DESC po matchScore, vrati top N (default 5).
 *
 * Ako filter targetArea zadan — ograniči na vježbe koje pokrivaju taj area.
 */
@Injectable()
export class ExerciseRecommenderProvider {
  constructor(
    @InjectRepository(Composition)
    private readonly compositionsRepository: Repository<Composition>,
    @InjectRepository(CompositionTargetArea)
    private readonly targetAreasRepository: Repository<CompositionTargetArea>,
    private readonly weaknessAnalyzer: WeaknessAnalyzerProvider,
  ) {}

  public async recommend(
    userId: string,
    options: { targetArea?: TargetArea; limit?: number } = {},
  ): Promise<ExerciseRecommendation[]> {
    const limit = options.limit ?? 5;

    const [scores, recommendedDifficulty] = await Promise.all([
      this.weaknessAnalyzer.getScoresForUser(userId),
      this.weaknessAnalyzer.getRecommendedDifficulty(userId),
    ]);

    // Učitaj sve EXERCISE target area zapise (s pripadajućom kompozicijom)
    const qb = this.targetAreasRepository
      .createQueryBuilder('ta')
      .innerJoinAndSelect('ta.composition', 'c')
      .leftJoinAndSelect('c.artist', 'artist')
      .leftJoinAndSelect('c.keySignature', 'keySignature')
      .where('c.type = :type', { type: CompositionType.EXERCISE });

    if (options.targetArea) {
      qb.andWhere('ta.targetArea = :ta', { ta: options.targetArea });
    }

    const rows = await qb.getMany();

    // Score svaki red i deduplikacija po composition.id (uzimamo najbolji match)
    const bestPerComposition = new Map<string, ExerciseRecommendation>();
    for (const ta of rows) {
      const c = ta.composition;
      const wScore = scores[ta.targetArea] ?? 50;
      const diffDelta = Math.abs(ta.difficultyLevel - recommendedDifficulty);
      const matchScore = wScore - 2 * diffDelta;

      const candidate: ExerciseRecommendation = {
        exercise: c,
        matchedTargetArea: ta.targetArea,
        weaknessScore: wScore,
        difficultyDelta: diffDelta,
        recommendedDifficulty,
        matchScore: Math.round(matchScore * 100) / 100,
      };

      const prev = bestPerComposition.get(c.id);
      if (!prev || candidate.matchScore > prev.matchScore) {
        bestPerComposition.set(c.id, candidate);
      }
    }

    return Array.from(bestPerComposition.values())
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);
  }

  /**
   * Vraća sve EXERCISE compositions (s targetAreas relacijom).
   */
  public async findAllExercises(): Promise<Composition[]> {
    return this.compositionsRepository.find({
      where: { type: CompositionType.EXERCISE },
      relations: ['artist', 'keySignature', 'targetAreas'],
      order: { title: 'ASC' },
    });
  }

  /**
   * Helper koji vraća weakness scores za debugiranje/dashboard.
   */
  public async getWeaknessScores(userId: string): Promise<WeaknessScores> {
    return this.weaknessAnalyzer.getScoresForUser(userId);
  }
}
