import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * DTO za kreiranje novog instrumenta.
 *
 * Koristi se na POST /instruments endpointu.
 * Validira naziv instrumenta — obavezno polje, max 100 znakova.
 */
export class CreateInstrumentDto {
  /** Naziv instrumenta — obavezno, max 100 znakova */
  @ApiProperty({
    example: 'Gitara',
    description: 'Naziv instrumenta',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  instrumentName!: string;
}
