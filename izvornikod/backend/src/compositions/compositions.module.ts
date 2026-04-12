import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Composition } from './entities/composition.entity';
import { CompositionsController } from './compositions.controller';
import { CompositionsService } from './providers/compositions.service';
import { FindCompositionProvider } from './providers/find-composition.provider';
import { CreateCompositionProvider } from './providers/create-composition.provider';
import { UpdateCompositionProvider } from './providers/update-composition.provider';
import { DeleteCompositionProvider } from './providers/delete-composition.provider';
import { ArtistsModule } from '../artists/artists.module';
import { KeySignaturesModule } from '../key-signatures/key-signatures.module';

/**
 * Modul za upravljanje kompozicijama (SONG + EXERCISE).
 *
 * Centralni modul sustava — kompozicije su pjesme u korisnikovom
 * repertoaru (SONG) ili generirane vježbe (EXERCISE).
 *
 * Importa ArtistsModule i KeySignaturesModule za validaciju
 * FK relacija pri kreiranju i ažuriranju kompozicija.
 *
 * Exporta:
 * - TypeOrmModule — za pristup Composition repozitoriju u drugim modulima
 * - FindCompositionProvider — za dohvaćanje kompozicija u budućim modulima
 */
@Module({
  controllers: [CompositionsController],
  providers: [
    CompositionsService, // Fasadni servis
    FindCompositionProvider, // Pronalaženje kompozicija po ID-u, po korisniku
    CreateCompositionProvider, // Kreiranje novih SONG kompozicija
    UpdateCompositionProvider, // Ažuriranje polja kompozicije
    DeleteCompositionProvider, // Brisanje kompozicija
  ],
  imports: [
    // Registracija Composition entiteta za TypeORM repozitorij
    TypeOrmModule.forFeature([Composition]),
    // ArtistsModule za FindArtistProvider — validacija FK pri kreiranju/ažuriranju
    ArtistsModule,
    // KeySignaturesModule za FindKeySignatureProvider — validacija FK pri kreiranju/ažuriranju
    KeySignaturesModule,
  ],
  exports: [
    // TypeOrmModule za pristup Composition repozitoriju u drugim modulima
    TypeOrmModule,
    // FindCompositionProvider za dohvaćanje kompozicija u budućim modulima
    FindCompositionProvider,
  ],
})
export class CompositionsModule {}
