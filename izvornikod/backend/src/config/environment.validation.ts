import * as Joi from 'joi';

/**
 * Joi validacijska shema za environment varijable.
 *
 * Koristi se u ConfigModule.forRoot() za validaciju .env datoteke
 * prilikom pokretanja aplikacije. Ako neka obavezna varijabla nedostaje,
 * aplikacija se neće pokrenuti i ispisat će grešku.
 *
 * Varijable s `default()` nisu obavezne u .env datoteci jer imaju
 * fallback vrijednosti. Varijable s `required()` moraju biti postavljene.
 */
export default Joi.object({
  // --- Postavke servera ---
  PORT: Joi.number().port().default(3000),

  // --- Postavke baze podataka ---
  DATABASE_HOST: Joi.string().required(),
  DATABASE_PORT: Joi.number().port().default(5432),
  DATABASE_USER: Joi.string().required(),
  DATABASE_PASSWORD: Joi.string().required(),
  DATABASE_NAME: Joi.string().required(),
  DATABASE_SYNC: Joi.boolean().default(false),
  DATABASE_AUTOLOAD: Joi.boolean().default(true),

  // --- Postavke JWT autentikacije ---
  JWT_SECRET: Joi.string().required(),
  JWT_TOKEN_AUDIENCE: Joi.string().required(),
  JWT_TOKEN_ISSUER: Joi.string().required(),
  JWT_ACCESS_TOKEN_TTL: Joi.number().default(3600),
  JWT_REFRESH_TOKEN_TTL: Joi.number().default(86400),

  // --- Backblaze B2 storage (S3-kompatibilan API) ---
  B2_ENDPOINT: Joi.string().uri().required(),
  B2_REGION: Joi.string().required(),
  B2_BUCKET_NAME: Joi.string().required(),
  B2_KEY_ID: Joi.string().required(),
  B2_APPLICATION_KEY: Joi.string().required(),
  MAX_FILE_SIZE_MB: Joi.number().integer().min(1).default(50),
});
