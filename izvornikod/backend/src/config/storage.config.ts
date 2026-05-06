import { registerAs } from '@nestjs/config';

/**
 * Storage konfiguracija za Backblaze B2 (S3-kompatibilan API).
 *
 * Sve env varijable validira Joi schema u environment.validation.ts.
 * Pristupa se kroz ConfigService.get('storage.<key>').
 */
export default registerAs('storage', () => ({
  endpoint: process.env.B2_ENDPOINT,
  region: process.env.B2_REGION,
  bucketName: process.env.B2_BUCKET_NAME,
  keyId: process.env.B2_KEY_ID,
  applicationKey: process.env.B2_APPLICATION_KEY,
  maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB ?? '50', 10),
}));
