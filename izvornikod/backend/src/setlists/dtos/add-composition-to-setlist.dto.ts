import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

/**
 * DTO za dodavanje kompozicije u setlistu.
 *
 * Ako position nije zadan, kompozicija se dodaje na kraj liste.
 * Ako je zadan, ostale pjesme se pomjeraju (provider rješava).
 */
export class AddCompositionToSetlistDto {
  @ApiProperty({ format: 'uuid', description: 'UUID kompozicije' })
  @IsUUID()
  compositionId!: string;

  @ApiPropertyOptional({
    description:
      'Pozicija (1-based) gdje umetnuti pjesmu; ako nije zadano, dodaje na kraj',
    example: 3,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  position?: number;
}
