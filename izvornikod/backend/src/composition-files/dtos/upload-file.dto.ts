import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { FileType } from '../enums/file-type.enum';

/**
 * DTO za multipart upload — dolazi uz `file` polje (binarno) iz forme.
 *
 * Validacija binarne datoteke (mime, veličina) se izvodi u providerima
 * jer ne ide kroz DTO transformaciju.
 */
export class UploadFileDto {
  @ApiProperty({
    description: 'Tip datoteke',
    enum: FileType,
    example: FileType.SHEET_IMAGE,
  })
  @IsEnum(FileType)
  fileType!: FileType;

  @ApiPropertyOptional({
    description: 'UUID instrumenta (FK → Instrument), ako je datoteka instrument-specifična',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  instrumentId?: string;

  @ApiPropertyOptional({
    description: 'Slobodan opis datoteke',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
