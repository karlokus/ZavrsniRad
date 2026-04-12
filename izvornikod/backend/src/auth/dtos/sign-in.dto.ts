import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO za prijavu korisnika (sign-in).
 *
 * Validira email i lozinku koje korisnik šalje na POST /auth/sign-in.
 * SignInProvider koristi ove podatke za autentikaciju i generiranje JWT tokena.
 */
export class SignInDto {
  /** Email adresa korisnika za prijavu */
  @ApiProperty({
    example: 'ivan.horvat@email.com',
    description: 'Email adresa korisnika',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  /** Lozinka korisnika u čistom tekstu — uspoređuje se s hashiranom verzijom u bazi */
  @ApiProperty({
    example: 'StrongPassword123!',
    description: 'Lozinka korisnika',
  })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
