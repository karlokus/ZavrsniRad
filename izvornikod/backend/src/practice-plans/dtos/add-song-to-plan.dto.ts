import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class AddSongToPlanDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  compositionId!: string;

  @ApiPropertyOptional({ minimum: 1, example: 2 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  position?: number;
}
