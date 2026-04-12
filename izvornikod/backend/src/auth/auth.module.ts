import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './providers/auth.service';
import { HashingProvider } from './providers/hashing.provider';
import { BcryptProvider } from './providers/bcrypt.provider';
import { SignInProvider } from './providers/sign-in.provider';
import { GenerateTokensProvider } from './providers/generate-tokens.provider';
import { RefreshTokensProvider } from './providers/refresh-tokens.provider';
import { UsersModule } from '../users/users.module';
import jwtConfig from '../config/jwt.config';

/**
 * Modul za autentikaciju korisnika.
 *
 * Pruža JWT-baziranu autentikaciju s access + refresh token mehanizmom.
 * Koristi forwardRef za UsersModule zbog cirkularne ovisnosti:
 * - AuthModule treba FindUserProvider i CreateUserProvider iz UsersModule
 * - UsersModule treba HashingProvider iz AuthModule
 *
 * Exporta:
 * - AuthService — za korištenje auth logike u drugim modulima
 * - HashingProvider — za hashiranje/usporedbu lozinki u UsersModule
 */
@Module({
  controllers: [AuthController],
  providers: [
    // Fasadni servis koji objedinjuje sign-in, sign-up i refresh logiku
    AuthService,

    // HashingProvider → BcryptProvider zamjena — omogućuje laku zamjenu algoritma
    {
      provide: HashingProvider,
      useClass: BcryptProvider,
    },

    // Specijalizirani provideri za pojedine auth operacije
    SignInProvider, // Prijava korisnika
    GenerateTokensProvider, // Generiranje JWT tokena
    RefreshTokensProvider, // Obnova tokena
  ],
  imports: [
    // UsersModule s forwardRef zbog cirkularne ovisnosti
    forwardRef(() => UsersModule),
    // Registracija JWT konfiguracije pod 'jwt' namespace-om
    ConfigModule.forFeature(jwtConfig),
    // Asinkrona registracija JwtModule s postavkama iz jwt.config.ts
    JwtModule.registerAsync(jwtConfig.asProvider()),
  ],
  exports: [AuthService, HashingProvider],
})
export class AuthModule {}
