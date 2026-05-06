import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNumber, Max, Min } from 'class-validator';
import { TargetArea } from '../enums/target-area.enum';

/**
 * DTO za kreiranje novog CompositionTargetArea zapisa.
 *
 * compositionId se ne nalazi u tijelu — čita se iz URL parametra
 * (POST /compositions/:compositionId/target-areas).
 */
export class CreateCompositionTargetAreaDto {
  @ApiProperty({
    description: 'Aspekt sviranja koji se trenira',
    enum: TargetArea,
    example: TargetArea.RHYTHM,
  })
  @IsEnum(TargetArea)
  targetArea!: TargetArea;

  @ApiProperty({
    description: 'Razina težine (1-10)',
    example: 5,
    minimum: 1,
    maximum: 10,
  })
  @IsInt()
  @Min(1)
  @Max(10)
  @Type(() => Number)
  difficultyLevel!: number;

  @ApiProperty({
    description: 'Postotak doprinosa kompozicije ovom target area-u (0-100)',
    example: 33.33,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  @Type(() => Number)
  weightPercentage!: number;
}
