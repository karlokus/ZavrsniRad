import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { CompositionFilesService } from './providers/composition-files.service';
import { UploadFileDto } from './dtos/upload-file.dto';
import { UserPayload } from '../auth/decorators/user-payload.decorator';
import { FileType } from './enums/file-type.enum';

/**
 * Kontroler za CompositionFile operacije (FZ-R08–R13).
 *
 * Upload koristi memory-storage `FileInterceptor` — file je dostupan
 * kao `Buffer` u providerima. Disk se ne pipa.
 *
 * Rute:
 * - POST /compositions/:compositionId/files (multipart) — upload
 * - GET /compositions/:compositionId/files — lista metadata pjesme
 * - GET /composition-files/:fileId — metadata + presigned URL (~5 min)
 * - GET /composition-files/:fileId/download — proxy stream
 * - DELETE /composition-files/:fileId — briše B2 objekt + DB redak
 */
@ApiTags('Composition Files')
@ApiBearerAuth('access-token')
@Controller()
export class CompositionFilesController {
  constructor(
    private readonly compositionFilesService: CompositionFilesService,
  ) {}

  @Post('compositions/:compositionId/files')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload datoteke za kompoziciju' })
  @ApiParam({
    name: 'compositionId',
    format: 'uuid',
    description: 'UUID kompozicije',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        fileType: { type: 'string', enum: Object.values(FileType) },
        instrumentId: { type: 'string', format: 'uuid' },
        description: { type: 'string' },
      },
      required: ['file', 'fileType'],
    },
  })
  @ApiResponse({ status: 201, description: 'Datoteka uspješno uploadirana' })
  @ApiResponse({ status: 400, description: 'Datoteka nije priložena' })
  @ApiResponse({ status: 403, description: 'Nemate pristup ovoj kompoziciji' })
  @ApiResponse({ status: 404, description: 'Kompozicija ili instrument nije pronađen' })
  @ApiResponse({ status: 413, description: 'Datoteka prelazi maksimum' })
  public uploadFile(
    @Param('compositionId', ParseUUIDPipe) compositionId: string,
    @UserPayload('sub') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadFileDto,
  ) {
    return this.compositionFilesService.uploadFile(
      compositionId,
      userId,
      file,
      dto,
    );
  }

  @Get('compositions/:compositionId/files')
  @ApiOperation({ summary: 'Lista datoteka kompozicije' })
  @ApiParam({ name: 'compositionId', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Lista metadata datoteka' })
  @ApiResponse({ status: 403, description: 'Nemate pristup ovoj kompoziciji' })
  @ApiResponse({ status: 404, description: 'Kompozicija nije pronađena' })
  public findAllByComposition(
    @Param('compositionId', ParseUUIDPipe) compositionId: string,
    @UserPayload('sub') userId: string,
  ) {
    return this.compositionFilesService.findAllByComposition(
      compositionId,
      userId,
    );
  }

  @Get('composition-files/:fileId')
  @ApiOperation({
    summary: 'Metadata datoteke + presigned download URL (~5 min)',
  })
  @ApiParam({ name: 'fileId', format: 'uuid' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 403, description: 'Nemate pristup ovoj datoteci' })
  @ApiResponse({ status: 404, description: 'Datoteka nije pronađena' })
  public getFileById(
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @UserPayload('sub') userId: string,
  ) {
    return this.compositionFilesService.getFileWithDownloadUrl(fileId, userId);
  }

  @Get('composition-files/:fileId/download')
  @ApiOperation({ summary: 'Proxy download — stream iz B2 kroz backend' })
  @ApiParam({ name: 'fileId', format: 'uuid' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 403, description: 'Nemate pristup ovoj datoteci' })
  @ApiResponse({ status: 404, description: 'Datoteka nije pronađena' })
  public async downloadFile(
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @UserPayload('sub') userId: string,
    @Res() res: Response,
  ) {
    const { stream, file } =
      await this.compositionFilesService.getDownloadStream(fileId, userId);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(file.fileName)}"`,
    );
    stream.pipe(res);
  }

  @Get('composition-files/:fileId/midi-data')
  @ApiOperation({
    summary:
      'Parsirani MIDI sadržaj (FZ-L01) — JSON za Tone.js vizualizaciju',
  })
  @ApiParam({ name: 'fileId', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'ParsedMidiData JSON' })
  @ApiResponse({ status: 400, description: 'Datoteka nije MIDI tipa' })
  @ApiResponse({ status: 403, description: 'Nemate pristup ovoj datoteci' })
  @ApiResponse({ status: 404, description: 'Datoteka nije pronađena' })
  public parseMidi(
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @UserPayload('sub') userId: string,
  ) {
    return this.compositionFilesService.parseMidi(fileId, userId);
  }

  @Delete('composition-files/:fileId')
  @ApiOperation({ summary: 'Brisanje datoteke (B2 + DB)' })
  @ApiParam({ name: 'fileId', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Datoteka obrisana' })
  @ApiResponse({ status: 403, description: 'Nemate pristup ovoj datoteci' })
  @ApiResponse({ status: 404, description: 'Datoteka nije pronađena' })
  public deleteFile(
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @UserPayload('sub') userId: string,
  ) {
    return this.compositionFilesService.removeFile(fileId, userId);
  }
}
