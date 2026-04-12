import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

/**
 * DTO za promjenu lozinke korisnika (FZ-U04).
 *
 * Korisnik mora poslati trenutnu lozinku (oldPassword) za verifikaciju
 * i novu lozinku (newPassword) koja mora zadovoljiti iste sigurnosne
 * zahtjeve kao i lozinka pri registraciji.
 */
export class ChangePasswordDto {
  /** Trenutna lozinka korisnika — koristi se za verifikaciju identiteta */
  @ApiProperty({
    description: 'Trenutna lozinka korisnika',
    example: 'StaraLozinka123!',
  })
  @IsString()
  @IsNotEmpty({ message: 'Trenutna lozinka je obavezna' })
  oldPassword!: string;

  /**
   * Nova lozinka — mora zadovoljiti sigurnosne zahtjeve:
   * min 8 znakova, veliko slovo, malo slovo, broj i specijalni znak.
   */
  @ApiProperty({
    description: 'Nova lozinka korisnika (min 8 znakova)',
    example: 'NovaLozinka456!',
  })
  @IsString()
  @IsNotEmpty({ message: 'Nova lozinka je obavezna' })
  @MinLength(8, { message: 'Nova lozinka mora imati najmanje 8 znakova' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    {
      message:
        'Nova lozinka mora sadržavati veliko slovo, malo slovo, broj i specijalni znak (@$!%*?&)',
    },
  )
  newPassword!: string;
}
