import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';
import { KeySignatureType } from '../enums/key-signature-type.enum';

/**
 * DTO za kreiranje novog tonaliteta.
 *
 * Koristi se na POST /key-signatures endpointu.
 * Definira naziv (hrvatska notacija), tip (dur/mol) i temeljnu notu.
 */
export class CreateKeySignatureDto {
  /** Naziv tonaliteta u hrvatskoj notaciji — obavezno, max 50 znakova */
  @ApiProperty({
    example: 'C dur',
    description: 'Naziv tonaliteta u hrvatskoj notaciji',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name!: string;

  /** Tip tonaliteta — durski (MAJOR) ili molski (MINOR) */
  @ApiProperty({
    enum: KeySignatureType,
    example: KeySignatureType.MAJOR,
    description: 'Tip tonaliteta (MAJOR ili MINOR)',
  })
  @IsEnum(KeySignatureType)
  @IsNotEmpty()
  type!: KeySignatureType;

  /** Temeljna nota u engleskoj notaciji (C, C#, Db, ...) — obavezno, max 3 znaka */
  @ApiProperty({
    example: 'C',
    description: 'Temeljna nota tonaliteta u engleskoj notaciji',
    maxLength: 3,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(3)
  rootNote!: string;
}
