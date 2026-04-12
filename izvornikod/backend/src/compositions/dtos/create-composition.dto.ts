import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * DTO za kreiranje nove kompozicije (SONG).
 *
 * Ne sadrži userId ni type — oba se postavljaju server-side:
 * - userId iz JWT payloada (@UserPayload('sub'))
 * - type je uvijek SONG (EXERCISE se ne kreira preko API-ja)
 */
export class CreateCompositionDto {
  @ApiProperty({
    example: 'Đelozija',
    description: 'Naziv kompozicije',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @ApiPropertyOptional({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'UUID izvođača (FK → Artist)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  artistId?: string;

  @ApiPropertyOptional({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'UUID tonaliteta (FK → KeySignature)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  keySignatureId?: string;

  @ApiPropertyOptional({
    example: 120,
    description: 'Tempo u BPM (20-300)',
    minimum: 20,
    maximum: 300,
  })
  @IsOptional()
  @IsInt()
  @Min(20)
  @Max(300)
  tempoBpm?: number;

  @ApiPropertyOptional({
    example: 'Klasična dalmatinska pjesma, naučiti do ljeta.',
    description: 'Dodatne bilješke o kompoziciji',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    description: 'YouTube link na originalnu izvedbu',
    maxLength: 500,
  })
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  youtubeSongUrl?: string;

  @ApiPropertyOptional({
    example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    description: 'YouTube link na instrumentalnu verziju',
    maxLength: 500,
  })
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  youtubeInstrumentUrl?: string;

  @ApiPropertyOptional({
    example: 3,
    description: 'Status naučenosti nota (1-5)',
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  notesMastery?: number;

  @ApiPropertyOptional({
    example: 2,
    description: 'Status naučenosti riječi (1-5)',
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  lyricsMastery?: number;

  @ApiPropertyOptional({
    example: 4,
    description: 'Status naučenosti sviranja (1-5)',
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  playingMastery?: number;
}
