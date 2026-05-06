import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { MasteryAspect } from '../enums/mastery-aspect.enum';

/**
 * DTO za filtriranje povijesti mastery logova (FZ-R15, FZ-R16, FZ-R17).
 *
 * Svi parametri su opcionalni i kombiniraju se preko AND logike.
 * Backend dodatno filtrira po vlasništvu — vraćaju se samo logovi
 * pripadajućih kompozicija aktivnog korisnika (i logovi EXERCISE-a koji
 * su dostupni svima).
 */
export class QueryMasteryLogsDto {
  @ApiPropertyOptional({
    description: 'Filter po UUID-u kompozicije',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  compositionId?: string;

  @ApiPropertyOptional({
    description: 'Filter po aspektu naučenosti',
    enum: MasteryAspect,
  })
  @IsOptional()
  @IsEnum(MasteryAspect)
  aspect?: MasteryAspect;

  @ApiPropertyOptional({
    description: 'Filter po datumu promjene — od (ISO 8601)',
    example: '2026-01-01',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dateFrom?: Date;

  @ApiPropertyOptional({
    description: 'Filter po datumu promjene — do (ISO 8601)',
    example: '2026-12-31',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dateTo?: Date;
}
