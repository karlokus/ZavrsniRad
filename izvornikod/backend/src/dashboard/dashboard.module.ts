import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Composition } from '../compositions/entities/composition.entity';
import { Category } from '../categories/entities/category.entity';
import { MasteryLog } from '../mastery-logs/entities/mastery-log.entity';
import { PracticeSession } from '../practice-sessions/entities/practice-session.entity';
import { PracticePlan } from '../practice-plans/entities/practice-plan.entity';
import { DashboardController } from './controllers/dashboard.controller';
import { DashboardService } from './providers/dashboard.service';
import { DashboardStatsProvider } from './providers/dashboard-stats.provider';
import { PracticePlansModule } from '../practice-plans/practice-plans.module';

/**
 * Read-only modul za dashboard agregacije (FZ-D01–FZ-D06).
 *
 * Registrira sve potrebne entitete preko forFeature umjesto
 * importa cijelih feature modula — izbjegava potencijalne cirkularne
 * ovisnosti i drži dashboard provider thin & decoupled.
 *
 * StreakCalculatorProvider potreban iz PracticePlansModule-a;
 * importamo ga zbog njegove eksponirane logike streak-a.
 */
@Module({
  controllers: [DashboardController],
  providers: [DashboardService, DashboardStatsProvider],
  imports: [
    TypeOrmModule.forFeature([
      Composition,
      Category,
      MasteryLog,
      PracticeSession,
      PracticePlan,
    ]),
    PracticePlansModule,
  ],
})
export class DashboardModule {}
