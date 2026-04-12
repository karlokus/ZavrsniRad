import {
  BadRequestException,
  ConflictException,
  Injectable,
  RequestTimeoutException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateArtistDto } from '../dtos/update-artist.dto';
import { Artist } from '../entities/artist.entity';
import { FindArtistProvider } from './find-artist.provider';

/**
 * Provider za ažuriranje izvođača u bazi podataka.
 *
 * Dohvaća izvođača po ID-u, primjenjuje promjene iz DTO-a
 * i sprema ažurirani entitet.
 */
@Injectable()
export class UpdateArtistProvider {
  constructor(
    /** Provider za pronalaženje izvođača prije ažuriranja */
    private readonly findArtistProvider: FindArtistProvider,

    /** TypeORM repozitorij za Artist entitet */
    @InjectRepository(Artist)
    private readonly artistsRepository: Repository<Artist>,
  ) {}

  /**
   * Ažurira izvođača u bazi podataka.
   *
   * @param updateArtistDto - Polja za ažuriranje (name?)
   * @param id - UUID izvođača koji se ažurira
   * @returns Ažurirani Artist entitet
   * @throws BadRequestException — ako izvođač ne postoji
   * @throws ConflictException — ako ažuriranje uzrokuje duplikat naziva
   * @throws RequestTimeoutException — ako dođe do greške pri povezivanju s bazom
   */
  public async updateArtist(
    updateArtistDto: UpdateArtistDto,
    id: string,
  ): Promise<Artist> {
    // Dohvaćanje trenutnog izvođača iz baze
    const artist = await this.findArtistProvider.findOneById(id);

    if (!artist) {
      throw new BadRequestException('Izvođač ne postoji');
    }

    // Ažuriranje naziva — zadržava postojeću vrijednost ako polje nije poslano
    artist.name = updateArtistDto.name ?? artist.name;

    try {
      // Spremanje ažuriranog izvođača u bazu
      return await this.artistsRepository.save(artist);
    } catch (error: unknown) {
      // Hvatanje PostgreSQL unique constraint greške za name
      if (error instanceof Error && 'detail' in error) {
        const detail = (error as { detail: string }).detail;
        if (detail.includes('name')) {
          throw new ConflictException('Naziv izvođača mora biti jedinstven');
        }
      }
      // Sve ostale greške → generička poruka
      throw new RequestTimeoutException(
        'Unable to process your request at the moment, please try later',
        { description: 'Error connecting to the database' },
      );
    }
  }
}
