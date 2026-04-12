import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Instrument } from './entities/instrument.entity';

/**
 * Modul za katalog instrumenata.
 *
 * Trenutno služi kao placeholder — registrira Instrument entitet
 * i exporta TypeOrmModule kako bi drugi moduli (npr. UsersModule)
 * mogli koristiti Instrument entitet u relacijama.
 *
 * U budućnosti će sadržavati CRUD kontroler i providere za
 * upravljanje katalogom instrumenata (dodavanje, brisanje, listanje).
 */
@Module({
  imports: [
    // Registracija Instrument entiteta za TypeORM repozitorij
    TypeOrmModule.forFeature([Instrument]),
  ],
  // Export TypeOrmModule omogućuje korištenje Instrument repozitorija u drugim modulima
  exports: [TypeOrmModule],
})
export class InstrumentsModule {}
