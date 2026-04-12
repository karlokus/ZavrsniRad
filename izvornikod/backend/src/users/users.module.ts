import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './providers/users.service';
import { User } from './entities/user.entity';
import { FindUserProvider } from './providers/find-user.provider';
import { CreateUserProvider } from './providers/create-user.provider';
import { UpdateUserProvider } from './providers/update-user.provider';
import { AuthModule } from '../auth/auth.module';
import { InstrumentsModule } from '../instruments/instruments.module';

/**
 * Modul za upravljanje korisnicima.
 *
 * Pruža CRUD operacije za korisničke profile i promjenu lozinke.
 * Koristi forwardRef za AuthModule zbog cirkularne ovisnosti:
 * - UsersModule treba HashingProvider iz AuthModule (za changePassword)
 * - AuthModule treba FindUserProvider i CreateUserProvider iz UsersModule
 *
 * Importa InstrumentsModule za pristup Instrument entitetu (User → Instrument relacija).
 *
 * Exporta:
 * - UsersService — fasadni servis za korisnike
 * - FindUserProvider — koristi se u AuthModule (sign-in, refresh)
 * - CreateUserProvider — koristi se u AuthModule (sign-up)
 */
@Module({
  controllers: [UsersController],
  providers: [
    UsersService, // Fasadni servis
    FindUserProvider, // Pronalaženje korisnika po ID-u ili emailu
    CreateUserProvider, // Kreiranje novog korisnika
    UpdateUserProvider, // Ažuriranje korisničkog profila
  ],
  imports: [
    // Registracija User entiteta za TypeORM repozitorij
    TypeOrmModule.forFeature([User]),
    // AuthModule s forwardRef zbog cirkularne ovisnosti
    forwardRef(() => AuthModule),
    // InstrumentsModule za pristup Instrument entitetu
    InstrumentsModule,
  ],
  exports: [UsersService, FindUserProvider, CreateUserProvider],
})
export class UsersModule {}
