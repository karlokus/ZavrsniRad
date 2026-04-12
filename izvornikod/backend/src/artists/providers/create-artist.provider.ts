import {
  ConflictException,
  Injectable,
  RequestTimeoutException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateArtistDto } from '../dtos/create-artist.dto';
import { Artist } from '../entities/artist.entity';
import { FindArtistProvider } from './find-artist.provider';

/**
 * Provider za kreiranje novog izvođača u bazi podataka.
 *
 * Provjerava duplikat po nazivu prije kreiranja i baca
 * ConflictException ako izvođač s istim nazivom već postoji.
 */
@Injectable()
export class CreateArtistProvider {
  constructor(
    /** Provider za provjeru postoji li izvođač s istim nazivom */
    private readonly findArtistProvider: FindArtistProvider,

    /** TypeORM repozitorij za Artist entitet */
    @InjectRepository(Artist)
    private readonly artistsRepository: Repository<Artist>,
  ) {}

  /**
   * Kreira novog izvođača u bazi podataka.
   *
   * Flow:
   * 1. Provjera postoji li izvođač s istim nazivom
   * 2. Kreiranje Artist entiteta
   * 3. Spremanje u bazu s error handling-om
   *
   * @param createArtistDto - Podaci za kreiranje izvođača (name)
   * @returns Kreirani Artist entitet
   * @throws ConflictException — ako izvođač s istim nazivom već postoji
   * @throws RequestTimeoutException — ako dođe do greške pri povezivanju s bazom
   */
  public async createArtist(
    createArtistDto: CreateArtistDto,
  ): Promise<Artist> {
    // Provjera postoji li izvođač s istim nazivom
    const existing = await this.findArtistProvider.findOneByName(
      createArtistDto.name,
    );

    if (existing) {
      throw new ConflictException(
        'Izvođač s ovim nazivom već postoji',
      );
    }

    // Kreiranje Artist entiteta
    const newArtist = this.artistsRepository.create(createArtistDto);

    try {
      // Spremanje izvođača u bazu
      return await this.artistsRepository.save(newArtist);
    } catch (error: unknown) {
      // Hvatanje PostgreSQL unique constraint greške za name
      if (error instanceof Error && 'detail' in error) {
        const detail = (error as { detail: string }).detail;
        if (detail.includes('name')) {
          throw new ConflictException('Naziv izvođača mora biti jedinstven');
        }
      }
      // Sve ostale greške → generička poruka
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
