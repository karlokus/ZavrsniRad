import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsNumber,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

/**
 * DTO za ručni unos sesije vježbanja (FZ-L07).
 *
 * userId se postavlja iz JWT-a; sve ostale vrijednosti dolaze iz tijela.
 */
export class CreatePracticeSessionDto {
  @ApiProperty({ format: 'uuid', description: 'UUID kompozicije' })
  @IsUUID()
  compositionId!: string;

  @ApiProperty({ minimum: 0, maximum: 100, example: 87.5 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  @Type(() => Number)
  noteAccuracy!: number;

  @ApiProperty({ minimum: 0, maximum: 100, example: 92.0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  @Type(() => Number)
  rhythmAccuracy!: number;

  @ApiProperty({ minimum: 0, maximum: 100, example: 85.25 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  @Type(() => Number)
  tempoStability!: number;

  @ApiProperty({ minimum: 20, maximum: 300, example: 120 })
  @IsInt()
  @Min(20)
  @Max(300)
  @Type(() => Number)
  tempoBpm!: number;

  @ApiProperty({ minimum: 0, example: 1800, description: 'Trajanje u sekundama' })
  @IsInt()
  @Min(0)
  @Type(() => Number)
  durationSeconds!: number;

  @ApiProperty({ example: '2026-05-06T10:00:00Z' })
  @IsDate()
  @Type(() => Date)
  startedAt!: Date;

  @ApiProperty({ example: '2026-05-06T10:30:00Z' })
  @IsDate()
  @Type(() => Date)
  completedAt!: Date;
}
