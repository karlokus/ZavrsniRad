import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Artist } from './entities/artist.entity';
import { ArtistsController } from './artists.controller';
import { ArtistsService } from './providers/artists.service';
import { FindArtistProvider } from './providers/find-artist.provider';
import { CreateArtistProvider } from './providers/create-artist.provider';
import { UpdateArtistProvider } from './providers/update-artist.provider';

/**
 * Modul za katalog izvođača.
 *
 * Shared katalog tablica — svi korisnici dijele iste izvođače.
 * GET endpointi su javni (@Auth(AuthType.None)) jer se koriste
 * pri kreiranju kompozicija na frontend-u.
 * POST/PATCH/DELETE endpointi zahtijevaju JWT autentikaciju.
 *
 * Pruža CRUD operacije nad katalogom izvođača
 * prema specifikaciji (sekcija 3.3.3).
 *
 * Exporta:
 * - TypeOrmModule — za pristup Artist repozitoriju u drugim modulima
 * - FindArtistProvider — za dohvaćanje izvođača u budućim modulima (npr. Compositions)
 */
@Module({
  controllers: [ArtistsController],
  providers: [
    ArtistsService, // Fasadni servis
    FindArtistProvider, // Pronalaženje izvođača po ID-u, nazivu, lista
    CreateArtistProvider, // Kreiranje novog izvođača
    UpdateArtistProvider, // Ažuriranje izvođača
  ],
  imports: [
    // Registracija Artist entiteta za TypeORM repozitorij
    TypeOrmModule.forFeature([Artist]),
  ],
  exports: [
    // TypeOrmModule za pristup Artist repozitoriju u drugim modulima
    TypeOrmModule,
    // FindArtistProvider za dohvaćanje izvođača u budućim modulima
    FindArtistProvider,
  ],
})
export class ArtistsModule {}
