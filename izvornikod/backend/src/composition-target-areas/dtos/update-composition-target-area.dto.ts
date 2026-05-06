import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateCompositionTargetAreaDto } from './create-composition-target-area.dto';

/**
 * DTO za ažuriranje CompositionTargetArea zapisa.
 *
 * Sva polja CreateCompositionTargetAreaDto-a su opcionalna OSIM targetArea —
 * targetArea ne mijenja se nakon kreiranja (semantika se promijeni;
 * ako korisnik želi drugu vrstu, briše ovaj zapis i kreira novi).
 * Ažuriraju se samo difficultyLevel i weightPercentage.
 */
export class UpdateCompositionTargetAreaDto extends PartialType(
  OmitType(CreateCompositionTargetAreaDto, ['targetArea'] as const),
) {}
