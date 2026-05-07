import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { RecurrencePattern } from '../enums/recurrence-pattern.enum';

/**
 * DTO za POST /practice-plans.
 *
 * Tri tipa pri kreiranju (validacija u provideru):
 * 1. Jednokratni plan: isRecurring nije zadan ili false; recurrence* polja
 *    moraju biti odsutna.
 * 2. Recurring template: isRecurring=true; recurrencePattern obavezan.
 *    Ako CUSTOM — recurrenceDays obavezan.
 *
 * scheduledDate je za jednokratni plan = datum izvođenja, za template = baseDate
 * (početak perioda od kojeg se generiraju instance).
 */
export class CreatePracticePlanDto {
  @ApiProperty({ example: 'Jutarnja vježba', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ description: 'Slobodne bilješke uz plan' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiProperty({ example: '2026-05-08' })
  @IsDate()
  @Type(() => Date)
  scheduledDate!: Date;

  @ApiProperty({ minimum: 1, example: 60, description: 'Trajanje u minutama' })
  @IsInt()
  @Min(1)
  @Max(24 * 60)
  @Type(() => Number)
  durationMinutes!: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @ApiPropertyOptional({ enum: RecurrencePattern })
  @IsOptional()
  @IsEnum(RecurrencePattern)
  recurrencePattern?: RecurrencePattern;

  @ApiPropertyOptional({
    type: [Number],
    description: 'DOW brojevi 0-6 (samo kad je CUSTOM)',
    example: [1, 3, 5],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(7)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  recurrenceDays?: number[];

  @ApiPropertyOptional({ example: '2026-08-31' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  recurrenceEndDate?: Date;
}
