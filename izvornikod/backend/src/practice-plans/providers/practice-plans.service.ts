import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePracticePlanDto } from '../dtos/create-practice-plan.dto';
import { UpdatePracticePlanDto } from '../dtos/update-practice-plan.dto';
import { QueryPracticePlansDto } from '../dtos/query-practice-plans.dto';
import { AddSongToPlanDto } from '../dtos/add-song-to-plan.dto';
import { ReorderPlanSongsDto } from '../dtos/reorder-plan-songs.dto';
import { CreatePracticePlanProvider } from './create-practice-plan.provider';
import { FindPracticePlanProvider } from './find-practice-plan.provider';
import { UpdatePracticePlanProvider } from './update-practice-plan.provider';
import { DeletePracticePlanProvider } from './delete-practice-plan.provider';
import { ManagePlanSongsProvider } from './manage-plan-songs.provider';
import { StreakCalculatorProvider } from './streak-calculator.provider';

@Injectable()
export class PracticePlansService {
  constructor(
    private readonly createProvider: CreatePracticePlanProvider,
    private readonly findProvider: FindPracticePlanProvider,
    private readonly updateProvider: UpdatePracticePlanProvider,
    private readonly deleteProvider: DeletePracticePlanProvider,
    private readonly manageSongsProvider: ManagePlanSongsProvider,
    private readonly streakProvider: StreakCalculatorProvider,
  ) {}

  public create(dto: CreatePracticePlanDto, userId: string) {
    return this.createProvider.create(dto, userId);
  }

  public findAll(userId: string, query: QueryPracticePlansDto) {
    return this.findProvider.findAllInRange(userId, query);
  }

  public findTemplates(userId: string) {
    return this.findProvider.findTemplates(userId);
  }

  public async getById(id: string, userId: string) {
    const plan = await this.findProvider.findOneById(id, userId);
    if (!plan) throw new NotFoundException('Plan nije pronađen');
    return plan;
  }

  public update(id: string, dto: UpdatePracticePlanDto, userId: string) {
    return this.updateProvider.update(id, dto, userId);
  }

  public remove(id: string, userId: string) {
    return this.deleteProvider.delete(id, userId);
  }

  public markCompleted(id: string, userId: string) {
    return this.updateProvider.markCompleted(id, userId);
  }

  public addSong(planId: string, dto: AddSongToPlanDto, userId: string) {
    return this.manageSongsProvider.addSong(planId, dto, userId);
  }

  public removeSong(planId: string, compositionId: string, userId: string) {
    return this.manageSongsProvider.removeSong(planId, compositionId, userId);
  }

  public reorder(planId: string, dto: ReorderPlanSongsDto, userId: string) {
    return this.manageSongsProvider.reorder(planId, dto, userId);
  }

  public getStreak(userId: string) {
    return this.streakProvider.getCurrentStreak(userId);
  }
}
