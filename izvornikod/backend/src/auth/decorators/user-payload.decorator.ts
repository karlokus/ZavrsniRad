import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { UserPayloadData } from '../interfaces/user-payload-data.interface';
import { REQUEST_USER_KEY } from '../constants/auth.constants';

/**
 * Parametarski dekorator za dohvaćanje JWT payloada iz request objekta.
 *
 * AccessTokenGuard sprema dekodirani JWT payload na request[REQUEST_USER_KEY].
 * Ovaj dekorator omogućuje jednostavan pristup cijelom payloadu ili
 * pojedinačnom polju (sub, email, isBlocked).
 *
 * @param field - Opcionalmo ime polja koje se želi dohvatiti iz payloada
 *
 * @example
 * // Dohvat samo user ID-a (UUID)
 * getProfile(@UserPayload('sub') userId: string) { ... }
 *
 * @example
 * // Dohvat cijelog payloada
 * getProfile(@UserPayload() user: UserPayloadData) { ... }
 */
export const UserPayload = createParamDecorator(
  (field: keyof UserPayloadData | undefined, ctx: ExecutionContext) => {
    // Dohvaćanje HTTP request objekta iz execution konteksta
    const request = ctx.switchToHttp().getRequest();

    // Čitanje JWT payloada koji je AccessTokenGuard postavio na request
    const user: UserPayloadData = request[REQUEST_USER_KEY];

    // Ako je specificirano polje, vraća samo to polje; inače vraća cijeli payload
    return field ? user?.[field] : user;
  },
);
