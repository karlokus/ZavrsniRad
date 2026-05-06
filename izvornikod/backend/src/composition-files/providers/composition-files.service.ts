import { Injectable, NotFoundException } from '@nestjs/common';
import { CompositionFile } from '../entities/composition-file.entity';
import { UploadFileDto } from '../dtos/upload-file.dto';
import { CreateCompositionFileProvider } from './create-composition-file.provider';
import { FindCompositionFileProvider } from './find-composition-file.provider';
import { DeleteCompositionFileProvider } from './delete-composition-file.provider';
import { FileStorageProvider } from './file-storage.provider';
import { FindCompositionProvider } from '../../compositions/providers/find-composition.provider';
import { Readable } from 'stream';

/**
 * Fasadni servis za CompositionFile operacije (FZ-R08–R13).
 */
@Injectable()
export class CompositionFilesService {
  constructor(
    private readonly createProvider: CreateCompositionFileProvider,
    private readonly findProvider: FindCompositionFileProvider,
    private readonly deleteProvider: DeleteCompositionFileProvider,
    private readonly fileStorageProvider: FileStorageProvider,
    private readonly findCompositionProvider: FindCompositionProvider,
  ) {}

  public uploadFile(
    compositionId: string,
    userId: string,
    file: Express.Multer.File | undefined,
    dto: UploadFileDto,
  ): Promise<CompositionFile> {
    return this.createProvider.upload(compositionId, userId, file, dto);
  }

  /**
   * Lista datoteka pjesme — validira pristup parent kompoziciji.
   */
  public async findAllByComposition(
    compositionId: string,
    userId: string,
  ): Promise<CompositionFile[]> {
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
   * Vraća metadata + presigned download URL valjan ~5 min.
   */
  public async getFileWithDownloadUrl(
    fileId: string,
    userId: string,
  ): Promise<CompositionFile & { downloadUrl: string }> {
    const file = await this.findProvider.findOneById(fileId, userId);
    if (!file) {
      throw new NotFoundException('Datoteka nije pronađena');
    }
    const downloadUrl = await this.fileStorageProvider.getSignedDownloadUrl(
      file.objectKey,
      file.fileName,
    );
    return Object.assign(file, { downloadUrl });
  }

  /**
   * Vraća stream za proxy download endpoint.
   */
  public async getDownloadStream(
    fileId: string,
    userId: string,
  ): Promise<{
    stream: Readable;
    file: CompositionFile;
  }> {
    const file = await this.findProvider.findOneById(fileId, userId);
    if (!file) {
      throw new NotFoundException('Datoteka nije pronađena');
    }
    const { stream } = await this.fileStorageProvider.getStream(file.objectKey);
    return { stream, file };
  }

  public removeFile(
    fileId: string,
    userId: string,
  ): Promise<{ deleted: boolean; id: string }> {
    return this.deleteProvider.delete(fileId, userId);
  }
}
