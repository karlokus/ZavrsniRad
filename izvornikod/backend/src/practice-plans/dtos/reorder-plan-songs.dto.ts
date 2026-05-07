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

export class ReorderPlanSongItemDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  compositionId!: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  position!: number;
}

export class ReorderPlanSongsDto {
  @ApiProperty({ type: [ReorderPlanSongItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReorderPlanSongItemDto)
  items!: ReorderPlanSongItemDto[];
}
