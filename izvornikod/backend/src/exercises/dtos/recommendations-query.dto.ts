import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { TargetArea } from '../../composition-target-areas/enums/target-area.enum';

export class RecommendationsQueryDto {
  @ApiPropertyOptional({
    enum: TargetArea,
    description: 'Filter preporuka po specifičnom target area-u',
  })
  @IsOptional()
  @IsEnum(TargetArea)
  targetArea?: TargetArea;

  @ApiPropertyOptional({ minimum: 1, maximum: 50, default: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  limit?: number;
}
