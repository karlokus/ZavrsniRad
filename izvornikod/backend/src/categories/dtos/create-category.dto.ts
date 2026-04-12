import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

/**
 * DTO za kreiranje nove kategorije pjesama.
 *
 * Koristi se na POST /categories endpointu.
 * Naziv je obavezan, boja je opcionalna u HEX formatu (#RRGGBB).
 */
export class CreateCategoryDto {
  /** Naziv kategorije — obavezno, max 100 znakova */
  @ApiProperty({
    example: 'Rock',
    description: 'Naziv kategorije',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  /**
   * Boja kategorije u HEX formatu — opcionalno.
   * Mora biti u formatu #RRGGBB (npr. "#FF5733").
   */
  @ApiPropertyOptional({
    example: '#FF5733',
    description: 'Boja kategorije u HEX formatu (#RRGGBB)',
  })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'Boja mora biti u HEX formatu (#RRGGBB), npr. "#FF5733"',
  })
  color?: string;
}
