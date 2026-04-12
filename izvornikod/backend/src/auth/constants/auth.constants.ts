/**
 * Ključ pod kojim se JWT payload sprema na request objekt.
 * AccessTokenGuard postavlja request[REQUEST_USER_KEY] = payload,
 * a @UserPayload() dekorator ga čita iz istog ključa.
 */
export const REQUEST_USER_KEY = 'user';

/**
 * Ključ za SetMetadata koji označava tip autentikacije na ruti.
 * @Auth() dekorator sprema AuthType pod ovim ključem,
 * a AuthenticationGuard ga čita putem Reflectora.
 */
export const AUTH_TYPE_KEY = 'authType';
