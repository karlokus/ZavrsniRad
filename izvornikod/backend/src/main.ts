import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

/**
 * Glavna bootstrap funkcija koja pokreće NestJS aplikaciju.
 *
 * Konfigurira:
 * - Globalnu ValidationPipe za automatsku validaciju DTO-ova
 * - Swagger/OpenAPI dokumentaciju na /api ruti
 * - CORS za cross-origin zahtjeve
 */
async function bootstrap() {
  // Kreiranje NestJS aplikacije s root modulom
  const app = await NestFactory.create(AppModule);

  // Globalna ValidationPipe — automatski validira sve dolazne DTO-ove
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Uklanja polja koja nisu definirana u DTO-u
      forbidNonWhitelisted: true, // Baca grešku ako tijelo zahtjeva sadrži nepoznata polja
      transform: true, // Automatski transformira payload u instancu DTO klase
      transformOptions: {
        enableImplicitConversion: true, // Automatska konverzija tipova (npr. string → number za query parametre)
      },
    }),
  );

  // Swagger/OpenAPI konfiguracija — dostupna na /api ruti
  const config = new DocumentBuilder()
    .setTitle('Repertoar API')
    .setDescription(
      'API za personalizirani sustav za organizaciju repertoara i učenje sviranja',
    )
    .setVersion('1.0')
    // Dodaje "Authorize" gumb u Swagger UI za JWT autentikaciju
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'access-token', // Naziv sigurnosne sheme — koristi se s @ApiBearerAuth('access-token') na kontrolerima
    )
    .build();

  // Generiranje i montiranje Swagger dokumenta
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Omogućavanje CORS-a za frontend komunikaciju
  app.enableCors(); // todo -> postavke cors-a

  // Pokretanje servera na portu iz env varijable ili default 3000
  console.log(process.env.PORT);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
