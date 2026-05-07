import {
  BadRequestException,
  Injectable,
  NotFoundException,
  RequestTimeoutException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PracticeSession } from '../entities/practice-session.entity';
import { CreatePracticeSessionDto } from '../dtos/create-practice-session.dto';
import { FindCompositionProvider } from '../../compositions/providers/find-composition.provider';
import { User } from '../../users/entities/user.entity';
import { Composition } from '../../compositions/entities/composition.entity';

@Injectable()
export class CreatePracticeSessionProvider {
  constructor(
    @InjectRepository(PracticeSession)
    private readonly sessionsRepository: Repository<PracticeSession>,
    private readonly findCompositionProvider: FindCompositionProvider,
  ) {}

  public async create(
    dto: CreatePracticeSessionDto,
    userId: string,
  ): Promise<PracticeSession> {
    // Validacija pristupa kompoziciji (vlasništvo SONG-a / EXERCISE pristup svima)
    const composition = await this.findCompositionProvider.findOneById(
      dto.compositionId,
      userId,
    );
    if (!composition) {
      throw new NotFoundException('Kompozicija nije pronađena');
    }

    // Kronoloska konzistentnost
    if (dto.completedAt < dto.startedAt) {
      throw new BadRequestException(
        'completedAt mora biti veći ili jednak startedAt',
      );
    }

    const entity = this.sessionsRepository.create({
      user: { id: userId } as User,
      composition: { id: dto.compositionId } as Composition,
      noteAccuracy: dto.noteAccuracy,
      rhythmAccuracy: dto.rhythmAccuracy,
      tempoStability: dto.tempoStability,
      tempoBpm: dto.tempoBpm,
      durationSeconds: dto.durationSeconds,
      startedAt: dto.startedAt,
      completedAt: dto.completedAt,
    });

    try {
      return await this.sessionsRepository.save(entity);
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
}
