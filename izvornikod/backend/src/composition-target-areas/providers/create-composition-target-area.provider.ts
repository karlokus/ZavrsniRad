import {
  ConflictException,
  Injectable,
  NotFoundException,
  RequestTimeoutException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompositionTargetArea } from '../entities/composition-target-area.entity';
import { CreateCompositionTargetAreaDto } from '../dtos/create-composition-target-area.dto';
import { FindCompositionProvider } from '../../compositions/providers/find-composition.provider';
import { FindCompositionTargetAreaProvider } from './find-composition-target-area.provider';
import { Composition } from '../../compositions/entities/composition.entity';

/**
 * Provider za kreiranje novog CompositionTargetArea zapisa.
 *
 * Flow:
 * 1. Validira da kompozicija postoji i pripada korisniku
 *    (preko FindCompositionProvider — baca ForbiddenException ako tuđa)
 * 2. Provjerava da već ne postoji isti targetArea za tu kompoziciju
 *    (sprečava duplikate jer korisnik ne želi npr. dva RHYTHM zapisa)
 * 3. Kreira i sprema novi zapis
 */
@Injectable()
export class CreateCompositionTargetAreaProvider {
  constructor(
    @InjectRepository(CompositionTargetArea)
    private readonly targetAreasRepository: Repository<CompositionTargetArea>,

    private readonly findCompositionProvider: FindCompositionProvider,

    private readonly findCompositionTargetAreaProvider: FindCompositionTargetAreaProvider,
  ) {}

  /**
   * Kreira novi target area zapis za kompoziciju.
   *
   * @param compositionId - UUID kompozicije iz URL parametra
   * @param dto - Podaci za kreiranje (targetArea, difficultyLevel, weightPercentage)
   * @param userId - UUID aktivnog korisnika iz JWT-a
   * @returns Kreirani CompositionTargetArea entitet
   * @throws NotFoundException ako kompozicija ne postoji
   * @throws ForbiddenException ako kompozicija nije korisnikova
   * @throws ConflictException ako već postoji zapis za isti targetArea
   */
  public async createTargetArea(
    compositionId: string,
    dto: CreateCompositionTargetAreaDto,
    userId: string,
  ): Promise<CompositionTargetArea> {
    // 1. Validacija da kompozicija postoji i pripada korisniku
    const composition = await this.findCompositionProvider.findOneById(
      compositionId,
      userId,
    );
    if (!composition) {
      throw new NotFoundException('Kompozicija nije pronađena');
    }

    // 2. Sprečavanje duplikata
    const existing =
      await this.findCompositionTargetAreaProvider.findOneByCompositionAndArea(
        compositionId,
        dto.targetArea,
      );
    if (existing) {
      throw new ConflictException(
        'Target area za ovu kompoziciju već postoji — ažurirajte postojeći zapis',
      );
    }

    // 3. Kreiranje i spremanje
    const newTargetArea = this.targetAreasRepository.create({
      ...dto,
      composition: { id: compositionId } as Composition,
    });

    try {
      return await this.targetAreasRepository.save(newTargetArea);
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
