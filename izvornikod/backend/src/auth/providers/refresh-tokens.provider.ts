import {
  forwardRef,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import jwtConfig from '../../config/jwt.config';
import { RefreshTokenDto } from '../dtos/refresh-token.dto';
import { GenerateTokensProvider } from './generate-tokens.provider';
import { FindUserProvider } from '../../users/providers/find-user.provider';
import { UserPayloadData } from '../interfaces/user-payload-data.interface';

/**
 * Provider za obnovu JWT tokena (token refresh).
 *
 * Klijent šalje refresh token → provider ga verificira → dohvaća korisnika
 * iz baze → generira novi par tokena. Ovo omogućuje produženje sesije
 * bez ponovnog unosa lozinke.
 */
@Injectable()
export class RefreshTokensProvider {
  constructor(
    /** Provider za pronalaženje korisnika — forwardRef zbog cirkularne ovisnosti */
    @Inject(forwardRef(() => FindUserProvider))
    private readonly findUserProvider: FindUserProvider,

    /** JwtService za verifikaciju refresh tokena */
    private readonly jwtService: JwtService,

    /** JWT konfiguracija (secret, audience, issuer) za verifikaciju */
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,

    /** Provider za generiranje novih tokena */
    private readonly generateTokensProvider: GenerateTokensProvider,
  ) {}

  /**
   * Verificira refresh token i generira novi par tokena.
   *
   * @param refreshTokenDto - DTO s refresh tokenom
   * @returns Novi par access + refresh tokena
   * @throws UnauthorizedException — ako je refresh token nevaljan ili istekao
   */
  public async refreshTokens(refreshTokenDto: RefreshTokenDto) {
    try {
      // Verifikacija refresh tokena — izvlačenje sub (user ID) iz payloada
      const { sub } = await this.jwtService.verifyAsync<
        Pick<UserPayloadData, 'sub'>
      >(refreshTokenDto.refreshToken, {
        secret: this.jwtConfiguration.secret,
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
      });

      // Dohvaćanje korisnika iz baze po ID-u iz tokena
      const user = await this.findUserProvider.findOneById(sub);

      // Generiranje novog para tokena s ažuriranim podacima korisnika
      return await this.generateTokensProvider.generateTokens(user!);
    } catch (error) {
      // Bilo koji problem (nevaljan token, korisnik ne postoji) → 401
      throw new UnauthorizedException(error);
    }
  }
}
