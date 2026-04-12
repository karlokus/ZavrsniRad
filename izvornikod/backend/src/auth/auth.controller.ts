import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './providers/auth.service';
import { SignInDto } from './dtos/sign-in.dto';
import { RefreshTokenDto } from './dtos/refresh-token.dto';
import { Auth } from './decorators/auth.decorator';
import { AuthType } from './enums/auth-type.enum';
import { CreateUserDto } from '../users/dtos/create-user.dto';

/**
 * Kontroler za autentikaciju korisnika.
 *
 * Sve rute su javne (@Auth(AuthType.None)) jer korisnik se
 * ne može autentificirati prije nego što se prijavi ili registrira.
 *
 * Endpointi:
 * - POST /auth/sign-up — registracija novog korisnika (FZ-U01)
 * - POST /auth/sign-in — prijava korisnika (FZ-U02)
 * - POST /auth/refresh-tokens — obnova access tokena
 */
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Registracija novog korisnika.
   *
   * Kreira korisnički račun s hashiranom lozinkom i odmah vraća
   * JWT tokene — korisnik je automatski prijavljen nakon registracije.
   *
   * @param createUserDto - Podaci za registraciju (ime, prezime, email, lozinka, instrument?, razina?)
   * @returns Access i refresh token za novog korisnika
   */
  @Post('sign-up')
  @Auth(AuthType.None) // Javna ruta — registracija ne zahtijeva autentikaciju
  @ApiOperation({ summary: 'Registracija novog korisnika' })
  @ApiResponse({ status: 201, description: 'Korisnik kreiran, vraća tokene' })
  @ApiResponse({
    status: 400,
    description: 'Neispravni podaci ili email već postoji',
  })
  public async signUp(@Body() createUserDto: CreateUserDto) {
    return this.authService.signUp(createUserDto);
  }

  /**
   * Prijava korisnika (login).
   *
   * Verificira email i lozinku te vraća par JWT tokena.
   * HttpCode je 200 (umjesto defaultnog 201 za POST) jer se ne kreira novi resurs.
   *
   * @param signInDto - Email i lozinka za prijavu
   * @returns Access i refresh token
   */
  @Post('sign-in')
  @HttpCode(HttpStatus.OK) // POST ali ne kreira resurs → 200 umjesto 201
  @Auth(AuthType.None) // Javna ruta — prijava ne zahtijeva autentikaciju
  @ApiOperation({ summary: 'Prijava korisnika (login)' })
  @ApiResponse({
    status: 200,
    description: 'Uspješna prijava, vraća access i refresh token',
  })
  @ApiResponse({ status: 401, description: 'Neispravni korisnički podaci' })
  public async signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto);
  }

  /**
   * Obnova access tokena pomoću refresh tokena.
   *
   * Klijent šalje refresh token kad mu access token istekne.
   * Vraća novi par tokena bez potrebe za ponovnim unosom lozinke.
   *
   * @param refreshTokenDto - DTO s refresh tokenom
   * @returns Novi access i refresh token
   */
  @Post('refresh-tokens')
  @HttpCode(HttpStatus.OK) // POST ali ne kreira resurs → 200 umjesto 201
  @Auth(AuthType.None) // Javna ruta — refresh ne zahtijeva access token
  @ApiOperation({ summary: 'Obnova access tokena pomoću refresh tokena' })
  @ApiResponse({
    status: 200,
    description: 'Vraća novi access i refresh token',
  })
  @ApiResponse({
    status: 401,
    description: 'Nevažeći ili istekao refresh token',
  })
  public async refreshTokens(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokens(refreshTokenDto);
  }
}
