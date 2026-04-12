import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SkillLevel } from '../enums/skill-level.enum';

/**
 * DTO za registraciju novog korisnika (sign-up).
 *
 * Koristi se na POST /auth/sign-up endpointu. Validira sve obavezne podatke
 * za kreiranje korisničkog računa i opcionale dodatne informacije.
 * Lozinka mora zadovoljiti sigurnosne zahtjeve (veliko slovo, malo slovo, broj, specijalni znak).
 */
export class CreateUserDto {
  /** Ime korisnika — obavezno, max 100 znakova */
  @ApiProperty({
    example: 'Ivan',
    maxLength: 100,
    description: 'Ime korisnika',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName!: string;

  /** Prezime korisnika — obavezno, max 100 znakova */
  @ApiProperty({
    example: 'Horvat',
    maxLength: 100,
    description: 'Prezime korisnika',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName!: string;

  /** Email adresa — obavezna, mora biti valjani email format, max 255 znakova */
  @ApiProperty({
    example: 'ivan.horvat@email.com',
    description: 'Email adresa korisnika',
  })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  email!: string;

  /**
   * Lozinka korisnika — obavezna, min 8 znakova, max 96 znakova.
   * Mora sadržavati: veliko slovo, malo slovo, broj i specijalni znak (@$!%*?&).
   * Hashira se putem BcryptProvider-a prije spremanja u bazu.
   */
  @ApiProperty({
    example: 'StrongPassword123!',
    minLength: 8,
    maxLength: 96,
    description:
      'Lozinka korisnika (min. 8 znakova, mora sadržavati veliko slovo, malo slovo, broj i specijalni znak)',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(96)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    {
      message:
        'Lozinka mora sadržavati minimalno 8 znakova, jedno veliko slovo, jedno malo slovo, jedan broj i jedan specijalni znak (@$!%*?&)',
    },
  )
  password!: string;

  /** UUID instrumenta koji korisnik svira — opcionalano, šalje se samo ako korisnik želi odabrati instrument */
  @ApiPropertyOptional({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'UUID instrumenta koji korisnik svira',
  })
  @IsOptional()
  @IsUUID()
  instrumentId?: string;

  /** Razina sviranja korisnika — opcionalna, može se postaviti naknadno */
  @ApiPropertyOptional({
    enum: SkillLevel,
    example: SkillLevel.BEGINNER,
    description: 'Razina sviranja korisnika',
  })
  @IsOptional()
  @IsEnum(SkillLevel)
  skillLevel?: SkillLevel;
}
