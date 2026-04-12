import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccessTokenGuard } from '../access-token/access-token.guard';
import { AuthType } from '../../enums/auth-type.enum';
import { AUTH_TYPE_KEY } from '../../constants/auth.constants';

/**
 * Globalni guard za autentikaciju — registriran kao APP_GUARD u AppModule.
 *
 * Čita @Auth() metapodatke s rute/kontrolera i delegira na odgovarajući guard:
 * - AuthType.Bearer → AccessTokenGuard (verificira JWT token)
 * - AuthType.None → propušta bez provjere (javna ruta)
 *
 * Ako @Auth() dekorator nije postavljen, defaultni tip je Bearer
 * (sve rute zahtijevaju autentikaciju osim eksplicitno označenih).
 */
@Injectable()
export class AuthenticationGuard implements CanActivate {
  /** Defaultni tip autentikacije ako @Auth() dekorator nije prisutan */
  private static readonly defaultAuthType: AuthType = AuthType.Bearer;

  /** Mapa koja povezuje AuthType s odgovarajućim guardom */
  private readonly authTypeGuardMap: Record<
    AuthType,
    CanActivate | CanActivate[]
  >;

  constructor(
    /** Reflector za čitanje metapodataka (@Auth dekorator) s ruta */
    private readonly reflector: Reflector,
    /** AccessTokenGuard za verificiranje JWT tokena */
    private readonly accessTokenGuard: AccessTokenGuard,
  ) {
    // Mapiranje tipova autentikacije na konkretne guardove
    this.authTypeGuardMap = {
      [AuthType.Bearer]: this.accessTokenGuard, // JWT autentikacija
      [AuthType.None]: { canActivate: () => true }, // Javna ruta — uvijek propušta
    };
  }

  /**
   * Određuje tip autentikacije za trenutnu rutu i delegira na odgovarajući guard.
   *
   * @param context - ExecutionContext koji sadrži informacije o ruti i handleru
   * @returns true ako je autentikacija uspješna
   * @throws UnauthorizedException — ako nijedan guard ne odobri pristup
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Čitanje @Auth() metapodataka — prvo s handlera (metode), zatim s kontrolera
    const authTypes = this.reflector.getAllAndOverride(AUTH_TYPE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]) ?? [AuthenticationGuard.defaultAuthType]; // Default: Bearer ako nema @Auth()

    // Dohvaćanje guardova za sve navedene tipove autentikacije
    const guards = authTypes
      .map((type: AuthType) => this.authTypeGuardMap[type])
      .flat();

    // Defaultna greška koja se baca ako nijedan guard ne uspije
    const error = new UnauthorizedException();

    // Iteracija kroz guardove — prvi koji odobri pristup završava provjeru
    for (const instance of guards) {
      const canActivate = await Promise.resolve(
        instance.canActivate(context),
      ).catch((err) => ({ error: err })); // Ako guard baci grešku, tretira se kao neuspjeh

      if (canActivate) {
        return true;
      }
    }

    // Nijedan guard nije odobrio pristup
    throw error;
  }
}
