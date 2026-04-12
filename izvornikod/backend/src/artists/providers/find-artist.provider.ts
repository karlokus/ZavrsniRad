import { Injectable, RequestTimeoutException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Artist } from '../entities/artist.entity';

/**
 * Provider za pronalaženje izvođača u bazi podataka.
 *
 * Koristi se u:
 * - ArtistsService — dohvaćanje izvođača po ID-u i lista svih
 * - CreateArtistProvider — provjera duplikata po nazivu
 * - UpdateArtistProvider — dohvaćanje izvođača prije ažuriranja
 * - Budući moduli — dohvaćanje izvođača za relacije (exportan iz ArtistsModule)
 */
@Injectable()
export class FindArtistProvider {
  constructor(
    /** TypeORM repozitorij za Artist entitet */
    @InjectRepository(Artist)
    private readonly artistsRepository: Repository<Artist>,
  ) {}

  /**
   * Pronalazi izvođača po UUID-u.
   *
   * @param id - UUID izvođača
   * @returns Artist entitet ili null ako ne postoji
   */
  public async findOneById(id: string): Promise<Artist | null> {
    return await this.artistsRepository.findOneBy({ id });
  }

  /**
   * Pronalazi izvođača po nazivu.
   *
   * Koristi se za provjeru duplikata pri kreiranju i ažuriranju.
   *
   * @param name - Naziv izvođača
   * @returns Artist entitet ili null ako ne postoji
   * @throws RequestTimeoutException — ako dođe do greške pri povezivanju s bazom
   */
  public async findOneByName(name: string): Promise<Artist | null> {
    try {
      return await this.artistsRepository.findOneBy({ name });
    } catch (error) {
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

  /**
   * Dohvaća sve izvođače iz baze, sortirano po nazivu (A-Z).
   *
   * @returns Lista svih izvođača
   * @throws RequestTimeoutException — ako dođe do greške pri povezivanju s bazom
   */
  public async findAll(): Promise<Artist[]> {
    try {
      // Sortiranje po nazivu uzlazno (A-Z)
      return await this.artistsRepository.find({
        order: { name: 'ASC' },
      });
    } catch (error) {
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
