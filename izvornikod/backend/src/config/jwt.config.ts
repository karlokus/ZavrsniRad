import { registerAs } from '@nestjs/config';

/**
 * Konfiguracija JWT (JSON Web Token) autentikacije.
 *
 * Registrira se pod namespace-om 'jwt'. Koristi `registerAs` pattern
 * koji omogućuje i `jwtConfig.asProvider()` za direktnu registraciju
 * u JwtModule.registerAsync().
 *
 * @returns Objekt s JWT parametrima (secret, audience, issuer, TTL-ovi)
 */
export default registerAs('jwt', () => ({
  // Tajni ključ za potpisivanje i verifikaciju tokena
  secret: process.env.JWT_SECRET,
  // Publika kojoj je token namijenjen (npr. URL aplikacije)
  audience: process.env.JWT_TOKEN_AUDIENCE,
  // Izdavač tokena (npr. URL backend servera)
  issuer: process.env.JWT_TOKEN_ISSUER,
  // Trajanje access tokena u sekundama (default: 3600 = 1 sat)
  accessTokenTtl: parseInt(process.env.JWT_ACCESS_TOKEN_TTL ?? '3600', 10),
  // Trajanje refresh tokena u sekundama (default: 86400 = 24 sata)
  refreshTokenTtl: parseInt(process.env.JWT_REFRESH_TOKEN_TTL ?? '86400', 10),
}));
