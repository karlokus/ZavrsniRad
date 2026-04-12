import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import jwtConfig from '../../config/jwt.config';
import { User } from '../../users/entities/user.entity';
import { UserPayloadData } from '../interfaces/user-payload-data.interface';

/**
 * Provider za generiranje JWT tokena (access + refresh).
 *
 * Koristi se prilikom:
 * - Prijave (sign-in) — nakon uspješne autentikacije
 * - Registracije (sign-up) — nakon kreiranja korisnika
 * - Obnove tokena (refresh) — nakon verifikacije refresh tokena
 */
@Injectable()
export class GenerateTokensProvider {
  constructor(
    /** JwtService za potpisivanje tokena */
    private readonly jwtService: JwtService,

    /** JWT konfiguracija (secret, audience, issuer, TTL-ovi) */
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  /**
   * Potpisuje jedan JWT token s proizvoljnim payloadom.
   *
   * Generička metoda koja se koristi za kreiranje i access i refresh tokena.
   * Svaki token sadrži `sub` (user ID) plus opcionalne dodatne podatke.
   *
   * @param userId - UUID korisnika koji se kodira kao `sub` claim
   * @param expiresIn - Trajanje tokena u sekundama
   * @param payload - Opcionalni dodatni podaci za payload (email, isBlocked za access token)
   * @returns Potpisani JWT token string
   */
  public async signToken<T>(
    userId: string,
    expiresIn: number,
    payload?: T,
  ): Promise<string> {
    return await this.jwtService.signAsync(
      {
        sub: userId, // Standardni JWT claim za identifikator subjekta
        ...payload, // Dodatni podaci (email, isBlocked za access token; prazno za refresh)
      },
      {
        secret: this.jwtConfiguration.secret,
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
        expiresIn,
      },
    );
  }

  /**
   * Generira par access + refresh tokena za korisnika.
   *
   * Access token sadrži email i isBlocked u payloadu za brzi pristup.
   * Refresh token sadrži samo `sub` (user ID) jer služi isključivo za obnovu.
   * Oba tokena se generiraju paralelno za optimalne performanse.
   *
   * @param user - User entitet iz baze podataka
   * @returns Objekt s accessToken i refreshToken stringovima
   */
  public async generateTokens(user: User) {
    // Paralelno generiranje oba tokena za optimalne performanse
    const [accessToken, refreshToken] = await Promise.all([
      // Access token — kraći TTL, sadrži korisničke podatke u payloadu
      this.signToken<Partial<UserPayloadData>>(
        user.id,
        this.jwtConfiguration.accessTokenTtl,
        {
          email: user.email,
          isBlocked: user.isBlocked,
        },
      ),
      // Refresh token — duži TTL, sadrži samo sub (user ID)
      this.signToken(user.id, this.jwtConfiguration.refreshTokenTtl),
    ]);

    return { accessToken, refreshToken };
  }
}
