import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

/**
 * DTO za postavljanje kategorija na kompoziciju.
 *
 * PUT semantika — zamjenjuje cijeli set kategorija odjednom.
 * Prazan array uklanja sve kategorije s kompozicije.
 *
 * Validacija vlasništva kategorija odvija se u provideru,
 * ne u DTO-u — korisnik smije pridružiti samo vlastite kategorije.
 */
export class SetCategoriesDto {
  /** Lista UUID-ova kategorija za pridruživanje kompoziciji */
  @ApiProperty({
    description: 'Lista UUID-ova kategorija za pridruživanje kompoziciji',
    example: ['550e8400-e29b-41d4-a716-446655440000'],
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  categoryIds!: string[];
}
