import { PartialType } from '@nestjs/swagger';
import { CreateCompositionDto } from './create-composition.dto';

/**
 * DTO za ažuriranje kompozicije.
 *
 * Sva polja su opcionalna (PartialType automatski dodaje @IsOptional()).
 * Samo proslijeđena polja se ažuriraju — ostala zadržavaju postojeće vrijednosti.
 */
export class UpdateCompositionDto extends PartialType(CreateCompositionDto) {}
