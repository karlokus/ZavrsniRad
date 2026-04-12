import { PartialType } from '@nestjs/swagger';
import { CreateCategoryDto } from './create-category.dto';

/**
 * DTO za ažuriranje kategorije pjesama.
 *
 * Nasljeđuje sva polja iz CreateCategoryDto.
 * Sva polja su opcionalna zahvaljujući PartialType wrapperu.
 *
 * Dostupna polja: name?, color?
 */
export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
