import {
  BadRequestException,
  Injectable,
  NotFoundException,
  RequestTimeoutException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Composition } from '../entities/composition.entity';
import { UpdateCompositionDto } from '../dtos/update-composition.dto';
import { FindCompositionProvider } from './find-composition.provider';
import { FindArtistProvider } from '../../artists/providers/find-artist.provider';
import { FindKeySignatureProvider } from '../../key-signatures/providers/find-key-signature.provider';
import { Artist } from '../../artists/entities/artist.entity';
import { KeySignature } from '../../key-signatures/entities/key-signature.entity';

/**
 * Provider za ažuriranje kompozicija.
 *
 * Ažurira samo polja koja su proslijeđena u DTO-u (nullish coalescing).
 * Provjerava vlasništvo preko FindCompositionProvider.
 * Validira FK relacije (Artist, KeySignature) ako se mijenjaju.
 */
@Injectable()
export class UpdateCompositionProvider {
  constructor(
    /** TypeORM repozitorij za Composition entitet */
    @InjectRepository(Composition)
    private readonly compositionsRepository: Repository<Composition>,

    /** Provider za dohvat s provjerom vlasništva */
    private readonly findCompositionProvider: FindCompositionProvider,

    /** Provider za validaciju izvođača */
    private readonly findArtistProvider: FindArtistProvider,

    /** Provider za validaciju tonaliteta */
    private readonly findKeySignatureProvider: FindKeySignatureProvider,
  ) {}

  /**
   * Ažurira kompoziciju po UUID-u.
   *
   * Flow:
   * 1. Dohvati kompoziciju s provjerom vlasništva
   * 2. Validiraj nove FK vrijednosti (Artist, KeySignature) ako se mijenjaju
   * 3. Ažuriraj polja s nullish coalescing operatorom
   * 4. Spremi promjene
   *
   * @param updateCompositionDto - Polja za ažuriranje
   * @param id - UUID kompozicije
   * @param userId - UUID aktivnog korisnika iz JWT-a
   * @returns Ažurirani Composition entitet
   * @throws BadRequestException ako kompozicija ne postoji
   * @throws ForbiddenException ako korisnik nije vlasnik (iz FindCompositionProvider)
   * @throws NotFoundException ako Artist ili KeySignature ne postoje
   */
  public async updateComposition(
    updateCompositionDto: UpdateCompositionDto,
    id: string,
    userId: string,
  ): Promise<Composition> {
    // Dohvat s provjerom vlasništva — baca ForbiddenException ako nije vlasnik
    const composition = await this.findCompositionProvider.findOneById(
      id,
      userId,
    );

    // Kompozicija ne postoji
    if (!composition) {
      throw new BadRequestException('Kompozicija ne postoji');
    }

    // Validacija FK — provjeri novi Artist ako se mijenja
    if (
      updateCompositionDto.artistId !== undefined &&
      updateCompositionDto.artistId !== composition.artist?.id
    ) {
      const artist = await this.findArtistProvider.findOneById(
        updateCompositionDto.artistId,
      );
      if (!artist) {
        throw new NotFoundException('Izvođač s navedenim ID-em ne postoji');
      }
    }

    // Validacija FK — provjeri novi KeySignature ako se mijenja
    if (
      updateCompositionDto.keySignatureId !== undefined &&
      updateCompositionDto.keySignatureId !== composition.keySignature?.id
    ) {
      const keySignature = await this.findKeySignatureProvider.findOneById(
        updateCompositionDto.keySignatureId,
      );
      if (!keySignature) {
        throw new NotFoundException('Tonalitet s navedenim ID-em ne postoji');
      }
    }

    // Ažuriranje skalarnih polja — nullish coalescing čuva postojeće vrijednosti
    composition.title = updateCompositionDto.title ?? composition.title;
    composition.tempoBpm =
      updateCompositionDto.tempoBpm ?? composition.tempoBpm;
    composition.description =
      updateCompositionDto.description ?? composition.description;
    composition.youtubeSongUrl =
      updateCompositionDto.youtubeSongUrl ?? composition.youtubeSongUrl;
    composition.youtubeInstrumentUrl =
      updateCompositionDto.youtubeInstrumentUrl ??
      composition.youtubeInstrumentUrl;
    composition.notesMastery =
      updateCompositionDto.notesMastery ?? composition.notesMastery;
    composition.lyricsMastery =
      updateCompositionDto.lyricsMastery ?? composition.lyricsMastery;
    composition.playingMastery =
      updateCompositionDto.playingMastery ?? composition.playingMastery;

    // Ažuriranje FK relacija — postavi novi objekt ako je proslijeđen ID
    if (updateCompositionDto.artistId !== undefined) {
      composition.artist = { id: updateCompositionDto.artistId } as Artist;
    }
    if (updateCompositionDto.keySignatureId !== undefined) {
      composition.keySignature = {
        id: updateCompositionDto.keySignatureId,
      } as KeySignature;
    }

    // Spremanje ažuriranog entiteta
    try {
      return await this.compositionsRepository.save(composition);
    } catch (error: unknown) {
      const errMessage = (error as Error).message;
      throw new RequestTimeoutException(
        'Unable to process your request at the moment, please try later',
        {
          description:
            'Error connecting to the database, error message: ' + errMessage,
        },
      );
    }
  }
}
