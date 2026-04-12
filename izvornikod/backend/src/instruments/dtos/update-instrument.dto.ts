import { PartialType } from '@nestjs/swagger';
import { CreateInstrumentDto } from './create-instrument.dto';

/**
 * DTO za ažuriranje instrumenta.
 *
 * Nasljeđuje sva polja iz CreateInstrumentDto.
 * Sva polja su opcionalna zahvaljujući PartialType wrapperu.
 *
 * Dostupna polja: instrumentName?
 */
export class UpdateInstrumentDto extends PartialType(CreateInstrumentDto) {}
