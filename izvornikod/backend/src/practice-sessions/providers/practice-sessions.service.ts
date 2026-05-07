import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePracticeSessionDto } from '../dtos/create-practice-session.dto';
import { QueryPracticeSessionsDto } from '../dtos/query-practice-sessions.dto';
import { CreatePracticeSessionProvider } from './create-practice-session.provider';
import { FindPracticeSessionProvider } from './find-practice-session.provider';

@Injectable()
export class PracticeSessionsService {
  constructor(
    private readonly createProvider: CreatePracticeSessionProvider,
    private readonly findProvider: FindPracticeSessionProvider,
  ) {}

  public create(dto: CreatePracticeSessionDto, userId: string) {
    return this.createProvider.create(dto, userId);
  }

  public findAll(userId: string, query: QueryPracticeSessionsDto) {
    return this.findProvider.findAll(userId, query);
  }

  public async getById(id: string, userId: string) {
    const s = await this.findProvider.findOneById(id, userId);
    if (!s) throw new NotFoundException('Sesija nije pronađena');
    return s;
  }

  public getStatsForComposition(compositionId: string, userId: string) {
    return this.findProvider.getStatsForComposition(compositionId, userId);
  }

  public getTrends(userId: string, dateFrom?: Date, dateTo?: Date) {
    return this.findProvider.getTrends(userId, dateFrom, dateTo);
  }
}
