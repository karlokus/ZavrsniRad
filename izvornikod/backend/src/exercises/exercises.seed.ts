import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Composition } from '../compositions/entities/composition.entity';
import { CompositionType } from '../compositions/enums/composition-type.enum';
import { CompositionTargetArea } from '../composition-target-areas/entities/composition-target-area.entity';
import { TargetArea } from '../composition-target-areas/enums/target-area.enum';

interface ExerciseSeedSpec {
  title: string;
  description: string;
  tempoBpm: number;
  targetAreas: { area: TargetArea; difficulty: number; weight: number }[];
}

/**
 * Seed predefiniranih EXERCISE compositions (FZ-L13).
 *
 * Pokreće se na startup-u (OnModuleInit). Idempotentno: provjerava
 * postojanje po title-u prije inserta. Sve EXERCISE-i imaju userId=null
 * (dostupni svim korisnicima — vidi Composition entitet user nullable).
 *
 * Za svaki seed exercise istovremeno se kreiraju i CompositionTargetArea
 * zapisi koji ga povezuju s relevantnim target areas (RHYTHM, NOTE_ACCURACY,
 * itd.) pa Recommender može matchirati slabosti.
 */
@Injectable()
export class ExercisesSeedProvider implements OnModuleInit {
  private readonly logger = new Logger(ExercisesSeedProvider.name);

  constructor(
    @InjectRepository(Composition)
    private readonly compositionsRepository: Repository<Composition>,
    @InjectRepository(CompositionTargetArea)
    private readonly targetAreasRepository: Repository<CompositionTargetArea>,
  ) {}

  private readonly specs: ExerciseSeedSpec[] = [
    {
      title: 'C-dur ljestvica (1 oktava)',
      description: 'Osnovna ljestvica za vježbu prstiju i preciznosti nota.',
      tempoBpm: 80,
      targetAreas: [
        { area: TargetArea.SCALE, difficulty: 2, weight: 60 },
        { area: TargetArea.NOTE_ACCURACY, difficulty: 2, weight: 30 },
        { area: TargetArea.FINGER_DEXTERITY, difficulty: 2, weight: 10 },
      ],
    },
    {
      title: 'A-mol ljestvica (2 oktave)',
      description: 'Mol ljestvica preko dvije oktave.',
      tempoBpm: 100,
      targetAreas: [
        { area: TargetArea.SCALE, difficulty: 4, weight: 60 },
        { area: TargetArea.FINGER_DEXTERITY, difficulty: 5, weight: 40 },
      ],
    },
    {
      title: 'Kromatska ljestvica',
      description: 'Vježba spretnosti prstiju kroz sve poluvanjske intervale.',
      tempoBpm: 120,
      targetAreas: [
        { area: TargetArea.FINGER_DEXTERITY, difficulty: 7, weight: 70 },
        { area: TargetArea.SCALE, difficulty: 6, weight: 30 },
      ],
    },
    {
      title: 'Akordi I-IV-V-I u C-duru',
      description: 'Klasična akordska progresija za vježbu prelaska.',
      tempoBpm: 90,
      targetAreas: [
        { area: TargetArea.CHORD, difficulty: 3, weight: 70 },
        { area: TargetArea.RHYTHM, difficulty: 3, weight: 30 },
      ],
    },
    {
      title: 'Akordi ii-V-I u C-duru',
      description: 'Jazz progresija za prijelaze i fingering.',
      tempoBpm: 110,
      targetAreas: [
        { area: TargetArea.CHORD, difficulty: 6, weight: 60 },
        { area: TargetArea.FINGER_DEXTERITY, difficulty: 5, weight: 40 },
      ],
    },
    {
      title: 'Ritmički obrazac (osminke)',
      description: 'Vježba ritmičke točnosti — ravne osminke uz metronom.',
      tempoBpm: 100,
      targetAreas: [
        { area: TargetArea.RHYTHM, difficulty: 3, weight: 60 },
        { area: TargetArea.TEMPO, difficulty: 3, weight: 40 },
      ],
    },
    {
      title: 'Sinkopa (16-tinke s naglascima)',
      description: 'Napredna ritmička vježba sa sinkopiranim naglascima.',
      tempoBpm: 80,
      targetAreas: [
        { area: TargetArea.RHYTHM, difficulty: 7, weight: 70 },
        { area: TargetArea.TEMPO, difficulty: 6, weight: 30 },
      ],
    },
    {
      title: 'Tempo drill (postupna akceleracija)',
      description: 'Postupno povećanje tempa od 60 do 140 BPM.',
      tempoBpm: 100,
      targetAreas: [
        { area: TargetArea.TEMPO, difficulty: 5, weight: 80 },
        { area: TargetArea.RHYTHM, difficulty: 4, weight: 20 },
      ],
    },
  ];

  async onModuleInit(): Promise<void> {
    let created = 0;
    for (const spec of this.specs) {
      const exists = await this.compositionsRepository.findOne({
        where: { title: spec.title, type: CompositionType.EXERCISE },
      });
      if (exists) continue;

      const composition = this.compositionsRepository.create({
        type: CompositionType.EXERCISE,
        title: spec.title,
        description: spec.description,
        tempoBpm: spec.tempoBpm,
        // EXERCISE nema vlasnika
        user: undefined,
        notesMastery: 1,
        lyricsMastery: 1,
        playingMastery: 1,
      });
      const saved = await this.compositionsRepository.save(composition);

      for (const ta of spec.targetAreas) {
        const targetArea = this.targetAreasRepository.create({
          composition: { id: saved.id } as Composition,
          targetArea: ta.area,
          difficultyLevel: ta.difficulty,
          weightPercentage: ta.weight,
        });
        await this.targetAreasRepository.save(targetArea);
      }
      created++;
    }
    if (created > 0) {
      this.logger.log(
        `Seeded ${created} EXERCISE compositions with target areas`,
      );
    }
  }
}
