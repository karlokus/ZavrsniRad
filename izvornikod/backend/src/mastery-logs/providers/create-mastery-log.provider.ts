import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MasteryLog } from '../entities/mastery-log.entity';
import { MasteryAspect } from '../enums/mastery-aspect.enum';
import { Composition } from '../../compositions/entities/composition.entity';

/**
 * Internal provider — kreira MasteryLog zapis pri promjeni mastery polja.
 *
 * Poziva ga {@link UpdateCompositionProvider} unutar update flow-a.
 * NIJE eksponiran preko API-ja — povijest je append-only iz pozadine.
 *
 * Defenzivno: greške pri logiranju se tiho gutaju i logiraju jer ne smiju
 * blokirati glavni update operativni tok (korisnikov save kompozicije
 * mora proći iako audit log padne).
 */
@Injectable()
export class CreateMasteryLogProvider {
  private readonly logger = new Logger(CreateMasteryLogProvider.name);

  constructor(
    @InjectRepository(MasteryLog)
    private readonly masteryLogsRepository: Repository<MasteryLog>,
  ) {}

  /**
   * Kreira jedan log zapis za promjenu jednog aspekta.
   *
   * Pretpostavlja da je pozivatelj već usporedio staru i novu vrijednost
   * i utvrdio da su različite — provider ne provjerava razliku ovdje.
   *
   * @param compositionId - UUID kompozicije
   * @param aspect - aspekt koji se mijenja
   * @param oldValue - prethodna vrijednost (1-5)
   * @param newValue - nova vrijednost (1-5)
   */
  public async log(
    compositionId: string,
    aspect: MasteryAspect,
    oldValue: number,
    newValue: number,
  ): Promise<void> {
    try {
      const entry = this.masteryLogsRepository.create({
        composition: { id: compositionId } as Composition,
        aspect,
        oldValue,
        newValue,
      });
      await this.masteryLogsRepository.save(entry);
    } catch (error: unknown) {
      // Audit log greška ne smije srušiti glavni update operativni tok
      this.logger.error(
        `Failed to write MasteryLog (compositionId=${compositionId}, aspect=${aspect}): ${(error as Error).message}`,
      );
    }
  }

  /**
   * Helper koji za zadanu kompoziciju usporedi sva tri mastery polja
   * (stari i novi entitet) i kreira logove za sve aspekte koji su se
   * promijenili. Pojednostavljuje poziv iz UpdateCompositionProvider-a.
   *
   * @param compositionId - UUID kompozicije
   * @param oldMastery - vrijednosti prije save-a (smije imati undefined)
   * @param newMastery - vrijednosti nakon merge-a iz DTO-a (smije imati undefined)
   */
  public async logChanges(
    compositionId: string,
    oldMastery: {
      notes?: number;
      lyrics?: number;
      playing?: number;
    },
    newMastery: {
      notes?: number;
      lyrics?: number;
      playing?: number;
    },
  ): Promise<void> {
    const pairs: Array<[MasteryAspect, number | undefined, number | undefined]> = [
      [MasteryAspect.NOTES, oldMastery.notes, newMastery.notes],
      [MasteryAspect.LYRICS, oldMastery.lyrics, newMastery.lyrics],
      [MasteryAspect.PLAYING, oldMastery.playing, newMastery.playing],
    ];

    for (const [aspect, oldV, newV] of pairs) {
      if (
        oldV !== undefined &&
        newV !== undefined &&
        oldV !== newV
      ) {
        await this.log(compositionId, aspect, oldV, newV);
      }
    }
  }
}
