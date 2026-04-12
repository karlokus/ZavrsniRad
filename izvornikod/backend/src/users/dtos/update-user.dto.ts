import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

/**
 * DTO za ažuriranje korisničkog profila.
 *
 * Nasljeđuje sva polja iz CreateUserDto osim password i email
 * (lozinka se mijenja putem zasebnog endpointa, email se ne može promijeniti).
 * Sva polja su opcionalna zahvaljujući PartialType wrapperu.
 *
 * Dostupna polja: firstName?, lastName?, instrumentId?, skillLevel?
 */
export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password', 'email'] as const),
) {}
