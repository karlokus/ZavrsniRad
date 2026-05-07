import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsIn, IsOptional } from 'class-validator';

/**
 * Napomena za isCompleted: koristimo string union ('true'|'false') umjesto
 * boolean DTO tipa jer ValidationPipe ima `enableImplicitConversion: true`
 * koji bi `'false'` cast-irao u boolean `true` (jer Boolean('false') = true)
 * prije nego @Transform stigne. Provider ručno parsa string u boolean.
 */
export class QueryPracticePlansDto {
  @ApiPropertyOptional({ example: '2026-05-01' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dateFrom?: Date;

  @ApiPropertyOptional({ example: '2026-05-31' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dateTo?: Date;

  @ApiPropertyOptional({ enum: ['true', 'false'] })
  @IsOptional()
  @IsIn(['true', 'false'])
  isCompleted?: 'true' | 'false';
}
