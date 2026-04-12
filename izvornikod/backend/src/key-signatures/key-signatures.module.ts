import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KeySignature } from './entities/key-signature.entity';
import { KeySignaturesController } from './key-signatures.controller';
import { KeySignaturesService } from './providers/key-signatures.service';
import { FindKeySignatureProvider } from './providers/find-key-signature.provider';
import { CreateKeySignatureProvider } from './providers/create-key-signature.provider';
import { UpdateKeySignatureProvider } from './providers/update-key-signature.provider';
import { KeySignaturesSeedProvider } from './key-signatures.seed';

/**
 * Modul za katalog tonaliteta.
 *
 * Shared katalog tablica — svi korisnici dijele iste tonalitete.
 * GET endpointi su javni (@Auth(AuthType.None)) jer se koriste
 * pri kreiranju kompozicija na frontend-u.
 * POST/PATCH/DELETE endpointi zahtijevaju JWT autentikaciju.
 *
 * KeySignaturesSeedProvider automatski popunjava tablicu s 30 standardnih
 * tonaliteta (15 dur + 15 mol) na startup ako je tablica prazna (OnModuleInit).
 *
 * Pruža CRUD operacije nad katalogom tonaliteta
 * prema specifikaciji (sekcija 3.3.1).
 *
 * Exporta:
 * - TypeOrmModule — za pristup KeySignature repozitoriju u drugim modulima
 * - FindKeySignatureProvider — za dohvaćanje tonaliteta u budućim modulima (npr. Compositions)
 */
@Module({
  controllers: [KeySignaturesController],
  providers: [
    KeySignaturesService, // Fasadni servis
    FindKeySignatureProvider, // Pronalaženje tonaliteta po ID-u, nazivu, lista
    CreateKeySignatureProvider, // Kreiranje novog tonaliteta
    UpdateKeySignatureProvider, // Ažuriranje tonaliteta
    KeySignaturesSeedProvider, // Seed standardnih tonaliteta na startup
  ],
  imports: [
    // Registracija KeySignature entiteta za TypeORM repozitorij
    TypeOrmModule.forFeature([KeySignature]),
  ],
  exports: [
    // TypeOrmModule za pristup KeySignature repozitoriju u drugim modulima
    TypeOrmModule,
    // FindKeySignatureProvider za dohvaćanje tonaliteta u budućim modulima
    FindKeySignatureProvider,
  ],
})
export class KeySignaturesModule {}
