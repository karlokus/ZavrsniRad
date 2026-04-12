import { Injectable } from '@nestjs/common';
import { SignInDto } from '../dtos/sign-in.dto';
import { SignInProvider } from './sign-in.provider';
import { RefreshTokenDto } from '../dtos/refresh-token.dto';
import { RefreshTokensProvider } from './refresh-tokens.provider';
import { CreateUserDto } from '../../users/dtos/create-user.dto';
import { CreateUserProvider } from '../../users/providers/create-user.provider';
import { GenerateTokensProvider } from './generate-tokens.provider';

/**
 * Fasadni servis za autentikaciju.
 *
 * Pruža jednostavno sučelje za AuthController delegirajući
 * poslovnu logiku specijaliziranim providerima:
 * - SignInProvider — prijava korisnika
 * - CreateUserProvider + GenerateTokensProvider — registracija
 * - RefreshTokensProvider — obnova tokena
 */
@Injectable()
export class AuthService {
  constructor(
    /** Provider za prijavu korisnika */
    private readonly signInProvider: SignInProvider,
    /** Provider za obnovu tokena */
    private readonly refreshTokensProvider: RefreshTokensProvider,
    /** Provider za kreiranje korisnika (iz UsersModule) */
    private readonly createUserProvider: CreateUserProvider,
    /** Provider za generiranje JWT tokena */
    private readonly generateTokensProvider: GenerateTokensProvider,
  ) {}

  /**
   * Prijava korisnika — verificira email i lozinku, vraća tokene.
   * @param signInDto - Email i lozinka
   * @returns Access i refresh token
   */
  public async signIn(signInDto: SignInDto) {
    return await this.signInProvider.signIn(signInDto);
  }

  /**
   * Registracija novog korisnika — kreira račun i odmah vraća tokene.
   *
   * Flow: CreateUserProvider kreira usera u bazi → GenerateTokensProvider
   * generira JWT tokene → korisnik je odmah prijavljen nakon registracije.
   *
   * @param createUserDto - Podaci za registraciju (ime, email, lozinka, instrument, razina)
   * @returns Access i refresh token za novog korisnika
   */
  public async signUp(createUserDto: CreateUserDto) {
    // Kreiranje korisnika u bazi (hashiranje lozinke, provjera duplikata)
    const user = await this.createUserProvider.createUser(createUserDto);
    // Generiranje tokena za automatsku prijavu nakon registracije
    return await this.generateTokensProvider.generateTokens(user);
  }

  /**
   * Obnova tokena — verificira refresh token i generira novi par.
   * @param refreshTokenDto - Refresh token
   * @returns Novi access i refresh token
   */
  public async refreshTokens(refreshTokenDto: RefreshTokenDto) {
    return await this.refreshTokensProvider.refreshTokens(refreshTokenDto);
  }
}
