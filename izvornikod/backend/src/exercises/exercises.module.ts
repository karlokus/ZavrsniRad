import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Composition } from '../compositions/entities/composition.entity';
import { CompositionTargetArea } from '../composition-target-areas/entities/composition-target-area.entity';
import { PracticeSession } from '../practice-sessions/entities/practice-session.entity';
import { ExercisesController } from './exercises.controller';
import { ExercisesService } from './providers/exercises.service';
import { ExerciseRecommenderProvider } from './providers/exercise-recommender.provider';
import { WeaknessAnalyzerProvider } from './providers/weakness-analyzer.provider';
import { ExercisesSeedProvider } from './exercises.seed';

@Module({
  controllers: [ExercisesController],
  providers: [
    ExercisesService,
    ExerciseRecommenderProvider,
    WeaknessAnalyzerProvider,
    ExercisesSeedProvider,
  ],
  imports: [
    TypeOrmModule.forFeature([
      Composition,
      CompositionTargetArea,
      PracticeSession,
    ]),
  ],
  exports: [ExerciseRecommenderProvider, WeaknessAnalyzerProvider],
})
export class ExercisesModule {}
