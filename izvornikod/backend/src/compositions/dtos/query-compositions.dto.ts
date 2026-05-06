import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CompositionType } from '../enums/composition-type.enum';

/**
 * DTO za pretragu, filtriranje i sortiranje kompozicija (FZ-R05–R07).
 *
 * Svi parametri su opcionalni i kombiniraju se preko AND logike.
 *
 * Mastery filtriranje:
 *   Mastery prosjek = (notesMastery + lyricsMastery + playingMastery) / 3.
 *   Za filter "naučene pjesme" frontend šalje minMastery=4.0.
 *   Za filter "u učenju" frontend šalje maxMastery=3.99.
 *   Oba se mogu kombinirati za precizan raspon (npr. 2.0–3.5).
 */
export class QueryCompositionsDto {
  @ApiPropertyOptional({
    description: 'Pretraga po naslovu kompozicije (case-insensitive ILIKE)',
    example: 'đelozija',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description:
      'Filter po UUID-u kategorije (M:N preko composition_category — koristi DISTINCT)',
    format: 'uuid',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Filter po UUID-u tonaliteta (FK → KeySignature)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  keySignatureId?: string;

  @ApiPropertyOptional({
    description: 'Filter po UUID-u izvođača (FK → Artist)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  artistId?: string;

  @ApiPropertyOptional({
    description: 'Filter po tipu kompozicije',
    enum: CompositionType,
    example: CompositionType.SONG,
  })
  @IsOptional()
  @IsEnum(CompositionType)
  type?: CompositionType;

  @ApiPropertyOptional({
    description:
      'Minimalni mastery prosjek (notes+lyrics+playing)/3. Npr. 4.0 = "naučene pjesme"',
    example: 4.0,
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  minMastery?: number;

  @ApiPropertyOptional({
    description:
      'Maksimalni mastery prosjek (notes+lyrics+playing)/3. Npr. 3.99 = "u učenju"',
    example: 3.99,
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  maxMastery?: number;

  @ApiPropertyOptional({
    description: 'Filter po datumu kreiranja — od (ISO 8601)',
    example: '2026-01-01',
  })
  @IsOptional()
  @Type(() => Date)
  dateFrom?: Date;

  @ApiPropertyOptional({
    description: 'Filter po datumu kreiranja — do (ISO 8601)',
    example: '2026-12-31',
  })
  @IsOptional()
  @Type(() => Date)
  dateTo?: Date;

  @ApiPropertyOptional({
    description: 'Polje za sortiranje',
    enum: ['title', 'createdAt', 'updatedAt', 'tempoBpm', 'avgMastery'],
    default: 'title',
  })
  @IsOptional()
  @IsEnum(['title', 'createdAt', 'updatedAt', 'tempoBpm', 'avgMastery'])
  sortBy?: 'title' | 'createdAt' | 'updatedAt' | 'tempoBpm' | 'avgMastery' =
    'title';

  @ApiPropertyOptional({
    description: 'Smjer sortiranja',
    enum: ['ASC', 'DESC'],
    default: 'ASC',
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'ASC';

  @ApiPropertyOptional({
    description: 'Broj stranice (1-based)',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Broj rezultata po stranici',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;
}
