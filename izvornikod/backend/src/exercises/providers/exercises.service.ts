import { Injectable } from '@nestjs/common';
import { ExerciseRecommenderProvider } from './exercise-recommender.provider';
import { TargetArea } from '../../composition-target-areas/enums/target-area.enum';

@Injectable()
export class ExercisesService {
  constructor(
    private readonly recommenderProvider: ExerciseRecommenderProvider,
  ) {}

  public findAll() {
    return this.recommenderProvider.findAllExercises();
  }

  public recommend(
    userId: string,
    targetArea?: TargetArea,
    limit?: number,
  ) {
    return this.recommenderProvider.recommend(userId, { targetArea, limit });
  }

  public getWeaknessScores(userId: string) {
    return this.recommenderProvider.getWeaknessScores(userId);
  }
}
