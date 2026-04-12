import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Instrument } from './entities/instrument.entity';
import { InstrumentsController } from './instruments.controller';
import { InstrumentsService } from './providers/instruments.service';
import { FindInstrumentProvider } from './providers/find-instrument.provider';
import { CreateInstrumentProvider } from './providers/create-instrument.provider';
import { UpdateInstrumentProvider } from './providers/update-instrument.provider';
import { InstrumentsSeedProvider } from './instruments.seed';

/**
 * Modul za katalog instrumenata.
 *
 * Pruža CRUD operacije nad katalogom instrumenata prema specifikaciji (sekcija 3.1.1).
 * GET endpointi su javni (@Auth(AuthType.None)) jer se koriste pri registraciji.
 * POST/PATCH/DELETE endpointi zahtijevaju JWT autentikaciju.
 *
 * InstrumentsSeedProvider automatski popunjava tablicu defaultnim instrumentima
 * na startup aplikacije ako je tablica prazna (OnModuleInit).
 *
 * Exporta:
 * - TypeOrmModule — za pristup Instrument repozitoriju u drugim modulima
 * - FindInstrumentProvider — za dohvaćanje instrumenata u budućim modulima
 */
@Module({
  controllers: [InstrumentsController],
  providers: [
    InstrumentsService, // Fasadni servis
    FindInstrumentProvider, // Pronalaženje instrumenata po ID-u, nazivu, lista
    CreateInstrumentProvider, // Kreiranje novog instrumenta
    UpdateInstrumentProvider, // Ažuriranje instrumenta
    InstrumentsSeedProvider, // Seed defaultnih instrumenata na startup
  ],
  imports: [
    // Registracija Instrument entiteta za TypeORM repozitorij
    TypeOrmModule.forFeature([Instrument]),
  ],
  exports: [
    // TypeOrmModule za pristup Instrument repozitoriju u drugim modulima
    TypeOrmModule,
    // FindInstrumentProvider za dohvaćanje instrumenata u budućim modulima
    FindInstrumentProvider,
  ],
})
export class InstrumentsModule {}
