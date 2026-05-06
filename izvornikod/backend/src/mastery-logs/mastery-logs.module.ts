import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MasteryLog } from './entities/mastery-log.entity';
import { Composition } from '../compositions/entities/composition.entity';
import { MasteryLogsController } from './mastery-logs.controller';
import { MasteryLogsService } from './providers/mastery-logs.service';
import { CreateMasteryLogProvider } from './providers/create-mastery-log.provider';
import { FindMasteryLogProvider } from './providers/find-mastery-log.provider';

/**
 * Modul za bilježenje i dohvat povijesti mastery promjena (FZ-R15-R17).
 *
 * Eksportira CreateMasteryLogProvider tako da ga UpdateCompositionProvider
 * može pozvati iz CompositionsModule-a unutar update flow-a.
 *
 * Composition entitet je registriran ovdje (forFeature) jer ga
 * FindMasteryLogProvider koristi za provjeru vlasništva u getSummary metodi.
 */
@Module({
  controllers: [MasteryLogsController],
  providers: [
    MasteryLogsService,
    CreateMasteryLogProvider,
    FindMasteryLogProvider,
  ],
  imports: [TypeOrmModule.forFeature([MasteryLog, Composition])],
  exports: [CreateMasteryLogProvider],
})
export class MasteryLogsModule {}
