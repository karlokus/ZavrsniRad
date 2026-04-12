import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Artist } from '../entities/artist.entity';
import { CreateArtistDto } from '../dtos/create-artist.dto';
import { UpdateArtistDto } from '../dtos/update-artist.dto';
import { FindArtistProvider } from './find-artist.provider';
import { CreateArtistProvider } from './create-artist.provider';
import { UpdateArtistProvider } from './update-artist.provider';

/**
 * Fasadni servis za upravljanje izvođačima.
 *
 * Pruža sučelje za ArtistsController delegirajući operacije
 * specijaliziranim providerima. Pokriva CRUD operacije nad
 * shared katalogom izvođača prema specifikaciji (sekcija 3.3.3).
 */
@Injectable()
export class ArtistsService {
  constructor(
    /** TypeORM repozitorij za direktne operacije (delete) */
    @InjectRepository(Artist)
    private readonly artistsRepository: Repository<Artist>,

    /** Provider za pronalaženje izvođača */
    private readonly findArtistProvider: FindArtistProvider,
    /** Provider za kreiranje izvođača */
    private readonly createArtistProvider: CreateArtistProvider,
    /** Provider za ažuriranje izvođača */
    private readonly updateArtistProvider: UpdateArtistProvider,
  ) {}

  /**
   * Kreira novog izvođača — delegira na CreateArtistProvider.
   *
   * @param createArtistDto - Podaci za kreiranje izvođača
   * @returns Kreirani Artist entitet
   */
  public async createArtist(
    createArtistDto: CreateArtistDto,
  ): Promise<Artist> {
    return this.createArtistProvider.createArtist(createArtistDto);
  }

  /**
   * Dohvaća sve izvođače iz kataloga.
   *
   * @returns Lista svih izvođača sortirano po nazivu (A-Z)
   */
  public async findAll(): Promise<Artist[]> {
    return this.findArtistProvider.findAll();
  }

  /**
   * Dohvaća izvođača po ID-u.
   *
   * @param id - UUID izvođača
   * @returns Artist entitet
   * @throws NotFoundException — ako izvođač ne postoji
   */
  public async getArtistById(id: string): Promise<Artist> {
    // Pronalaženje izvođača po ID-u
    const artist = await this.findArtistProvider.findOneById(id);

    if (!artist) {
      throw new NotFoundException('Izvođač nije pronađen');
    }

    return artist;
  }

  /**
   * Ažurira izvođača — delegira na UpdateArtistProvider.
   *
   * @param updateArtistDto - Polja za ažuriranje
   * @param id - UUID izvođača
   * @returns Ažurirani Artist entitet
   */
  public async updateArtist(
    updateArtistDto: UpdateArtistDto,
    id: string,
  ): Promise<Artist> {
    return this.updateArtistProvider.updateArtist(updateArtistDto, id);
  }

  /**
   * Briše izvođača iz kataloga.
   *
   * @param id - UUID izvođača za brisanje
   * @returns Objekt s oznakom uspješnosti i ID-em obrisanog izvođača
   */
  public async removeArtist(
    id: string,
  ): Promise<{ deleted: boolean; id: string }> {
    // Brisanje izvođača iz baze — affected > 0 znači da je brisanje uspjelo
    const result = await this.artistsRepository.delete(id);
    return { deleted: (result.affected ?? 0) > 0, id };
  }
}
