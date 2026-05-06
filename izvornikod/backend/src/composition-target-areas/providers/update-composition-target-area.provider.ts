import {
  Injectable,
  NotFoundException,
  RequestTimeoutException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompositionTargetArea } from '../entities/composition-target-area.entity';
import { UpdateCompositionTargetAreaDto } from '../dtos/update-composition-target-area.dto';
import { FindCompositionTargetAreaProvider } from './find-composition-target-area.provider';

/**
 * Provider za ažuriranje difficultyLevel i weightPercentage polja
 * postojećeg CompositionTargetArea zapisa.
 *
 * targetArea polje se NE ažurira — vidi UpdateCompositionTargetAreaDto.
 */
@Injectable()
export class UpdateCompositionTargetAreaProvider {
  constructor(
    @InjectRepository(CompositionTargetArea)
    private readonly targetAreasRepository: Repository<CompositionTargetArea>,

    private readonly findCompositionTargetAreaProvider: FindCompositionTargetAreaProvider,
  ) {}

  /**
   * Ažurira target area zapis po UUID-u.
   *
   * @param id - UUID target area zapisa
   * @param dto - Polja za ažuriranje
   * @param userId - UUID aktivnog korisnika iz JWT-a
   * @returns Ažurirani entitet
   * @throws NotFoundException ako zapis ne postoji
   * @throws ForbiddenException ako kompozicija nije korisnikova
   */
  public async updateTargetArea(
    id: string,
    dto: UpdateCompositionTargetAreaDto,
    userId: string,
  ): Promise<CompositionTargetArea> {
    // Dohvat s provjerom vlasništva
    const targetArea = await this.findCompositionTargetAreaProvider.findOneById(
      id,
      userId,
    );
    if (!targetArea) {
      throw new NotFoundException('Target area zapis nije pronađen');
    }

    targetArea.difficultyLevel =
      dto.difficultyLevel ?? targetArea.difficultyLevel;
    targetArea.weightPercentage =
      dto.weightPercentage ?? targetArea.weightPercentage;

    try {
      return await this.targetAreasRepository.save(targetArea);
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
