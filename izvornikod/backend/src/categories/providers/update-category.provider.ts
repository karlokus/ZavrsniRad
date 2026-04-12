import {
  BadRequestException,
  ConflictException,
  Injectable,
  RequestTimeoutException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateCategoryDto } from '../dtos/update-category.dto';
import { Category } from '../entities/category.entity';
import { FindCategoryProvider } from './find-category.provider';

/**
 * Provider za ažuriranje kategorije u bazi podataka.
 *
 * Dohvaća kategoriju po ID-u s provjerom vlasništva (FindCategoryProvider),
 * primjenjuje promjene iz DTO-a i sprema ažurirani entitet.
 */
@Injectable()
export class UpdateCategoryProvider {
  constructor(
    /** Provider za pronalaženje kategorije s provjerom vlasništva */
    private readonly findCategoryProvider: FindCategoryProvider,

    /** TypeORM repozitorij za Category entitet */
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
  ) {}

  /**
   * Ažurira kategoriju u bazi podataka.
   *
   * Flow:
   * 1. Pronađi kategoriju po ID-u s provjerom vlasništva
   * 2. Ako se mijenja naziv, provjeri duplikat za istog korisnika
   * 3. Primijeni promjene (nullish coalescing za zadržavanje postojećih vrijednosti)
   * 4. Spremi ažurirani entitet
   *
   * @param updateCategoryDto - Polja za ažuriranje (name?, color?)
   * @param id - UUID kategorije koja se ažurira
   * @param userId - UUID aktivnog korisnika (iz JWT payloada)
   * @returns Ažurirana Category entitet
   * @throws BadRequestException — ako kategorija ne postoji
   * @throws ForbiddenException — ako kategorija pripada drugom korisniku
   * @throws ConflictException — ako ažuriranje uzrokuje duplikat naziva
   * @throws RequestTimeoutException — ako dođe do greške pri povezivanju s bazom
   */
  public async updateCategory(
    updateCategoryDto: UpdateCategoryDto,
    id: string,
    userId: string,
  ): Promise<Category> {
    // Dohvaćanje kategorije s provjerom vlasništva (baca ForbiddenException ako tuđa)
    const category = await this.findCategoryProvider.findOneById(id, userId);

    if (!category) {
      throw new BadRequestException('Kategorija ne postoji');
    }

    // Provjera duplikata naziva za istog korisnika (samo ako se naziv mijenja)
    if (
      updateCategoryDto.name &&
      updateCategoryDto.name !== category.name
    ) {
      const duplicate = await this.findCategoryProvider.findOneByNameAndUser(
        updateCategoryDto.name,
        userId,
      );

      if (duplicate) {
        throw new ConflictException('Već imate kategoriju s ovim nazivom');
      }
    }

    // Ažuriranje polja — zadržava postojeću vrijednost ako polje nije poslano
    category.name = updateCategoryDto.name ?? category.name;
    category.color = updateCategoryDto.color ?? category.color;

    try {
      // Spremanje ažurirane kategorije u bazu
      return await this.categoriesRepository.save(category);
    } catch (error: unknown) {
      // Sve greške → generička poruka
      throw new RequestTimeoutException(
        'Unable to process your request at the moment, please try later',
        { description: 'Error connecting to the database' },
      );
    }
  }
}
