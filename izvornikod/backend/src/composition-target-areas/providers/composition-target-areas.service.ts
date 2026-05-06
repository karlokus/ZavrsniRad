import { Injectable, NotFoundException } from '@nestjs/common';
import { CompositionTargetArea } from '../entities/composition-target-area.entity';
import { CreateCompositionTargetAreaDto } from '../dtos/create-composition-target-area.dto';
import { UpdateCompositionTargetAreaDto } from '../dtos/update-composition-target-area.dto';
import { CreateCompositionTargetAreaProvider } from './create-composition-target-area.provider';
import { FindCompositionTargetAreaProvider } from './find-composition-target-area.provider';
import { UpdateCompositionTargetAreaProvider } from './update-composition-target-area.provider';
import { DeleteCompositionTargetAreaProvider } from './delete-composition-target-area.provider';
import { FindCompositionProvider } from '../../compositions/providers/find-composition.provider';

/**
 * Fasadni servis za upravljanje CompositionTargetArea zapisima (FZ-L11, FZ-L12).
 *
 * Delegira logiku na specijalizirane providere. Sve operacije nasljeđuju
 * vlasništvo preko parent Composition entiteta.
 */
@Injectable()
export class CompositionTargetAreasService {
  constructor(
    private readonly createProvider: CreateCompositionTargetAreaProvider,
    private readonly findProvider: FindCompositionTargetAreaProvider,
    private readonly updateProvider: UpdateCompositionTargetAreaProvider,
    private readonly deleteProvider: DeleteCompositionTargetAreaProvider,
    private readonly findCompositionProvider: FindCompositionProvider,
  ) {}

  /**
   * Kreira novi target area zapis za kompoziciju.
   */
  public createTargetArea(
    compositionId: string,
    dto: CreateCompositionTargetAreaDto,
    userId: string,
  ): Promise<CompositionTargetArea> {
    return this.createProvider.createTargetArea(compositionId, dto, userId);
  }

  /**
   * Dohvaća sve target area zapise pripadajuće kompozicije.
   *
   * Validira pristup kompoziciji preko FindCompositionProvider
   * (baca ForbiddenException za tuđe SONG-ove).
   */
  public async findAllByComposition(
    compositionId: string,
    userId: string,
  ): Promise<CompositionTargetArea[]> {
    const composition = await this.findCompositionProvider.findOneById(
      compositionId,
      userId,
    );
    if (!composition) {
      throw new NotFoundException('Kompozicija nije pronađena');
    }
    return this.findProvider.findAllByComposition(compositionId);
  }

  /**
   * Ažurira target area zapis (samo difficultyLevel i weightPercentage).
   */
  public updateTargetArea(
    id: string,
    dto: UpdateCompositionTargetAreaDto,
    userId: string,
  ): Promise<CompositionTargetArea> {
    return this.updateProvider.updateTargetArea(id, dto, userId);
  }

  /**
   * Briše target area zapis.
   */
  public removeTargetArea(
    id: string,
    userId: string,
  ): Promise<{ deleted: boolean; id: string }> {
    return this.deleteProvider.deleteTargetArea(id, userId);
  }
}
