import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import jwtConfig from '../../../config/jwt.config';
import { REQUEST_USER_KEY } from '../../constants/auth.constants';

/**
 * Guard koji verificira JWT access token iz Authorization headera.
 *
 * Provjerava:
 * 1. Postoji li Bearer token u Authorization headeru
 * 2. Je li token valjan (potpis, istek, audience, issuer)
 * 3. Je li korisnički račun blokiran (isBlocked flag u payloadu)
 *
 * Ako je token valjan, dekodirani payload se sprema na request objekt
 * pod ključem REQUEST_USER_KEY ('user') za kasniji pristup kroz @UserPayload().
 */
@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    /** JwtService za verifikaciju i dekodiranje tokena */
    private readonly jwtService: JwtService,

    /** JWT konfiguracija (secret, audience, issuer) injektirana iz config namespace-a */
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  /**
   * Verificira access token i postavlja payload na request.
   *
   * @param context - ExecutionContext iz kojeg se izvlači HTTP request
   * @returns true ako je token valjan i korisnik nije blokiran
   * @throws UnauthorizedException — ako token nedostaje ili je nevaljan
   * @throws ForbiddenException — ako je korisnički račun blokiran
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Dohvaćanje HTTP requesta iz execution konteksta
    const request = context.switchToHttp().getRequest();

    // Izvlačenje Bearer tokena iz Authorization headera
    const token = this.extractTokenFromHeader(request);

    // Ako token ne postoji, korisnik nije autentificiran
    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      // Verifikacija tokena — provjerava potpis, istek, audience i issuer
      const payload = await this.jwtService.verifyAsync(
        token,
        this.jwtConfiguration,
      );

      // Provjera je li korisnik blokiran (npr. od strane administratora)
      if (payload.isBlocked === true) {
        throw new ForbiddenException(
          'Your account has been blocked. Please contact support.',
        );
      }

      // Spremanje dekodiranog payloada na request za korištenje u kontrolerima
      request[REQUEST_USER_KEY] = payload;
    } catch (error) {
      // ForbiddenException se propagira dalje (blokirani korisnik)
      if (error instanceof ForbiddenException) {
        throw error;
      }
      // Sve ostale greške (istekao token, neispravan potpis) → 401
      throw new UnauthorizedException();
    }

    return true;
  }

  /**
   * Izvlači Bearer token iz Authorization headera HTTP zahtjeva.
   *
   * Očekivani format: "Bearer <token>"
   *
   * @param request - Express HTTP request objekt
   * @returns JWT token string ili undefined ako header ne postoji
   */
  private extractTokenFromHeader(request: Request): string | undefined {
    // Razdvajanje "Bearer <token>" na dva dijela i uzimanje drugog
    const [, token] = request.headers.authorization?.split(' ') ?? [];
    return token;
  }
}
