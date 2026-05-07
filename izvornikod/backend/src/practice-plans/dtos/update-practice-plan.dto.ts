import { OmitType, PartialType } from '@nestjs/swagger';
import { CreatePracticePlanDto } from './create-practice-plan.dto';

/**
 * Update DTO — sva polja optional, ali nije moguće mijenjati semantiku
 * recurrence-a kroz PATCH (ako trebaš drugi obrazac, obriši i kreiraj novi
 * template). Zato se izuzimaju recurrence* i isRecurring.
 */
export class UpdatePracticePlanDto extends PartialType(
  OmitType(CreatePracticePlanDto, [
    'isRecurring',
    'recurrencePattern',
    'recurrenceDays',
    'recurrenceEndDate',
  ] as const),
) {}
