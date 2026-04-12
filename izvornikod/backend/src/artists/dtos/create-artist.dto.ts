import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * DTO za kreiranje novog izvođača.
 *
 * Koristi se na POST /artists endpointu.
 * Naziv je denormaliziran — može biti "Prezime Ime" ili naziv benda.
 */
export class CreateArtistDto {
  /** Naziv izvođača — obavezno, max 200 znakova */
  @ApiProperty({
    example: 'Oliver Dragojević',
    description: 'Naziv izvođača (ime i prezime ili naziv benda)',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;
}
