import { registerAs } from '@nestjs/config';

/**
 * Konfiguracija baze podataka (PostgreSQL).
 *
 * Registrira se pod namespace-om 'database' i koristi se u AppModule
 * za TypeOrmModule.forRootAsync(). Sve vrijednosti se čitaju iz
 * environment varijabli definiranih u .env datoteci.
 *
 * @returns Objekt s parametrima za spajanje na PostgreSQL bazu
 */
export default registerAs('database', () => ({
  // Adresa PostgreSQL servera
  host: process.env.DATABASE_HOST || 'localhost',
  // Port na kojem PostgreSQL sluša
  port: parseInt(process.env.DATABASE_PORT!) || 5432,
  // Korisničko ime za pristup bazi
  user: process.env.DATABASE_USER,
  // Lozinka za pristup bazi
  password: process.env.DATABASE_PASSWORD,
  // Naziv baze podataka
  name: process.env.DATABASE_NAME,
  // Automatska sinkronizacija sheme s entitetima (samo za razvoj, ne za produkciju!)
  synchronize: process.env.DATABASE_SYNC === 'true',
  // Automatsko učitavanje svih registriranih entiteta
  autoLoadEntities: process.env.DATABASE_AUTOLOAD === 'true',
}));
