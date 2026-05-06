import {
  ForbiddenException,
  Injectable,
  RequestTimeoutException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompositionTargetArea } from '../entities/composition-target-area.entity';

/**
 * Provider za pronalaženje CompositionTargetArea zapisa.
 *
 * Vlasništvo se nasljeđuje preko parent Composition entiteta —
 * dohvaćamo zapis sa composition.user relacijom i provjeravamo
 * je li composition.user.id === userId.
 *
 * EXERCISE kompozicije nemaju vlasnika (composition.user = null),
 * pa su njihove target areas dostupne svim autenticiranim korisnicima.
 */
@Injectable()
export class FindCompositionTargetAreaProvider {
  constructor(
    @InjectRepository(CompositionTargetArea)
    private readonly targetAreasRepository: Repository<CompositionTargetArea>,
  ) {}

  /**
   * Pronalazi target area zapis po UUID-u s provjerom vlasništva.
   *
   * Dohvaća zapis zajedno s composition.user relacijom radi provjere
   * pripadnosti aktivnom korisniku.
   *
   * @param id - UUID target area zapisa
   * @param userId - UUID aktivnog korisnika iz JWT-a
   * @returns CompositionTargetArea entitet ili null ako ne postoji
   * @throws ForbiddenException ako pripadajuća kompozicija nije korisnikova
   */
  public async findOneById(
    id: string,
    userId: string,
  ): Promise<CompositionTargetArea | null> {
    const targetArea = await this.targetAreasRepository.findOne({
      where: { id },
      relations: ['composition', 'composition.user'],
    });

    if (!targetArea) return null;

    // SONG kompozicija mora pripadati aktivnom korisniku;
    // EXERCISE (composition.user = null) je dostupan svima.
    if (
      targetArea.composition.user &&
      targetArea.composition.user.id !== userId
    ) {
      throw new ForbiddenException('Nemate pristup ovom target area zapisu');
    }

    return targetArea;
  }

  /**
   * Dohvaća sve target area zapise pripadajuće kompozicije.
   *
   * Ne provjerava vlasništvo — pretpostavlja se da je pozivatelj
   * (CompositionTargetAreasService) već dohvatio i validirao kompoziciju
   * preko FindCompositionProvider.findOneById().
   *
   * @param compositionId - UUID kompozicije
   * @returns Lista target area zapisa, sortiranih po targetArea (A-Z)
   */
  public async findAllByComposition(
    compositionId: string,
  ): Promise<CompositionTargetArea[]> {
    try {
      return await this.targetAreasRepository.find({
        where: { composition: { id: compositionId } },
        order: { targetArea: 'ASC' },
      });
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

  /**
   * Provjerava postoji li već zapis za istu (compositionId, targetArea)
   * kombinaciju — koristi se za sprečavanje duplikata pri kreiranju.
   *
   * @param compositionId - UUID kompozicije
   * @param targetArea - enum vrijednost target area-a
   * @returns CompositionTargetArea entitet ili null
   */
  public async findOneByCompositionAndArea(
    compositionId: string,
    targetArea: string,
  ): Promise<CompositionTargetArea | null> {
    return this.targetAreasRepository.findOne({
      where: {
        composition: { id: compositionId },
        targetArea: targetArea as CompositionTargetArea['targetArea'],
      },
    });
  }
}
