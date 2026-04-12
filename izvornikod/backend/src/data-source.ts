import 'dotenv/config';
import { DataSource } from 'typeorm';

/**
 * Standalone DataSource konfiguracija za TypeORM CLI.
 *
 * NestJS DI nije dostupan u CLI kontekstu pa ovaj fajl
 * čita .env varijable direktno kroz dotenv.
 * Koristi se za generiranje, pokretanje i revert migracija:
 *   npm run migration:generate --name=OpisPromjene
 *   npm run migration:run
 *   npm run migration:revert
 */
export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT!) || 5432,
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  // Glob na .ts jer CLI pokreće fajlove kroz ts-node
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
});
