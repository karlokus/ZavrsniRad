import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PracticeSession } from './entities/practice-session.entity';
import { PracticeSessionsController } from './practice-sessions.controller';
import { PracticeSessionsService } from './providers/practice-sessions.service';
import { CreatePracticeSessionProvider } from './providers/create-practice-session.provider';
import { FindPracticeSessionProvider } from './providers/find-practice-session.provider';
import { CompositionsModule } from '../compositions/compositions.module';

@Module({
  controllers: [PracticeSessionsController],
  providers: [
    PracticeSessionsService,
    CreatePracticeSessionProvider,
    FindPracticeSessionProvider,
  ],
  imports: [
    TypeOrmModule.forFeature([PracticeSession]),
    CompositionsModule, // FindCompositionProvider za vlasništvo
  ],
  exports: [TypeOrmModule],
})
export class PracticeSessionsModule {}
