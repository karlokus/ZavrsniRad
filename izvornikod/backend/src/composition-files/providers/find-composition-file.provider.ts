import {
  ForbiddenException,
  Injectable,
  RequestTimeoutException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompositionFile } from '../entities/composition-file.entity';
import { CompositionType } from '../../compositions/enums/composition-type.enum';

/**
 * Provider za dohvat CompositionFile zapisa.
 *
 * Vlasništvo se nasljeđuje preko parent Composition entiteta.
 * EXERCISE kompozicije nemaju vlasnika i njihove datoteke su dostupne svima.
 */
@Injectable()
export class FindCompositionFileProvider {
  constructor(
    @InjectRepository(CompositionFile)
    private readonly filesRepository: Repository<CompositionFile>,
  ) {}

  /**
   * Pronalazi datoteku po ID-u s provjerom vlasništva.
   */
  public async findOneById(
    id: string,
    userId: string,
  ): Promise<CompositionFile | null> {
    const file = await this.filesRepository.findOne({
      where: { id },
      relations: ['composition', 'composition.user', 'instrument'],
    });
    if (!file) return null;

    if (
      file.composition.type === CompositionType.SONG &&
      file.composition.user?.id !== userId
    ) {
      throw new ForbiddenException('Nemate pristup ovoj datoteci');
    }
    return file;
  }

  /**
   * Lista datoteka pripadajuće kompozicije, sortirano kronološki ASC.
   * Pretpostavka: pozivatelj je već validirao pristup parent kompoziciji.
   */
  public async findAllByComposition(
    compositionId: string,
  ): Promise<CompositionFile[]> {
    try {
      return await this.filesRepository.find({
        where: { composition: { id: compositionId } },
        relations: ['instrument'],
        order: { uploadedAt: 'ASC' },
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
}
