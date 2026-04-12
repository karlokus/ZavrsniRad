import { PartialType } from '@nestjs/swagger';
import { CreateArtistDto } from './create-artist.dto';

/**
 * DTO za ažuriranje izvođača.
 *
 * Nasljeđuje sva polja iz CreateArtistDto.
 * Sva polja su opcionalna zahvaljujući PartialType wrapperu.
 *
 * Dostupna polja: name?
 */
export class UpdateArtistDto extends PartialType(CreateArtistDto) {}
