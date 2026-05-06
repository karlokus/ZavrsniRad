import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompositionTargetArea } from '../entities/composition-target-area.entity';
import { FindCompositionTargetAreaProvider } from './find-composition-target-area.provider';

/**
 * Provider za brisanje CompositionTargetArea zapisa.
 *
 * Provjerava vlasništvo preko FindCompositionTargetAreaProvider
 * (baca ForbiddenException ako pripadajuća kompozicija nije korisnikova).
 */
@Injectable()
export class DeleteCompositionTargetAreaProvider {
  constructor(
    @InjectRepository(CompositionTargetArea)
    private readonly targetAreasRepository: Repository<CompositionTargetArea>,

    private readonly findCompositionTargetAreaProvider: FindCompositionTargetAreaProvider,
  ) {}

  /**
   * Briše target area zapis po UUID-u.
   *
   * @param id - UUID target area zapisa
   * @param userId - UUID aktivnog korisnika iz JWT-a
   * @returns Objekt s oznakom uspješnosti i ID-em obrisanog zapisa
   * @throws NotFoundException ako zapis ne postoji
   * @throws ForbiddenException ako kompozicija nije korisnikova
   */
  public async deleteTargetArea(
    id: string,
    userId: string,
  ): Promise<{ deleted: boolean; id: string }> {
    const targetArea = await this.findCompositionTargetAreaProvider.findOneById(
      id,
      userId,
    );
    if (!targetArea) {
      throw new NotFoundException('Target area zapis nije pronađen');
    }

    const result = await this.targetAreasRepository.delete(id);
    return { deleted: (result.affected ?? 0) > 0, id };
  }
}
