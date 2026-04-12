import { SetMetadata } from '@nestjs/common';
import { AUTH_TYPE_KEY } from '../constants/auth.constants';
import { AuthType } from '../enums/auth-type.enum';

/**
 * Dekorator za označavanje tipa autentikacije na ruti ili kontroleru.
 *
 * Po defaultu, sve rute zahtijevaju Bearer token (JWT).
 * Za javne rute koristi se `@Auth(AuthType.None)`.
 *
 * @param authTypes - Jedan ili više tipova autentikacije (Bearer, None)
 *
 * @example
 * // Javna ruta (bez autentikacije)
 * @Auth(AuthType.None)
 * @Post('sign-in')
 * signIn() { ... }
 *
 * @example
 * // Zaštićena ruta (default — ne treba eksplicitno staviti)
 * @Get('me')
 * getProfile() { ... }
 */
export const Auth = (...authTypes: AuthType[]) =>
  SetMetadata(AUTH_TYPE_KEY, authTypes);
