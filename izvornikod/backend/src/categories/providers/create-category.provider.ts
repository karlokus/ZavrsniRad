import {
  ConflictException,
  Injectable,
  RequestTimeoutException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCategoryDto } from '../dtos/create-category.dto';
import { Category } from '../entities/category.entity';
import { FindCategoryProvider } from './find-category.provider';

/**
 * Provider za kreiranje nove kategorije u bazi podataka.
 *
 * Provjerava duplikat po nazivu za istog korisnika prije kreiranja.
 * Isti korisnik ne smije imati dvije kategorije s istim nazivom.
 */
@Injectable()
export class CreateCategoryProvider {
  constructor(
    /** Provider za provjeru postoji li kategorija s istim nazivom */
    private readonly findCategoryProvider: FindCategoryProvider,

    /** TypeORM repozitorij za Category entitet */
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
  ) {}

  /**
   * Kreira novu kategoriju za određenog korisnika.
   *
   * Flow:
   * 1. Provjera postoji li kategorija s istim nazivom za istog korisnika
   * 2. Kreiranje Category entiteta s user relacijom
   * 3. Spremanje u bazu s error handling-om
   *
   * @param createCategoryDto - Podaci za kreiranje kategorije (name, color?)
   * @param userId - UUID korisnika koji kreira kategoriju (iz JWT payloada)
   * @returns Kreirana Category entitet
   * @throws ConflictException — ako korisnik već ima kategoriju s istim nazivom
   * @throws RequestTimeoutException — ako dođe do greške pri povezivanju s bazom
   */
  public async createCategory(
    createCategoryDto: CreateCategoryDto,
    userId: string,
  ): Promise<Category> {
    // Provjera duplikata — isti korisnik ne smije imati 2 kategorije s istim nazivom
    const existing = await this.findCategoryProvider.findOneByNameAndUser(
      createCategoryDto.name,
      userId,
    );

    if (existing) {
      throw new ConflictException(
        'Već imate kategoriju s ovim nazivom',
      );
    }

    // Kreiranje Category entiteta s user relacijom (samo ID, bez dohvaćanja iz baze)
    const newCategory = this.categoriesRepository.create({
      ...createCategoryDto,
      user: { id: userId },
    });

    try {
      // Spremanje kategorije u bazu
      return await this.categoriesRepository.save(newCategory);
    } catch (error: unknown) {
      // Sve greške → generička poruka
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
