import {
  BadRequestException,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { CompositionFile } from '../entities/composition-file.entity';
import { UploadFileDto } from '../dtos/upload-file.dto';
import { FileStorageProvider } from './file-storage.provider';
import { FindCompositionProvider } from '../../compositions/providers/find-composition.provider';
import { FindInstrumentProvider } from '../../instruments/providers/find-instrument.provider';
import { Composition } from '../../compositions/entities/composition.entity';
import { Instrument } from '../../instruments/entities/instrument.entity';

/**
 * Provider za kreiranje novog CompositionFile zapisa s uploadom u B2.
 *
 * Flow:
 * 1. Validira veličinu i prisutnost datoteke
 * 2. Validira parent kompoziciju (vlasništvo) i opcionalni Instrument
 * 3. Generira jedinstveni objectKey: `{userId}/{compositionId}/{uuid}-{filename}`
 * 4. Upload u B2
 * 5. Sprema metadata u DB; ako spremanje padne — briše B2 objekt (rollback)
 */
@Injectable()
export class CreateCompositionFileProvider {
  constructor(
    @InjectRepository(CompositionFile)
    private readonly filesRepository: Repository<CompositionFile>,

    private readonly fileStorageProvider: FileStorageProvider,
    private readonly findCompositionProvider: FindCompositionProvider,
    private readonly findInstrumentProvider: FindInstrumentProvider,
    private readonly configService: ConfigService,
  ) {}

  public async upload(
    compositionId: string,
    userId: string,
    file: Express.Multer.File | undefined,
    dto: UploadFileDto,
  ): Promise<CompositionFile> {
    if (!file) {
      throw new BadRequestException('Datoteka nije priložena (polje "file")');
    }

    // Validacija veličine
    const maxSizeMb = this.configService.getOrThrow<number>(
      'storage.maxFileSizeMb',
    );
    if (file.size > maxSizeMb * 1024 * 1024) {
      throw new PayloadTooLargeException(
        `Datoteka prelazi maksimum od ${maxSizeMb} MB`,
      );
    }

    // Validacija parent kompozicije i vlasništva (baca Forbidden ako tuđa)
    const composition = await this.findCompositionProvider.findOneById(
      compositionId,
      userId,
    );
    if (!composition) {
      throw new NotFoundException('Kompozicija nije pronađena');
    }

    // Opcionalna validacija instrumenta
    if (dto.instrumentId) {
      const instrument = await this.findInstrumentProvider.findOneById(
        dto.instrumentId,
      );
      if (!instrument) {
        throw new NotFoundException('Instrument nije pronađen');
      }
    }

    // Generiranje object key-a
    const safeFileName = file.originalname.replace(/[^A-Za-z0-9._-]/g, '_');
    const objectKey = `${userId}/${compositionId}/${randomUUID()}-${safeFileName}`;

    // Upload u B2 prije DB inserta
    await this.fileStorageProvider.upload(
      objectKey,
      file.buffer,
      file.mimetype,
    );

    // Spremanje metadata; ako padne, rollback B2 objekt
    try {
      const entity = this.filesRepository.create({
        composition: { id: compositionId } as Composition,
        instrument: dto.instrumentId
          ? ({ id: dto.instrumentId } as Instrument)
          : null,
        fileType: dto.fileType,
        fileName: file.originalname,
        objectKey,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        description: dto.description ?? null,
      });
      return await this.filesRepository.save(entity);
    } catch (error) {
      // Rollback B2 — ne ostavlja "siroče" objekt
      await this.fileStorageProvider.delete(objectKey);
      throw error;
    }
  }
}
