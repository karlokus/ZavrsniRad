import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

/**
 * DTO za filtriranje i pretraživanje kategorija.
 *
 * Placeholder za buduće pretraživanje — trenutno podržava
 * filtriranje po nazivu kategorije.
 */
export class QueryCategoriesDto {
  /** Filtriranje po nazivu kategorije — opcionalno, parcijalno podudaranje */
  @ApiPropertyOptional({
    example: 'Rock',
    description: 'Filtriranje po nazivu kategorije',
  })
  @IsOptional()
  @IsString()
  name?: string;
}
