import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PracticePlan } from '../entities/practice-plan.entity';
import { FindPracticePlanProvider } from './find-practice-plan.provider';

@Injectable()
export class DeletePracticePlanProvider {
  constructor(
    @InjectRepository(PracticePlan)
    private readonly repo: Repository<PracticePlan>,
    private readonly findProvider: FindPracticePlanProvider,
  ) {}

  public async delete(
    id: string,
    userId: string,
  ): Promise<{ deleted: boolean; id: string }> {
    const plan = await this.findProvider.findOneById(id, userId);
    if (!plan) throw new NotFoundException('Plan nije pronađen');
    const result = await this.repo.delete(id);
    return { deleted: (result.affected ?? 0) > 0, id };
  }
}
