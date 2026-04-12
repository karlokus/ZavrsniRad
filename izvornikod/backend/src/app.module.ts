import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { InstrumentsModule } from './instruments/instruments.module';
import { CategoriesModule } from './categories/categories.module';
import { ArtistsModule } from './artists/artists.module';
import { KeySignaturesModule } from './key-signatures/key-signatures.module';
import { CompositionsModule } from './compositions/compositions.module';
import { AuthenticationGuard } from './auth/guards/authentication/authentication.guard';
import { AccessTokenGuard } from './auth/guards/access-token/access-token.guard';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import environmentValidation from './config/environment.validation';

// Trenutno okruženje (development, production, test)
const ENV = process.env.NODE_ENV;

/**
 * Korijenski modul aplikacije.
 *
 * Spaja sve feature module (Auth, Users, Instruments, Categories, Artists, KeySignatures, Compositions) i konfigurira:
 * - ConfigModule — globalno učitavanje .env varijabli s Joi validacijom
 * - TypeOrmModule — asinkrono spajanje na PostgreSQL bazu
 * - JwtModule — registracija JWT servisa za potpisivanje/verifikaciju tokena
 * - APP_GUARD — globalni AuthenticationGuard koji štiti sve rute po defaultu
 */
@Module({
  imports: [
    // Globalna konfiguracija — učitava .env datoteku i registrira config namespace-ove
    ConfigModule.forRoot({
      isGlobal: true, // ConfigService dostupan u svim modulima bez ponovnog importa
      envFilePath: !ENV ? '.env' : `.env.${ENV}`, // .env za default, .env.development za dev
      load: [appConfig, databaseConfig], // Registracija config namespace-ova
      validationSchema: environmentValidation, // Joi validacija env varijabli pri pokretanju
    }),

    // Asinkrono spajanje na PostgreSQL bazu koristeći database config
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: +configService.get('database.port'),
        username: configService.get('database.user'),
        password: configService.get('database.password'),
        database: configService.get('database.name'),
        autoLoadEntities: configService.get('database.autoLoadEntities'), // Automatski registrira sve entitete iz feature modula
        synchronize: configService.get('database.synchronize'), // Automatska sinkronizacija sheme (samo za razvoj!)
      }),
    }),

    // JWT konfiguracija na razini root modula — potrebna za AccessTokenGuard
    ConfigModule.forFeature(jwtConfig),
    JwtModule.registerAsync(jwtConfig.asProvider()),

    // Feature moduli
    AuthModule, // Autentikacija (sign-in, sign-up, refresh tokeni)
    UsersModule, // Upravljanje korisnicima (profil, lozinka)
    InstrumentsModule, // Katalog instrumenata
    CategoriesModule, // Kategorije pjesama (user-owned)
    ArtistsModule, // Katalog izvođača (shared)
    KeySignaturesModule, // Katalog tonaliteta (shared, seeded)
    CompositionsModule, // Kompozicije (SONG + EXERCISE)
  ],
  controllers: [AppController],
  providers: [
    AppService,

    // Globalni guard — sve rute zahtijevaju JWT autentikaciju osim onih označenih s @Auth(AuthType.None)
    {
      provide: APP_GUARD,
      useClass: AuthenticationGuard,
    },

    // AccessTokenGuard mora biti registriran kao provider jer ga AuthenticationGuard koristi kroz DI
    AccessTokenGuard,
  ],
})
export class AppModule {
  constructor() {
    console.log(ENV);
  }
}
