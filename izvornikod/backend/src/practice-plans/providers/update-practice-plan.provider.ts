import {
  Injectable,
  NotFoundException,
  RequestTimeoutException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PracticePlan } from '../entities/practice-plan.entity';
import { UpdatePracticePlanDto } from '../dtos/update-practice-plan.dto';
import { FindPracticePlanProvider } from './find-practice-plan.provider';

@Injectable()
export class UpdatePracticePlanProvider {
  constructor(
    @InjectRepository(PracticePlan)
    private readonly repo: Repository<PracticePlan>,
    private readonly findProvider: FindPracticePlanProvider,
  ) {}

  public async update(
    id: string,
    dto: UpdatePracticePlanDto,
    userId: string,
  ): Promise<PracticePlan> {
    const plan = await this.findProvider.findOneById(id, userId);
    if (!plan) throw new NotFoundException('Plan nije pronađen');

    if (dto.name !== undefined) plan.name = dto.name;
    if (dto.notes !== undefined) plan.notes = dto.notes;
    if (dto.scheduledDate !== undefined) {
      plan.scheduledDate = dto.scheduledDate.toISOString().slice(0, 10);
    }
    if (dto.durationMinutes !== undefined) {
      plan.durationMinutes = dto.durationMinutes;
    }

    try {
      return await this.repo.save(plan);
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

  public async markCompleted(
    id: string,
    userId: string,
  ): Promise<PracticePlan> {
    const plan = await this.findProvider.findOneById(id, userId);
    if (!plan) throw new NotFoundException('Plan nije pronađen');
    plan.isCompleted = true;
    plan.completedAt = new Date();
    return this.repo.save(plan);
  }
}
