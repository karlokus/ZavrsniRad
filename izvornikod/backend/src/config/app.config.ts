import { registerAs } from '@nestjs/config';

/**
 * Konfiguracija aplikacije.
 *
 * Registrira se pod namespace-om 'appConfig' i dostupna je
 * kroz ConfigService kao `configService.get('appConfig.environment')`.
 *
 * @returns Objekt s općim postavkama aplikacije
 */
export default registerAs('appConfig', () => ({
  // Okruženje u kojem aplikacija radi (development, production, test)
  environment: process.env.NODE_ENV || 'production',
}));
