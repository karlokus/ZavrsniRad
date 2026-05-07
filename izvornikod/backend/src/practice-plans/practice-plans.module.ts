import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PracticePlan } from './entities/practice-plan.entity';
import { PracticePlanSong } from './entities/practice-plan-song.entity';
import { PracticePlansController } from './practice-plans.controller';
import { PracticePlansService } from './providers/practice-plans.service';
import { CreatePracticePlanProvider } from './providers/create-practice-plan.provider';
import { FindPracticePlanProvider } from './providers/find-practice-plan.provider';
import { UpdatePracticePlanProvider } from './providers/update-practice-plan.provider';
import { DeletePracticePlanProvider } from './providers/delete-practice-plan.provider';
import { ManagePlanSongsProvider } from './providers/manage-plan-songs.provider';
import { RecurringPlanProvider } from './providers/recurring-plan.provider';
import { StreakCalculatorProvider } from './providers/streak-calculator.provider';
import { CompositionsModule } from '../compositions/compositions.module';

@Module({
  controllers: [PracticePlansController],
  providers: [
    PracticePlansService,
    CreatePracticePlanProvider,
    FindPracticePlanProvider,
    UpdatePracticePlanProvider,
    DeletePracticePlanProvider,
    ManagePlanSongsProvider,
    RecurringPlanProvider,
    StreakCalculatorProvider,
  ],
  imports: [
    TypeOrmModule.forFeature([PracticePlan, PracticePlanSong]),
    CompositionsModule, // FindCompositionProvider
  ],
  exports: [TypeOrmModule],
})
export class PracticePlansModule {}
