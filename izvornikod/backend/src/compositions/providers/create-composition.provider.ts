import {
  Injectable,
  NotFoundException,
  RequestTimeoutException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Composition } from '../entities/composition.entity';
import { CreateCompositionDto } from '../dtos/create-composition.dto';
import { CompositionType } from '../enums/composition-type.enum';
import { FindArtistProvider } from '../../artists/providers/find-artist.provider';
import { FindKeySignatureProvider } from '../../key-signatures/providers/find-key-signature.provider';

/**
 * Provider za kreiranje novih kompozicija.
 *
 * Kreira isključivo SONG kompozicije — type se hardcoded-a na SONG.
 * Validira FK relacije (Artist, KeySignature) prije kreiranja.
 * userId se postavlja iz JWT payloada, ne iz DTO-a.
 */
@Injectable()
export class CreateCompositionProvider {
  constructor(
    /** TypeORM repozitorij za Composition entitet */
    @InjectRepository(Composition)
    private readonly compositionsRepository: Repository<Composition>,

    /** Provider za validaciju izvođača */
    private readonly findArtistProvider: FindArtistProvider,

    /** Provider za validaciju tonaliteta */
    private readonly findKeySignatureProvider: FindKeySignatureProvider,
  ) {}

  /**
   * Kreira novu SONG kompoziciju.
   *
   * Flow:
   * 1. Ako je proslijeđen artistId → provjeri da Artist postoji
   * 2. Ako je proslijeđen keySignatureId → provjeri da KeySignature postoji
   * 3. Kreiraj entitet s type=SONG i userId iz JWT-a
   * 4. Spremi u bazu
   *
   * @param createCompositionDto - Podaci za kreiranje kompozicije
   * @param userId - UUID vlasnika iz JWT payloada
   * @returns Kreirana Composition entitet
   * @throws NotFoundException ako Artist ili KeySignature ne postoje
   */
  public async createComposition(
    createCompositionDto: CreateCompositionDto,
    userId: string,
  ): Promise<Composition> {
    // Validacija FK — provjeri da Artist postoji ako je proslijeđen
    if (createCompositionDto.artistId) {
      const artist = await this.findArtistProvider.findOneById(
        createCompositionDto.artistId,
      );
      if (!artist) {
        throw new NotFoundException('Izvođač s navedenim ID-em ne postoji');
      }
    }

    // Validacija FK — provjeri da KeySignature postoji ako je proslijeđen
    if (createCompositionDto.keySignatureId) {
      const keySignature = await this.findKeySignatureProvider.findOneById(
        createCompositionDto.keySignatureId,
      );
      if (!keySignature) {
        throw new NotFoundException('Tonalitet s navedenim ID-em ne postoji');
      }
    }

    // Kreiranje entiteta — type je uvijek SONG, userId iz JWT-a
    const newComposition = this.compositionsRepository.create({
      title: createCompositionDto.title,
      tempoBpm: createCompositionDto.tempoBpm,
      description: createCompositionDto.description,
      youtubeSongUrl: createCompositionDto.youtubeSongUrl,
      youtubeInstrumentUrl: createCompositionDto.youtubeInstrumentUrl,
      notesMastery: createCompositionDto.notesMastery,
      lyricsMastery: createCompositionDto.lyricsMastery,
      playingMastery: createCompositionDto.playingMastery,
      type: CompositionType.SONG,
      user: { id: userId },
      artist: createCompositionDto.artistId
        ? { id: createCompositionDto.artistId }
        : undefined,
      keySignature: createCompositionDto.keySignatureId
        ? { id: createCompositionDto.keySignatureId }
        : undefined,
    });

    // Spremanje u bazu
    try {
      return await this.compositionsRepository.save(newComposition);
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
