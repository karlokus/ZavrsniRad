import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class ReorderItemDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  compositionId!: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  position!: number;
}

/**
 * DTO za reorder endpoint — lista (compositionId, position) parova
 * koja predstavlja **kompletni** novi redoslijed setliste.
 *
 * Provider validira:
 * - svi compositionId-evi su zaista u setlisti
 * - lista pokriva SVE postojeće pjesme (ne smije izostaviti niti jednu)
 * - pozicije su jedinstvene
 */
export class ReorderSetlistDto {
  @ApiProperty({ type: [ReorderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReorderItemDto)
  items!: ReorderItemDto[];
}
