import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateSetlistDto {
  @ApiProperty({ example: 'Ljetni nastup 2026', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ example: 'Repertoar za festival u Splitu' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}
