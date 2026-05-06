import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompositionFile } from '../entities/composition-file.entity';
import { FileStorageProvider } from './file-storage.provider';
import { FindCompositionFileProvider } from './find-composition-file.provider';

/**
 * Provider za brisanje CompositionFile zapisa + B2 objekta.
 *
 * Redoslijed operacija (transaction-like):
 * 1. Validacija vlasništva
 * 2. DELETE B2 objekta — ako ne uspije, FileStorageProvider.delete()
 *    samo loga i ne baca (idempotentno)
 * 3. DELETE DB redka — autoritativan izvor
 *
 * Ako DB delete padne nakon B2 delete-a, korisnik vidi grešku ali
 * ima nedostupan zapis (sirotanski metadata bez sadržaja).
 * Defenzivno: ako se to dogodi, sljedeći DELETE pokušaj ipak uspjeti
 * jer FindCompositionFileProvider još uvijek vidi DB redak.
 */
@Injectable()
export class DeleteCompositionFileProvider {
  constructor(
    @InjectRepository(CompositionFile)
    private readonly filesRepository: Repository<CompositionFile>,

    private readonly findProvider: FindCompositionFileProvider,
    private readonly fileStorageProvider: FileStorageProvider,
  ) {}

  public async delete(
    id: string,
    userId: string,
  ): Promise<{ deleted: boolean; id: string }> {
    const file = await this.findProvider.findOneById(id, userId);
    if (!file) {
      throw new NotFoundException('Datoteka nije pronađena');
    }

    await this.fileStorageProvider.delete(file.objectKey);

    const result = await this.filesRepository.delete(id);
    return { deleted: (result.affected ?? 0) > 0, id };
  }
}
