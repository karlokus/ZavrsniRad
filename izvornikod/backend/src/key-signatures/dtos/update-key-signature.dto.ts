import { PartialType } from '@nestjs/swagger';
import { CreateKeySignatureDto } from './create-key-signature.dto';

/**
 * DTO za ažuriranje tonaliteta.
 *
 * Nasljeđuje sva polja iz CreateKeySignatureDto.
 * Sva polja su opcionalna zahvaljujući PartialType wrapperu.
 *
 * Dostupna polja: name?, type?, rootNote?
 */
export class UpdateKeySignatureDto extends PartialType(
  CreateKeySignatureDto,
) {}
