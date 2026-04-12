import {
  ForbiddenException,
  Injectable,
  RequestTimeoutException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';

/**
 * Provider za pronalaženje kategorija u bazi podataka.
 *
 * Svaka operacija filtrira po userId — korisnik može pristupiti
 * samo vlastitim kategorijama. findOneById dodatno provjerava
 * vlasništvo i baca ForbiddenException ako kategorija pripada
 * drugom korisniku.
 *
 * Koristi se u:
 * - CategoriesService — dohvaćanje kategorije po ID-u i lista svih
 * - CreateCategoryProvider — provjera duplikata po nazivu
 * - UpdateCategoryProvider — dohvaćanje kategorije prije ažuriranja
 */
@Injectable()
export class FindCategoryProvider {
  constructor(
    /** TypeORM repozitorij za Category entitet */
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
  ) {}

  /**
   * Pronalazi kategoriju po UUID-u s provjerom vlasništva.
   *
   * Dohvaća kategoriju zajedno s user relacijom kako bi mogao
   * provjeriti pripada li kategorija aktivnom korisniku.
   *
   * @param id - UUID kategorije
   * @param userId - UUID aktivnog korisnika (iz JWT payloada)
   * @returns Category entitet ili null ako ne postoji
   * @throws ForbiddenException — ako kategorija pripada drugom korisniku
   */
  public async findOneById(
    id: string,
    userId: string,
  ): Promise<Category | null> {
    // Dohvaćanje kategorije s user relacijom za provjeru vlasništva
    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    // Kategorija ne postoji
    if (!category) {
      return null;
    }

    // Provjera vlasništva — korisnik ne smije pristupiti tuđoj kategoriji
    if (category.user.id !== userId) {
      throw new ForbiddenException('Nemate pristup ovoj kategoriji');
    }

    return category;
  }

  /**
   * Dohvaća sve kategorije koje pripadaju određenom korisniku.
   *
   * Filtrira po userId i sortira po nazivu uzlazno (A-Z).
   *
   * @param userId - UUID korisnika čije se kategorije dohvaćaju
   * @returns Lista kategorija tog korisnika
   * @throws RequestTimeoutException — ako dođe do greške pri povezivanju s bazom
   */
  public async findAllByUser(userId: string): Promise<Category[]> {
    try {
      // Filtriranje po korisniku i sortiranje po nazivu (A-Z)
      return await this.categoriesRepository.find({
        where: { user: { id: userId } },
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

  /**
   * Pronalazi kategoriju po nazivu za određenog korisnika.
   *
   * Koristi se za provjeru duplikata — isti korisnik ne smije
   * imati dvije kategorije s istim nazivom.
   *
   * @param name - Naziv kategorije
   * @param userId - UUID korisnika
   * @returns Category entitet ili null ako ne postoji
   * @throws RequestTimeoutException — ako dođe do greške pri povezivanju s bazom
   */
  public async findOneByNameAndUser(
    name: string,
    userId: string,
  ): Promise<Category | null> {
    try {
      return await this.categoriesRepository.findOneBy({
        name,
        user: { id: userId },
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
