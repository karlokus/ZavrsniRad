import { Injectable } from '@nestjs/common';
import { FindMasteryLogProvider } from './find-mastery-log.provider';
import { QueryMasteryLogsDto } from '../dtos/query-mastery-logs.dto';

/**
 * Fasadni servis za dohvat povijesti mastery promjena (FZ-R15, FZ-R16, FZ-R17).
 *
 * Kreiranje logova nije izloženo preko API-ja — to radi
 * CreateMasteryLogProvider interno iz UpdateCompositionProvider-a.
 */
@Injectable()
export class MasteryLogsService {
  constructor(private readonly findProvider: FindMasteryLogProvider) {}

  public findAll(userId: string, query: QueryMasteryLogsDto) {
    return this.findProvider.findAll(userId, query);
  }

  public getSummary(compositionId: string, userId: string) {
    return this.findProvider.getSummary(compositionId, userId);
  }
}
