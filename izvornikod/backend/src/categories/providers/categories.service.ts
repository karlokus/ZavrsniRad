import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { CreateCategoryDto } from '../dtos/create-category.dto';
import { UpdateCategoryDto } from '../dtos/update-category.dto';
import { FindCategoryProvider } from './find-category.provider';
import { CreateCategoryProvider } from './create-category.provider';
import { UpdateCategoryProvider } from './update-category.provider';

/**
 * Fasadni servis za upravljanje kategorijama pjesama.
 *
 * Pruža sučelje za CategoriesController delegirajući operacije
 * specijaliziranim providerima. Sve operacije su user-scoped —
 * korisnik može pristupiti samo vlastitim kategorijama.
 *
 * Relevantni FZ: R03, R04, R05, R07
 */
@Injectable()
export class CategoriesService {
  constructor(
    /** TypeORM repozitorij za direktne operacije (delete) */
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,

    /** Provider za pronalaženje kategorija */
    private readonly findCategoryProvider: FindCategoryProvider,
    /** Provider za kreiranje kategorija */
    private readonly createCategoryProvider: CreateCategoryProvider,
    /** Provider za ažuriranje kategorija */
    private readonly updateCategoryProvider: UpdateCategoryProvider,
  ) {}

  /**
   * Kreira novu kategoriju — delegira na CreateCategoryProvider.
   *
   * @param createCategoryDto - Podaci za kreiranje kategorije
   * @param userId - UUID korisnika (iz JWT payloada)
   * @returns Kreirana Category entitet
   */
  public async createCategory(
    createCategoryDto: CreateCategoryDto,
    userId: string,
  ): Promise<Category> {
    return this.createCategoryProvider.createCategory(
      createCategoryDto,
      userId,
    );
  }

  /**
   * Dohvaća sve kategorije prijavljenog korisnika.
   *
   * @param userId - UUID korisnika (iz JWT payloada)
   * @returns Lista kategorija tog korisnika sortirano po nazivu (A-Z)
   */
  public async findAll(userId: string): Promise<Category[]> {
    return this.findCategoryProvider.findAllByUser(userId);
  }

  /**
   * Dohvaća kategoriju po ID-u s provjerom vlasništva.
   *
   * @param id - UUID kategorije
   * @param userId - UUID korisnika (iz JWT payloada)
   * @returns Category entitet
   * @throws NotFoundException — ako kategorija ne postoji
   * @throws ForbiddenException — ako kategorija pripada drugom korisniku
   */
  public async getCategoryById(
    id: string,
    userId: string,
  ): Promise<Category> {
    // Pronalaženje kategorije s provjerom vlasništva
    const category = await this.findCategoryProvider.findOneById(id, userId);

    if (!category) {
      throw new NotFoundException('Kategorija nije pronađena');
    }

    return category;
  }

  /**
   * Ažurira kategoriju — delegira na UpdateCategoryProvider.
   *
   * @param updateCategoryDto - Polja za ažuriranje
   * @param id - UUID kategorije
   * @param userId - UUID korisnika (iz JWT payloada)
   * @returns Ažurirana Category entitet
   */
  public async updateCategory(
    updateCategoryDto: UpdateCategoryDto,
    id: string,
    userId: string,
  ): Promise<Category> {
    return this.updateCategoryProvider.updateCategory(
      updateCategoryDto,
      id,
      userId,
    );
  }

  /**
   * Briše kategoriju s provjerom vlasništva.
   *
   * Prije brisanja provjerava da kategorija postoji i da
   * pripada aktivnom korisniku.
   *
   * @param id - UUID kategorije za brisanje
   * @param userId - UUID korisnika (iz JWT payloada)
   * @returns Objekt s oznakom uspješnosti i ID-em obrisane kategorije
   * @throws NotFoundException — ako kategorija ne postoji
   * @throws ForbiddenException — ako kategorija pripada drugom korisniku
   */
  public async removeCategory(
    id: string,
    userId: string,
  ): Promise<{ deleted: boolean; id: string }> {
    // Provjera vlasništva prije brisanja (baca ForbiddenException ako tuđa)
    const category = await this.findCategoryProvider.findOneById(id, userId);

    if (!category) {
      throw new NotFoundException('Kategorija nije pronađena');
    }

    // Brisanje kategorije iz baze
    const result = await this.categoriesRepository.delete(id);
    return { deleted: (result.affected ?? 0) > 0, id };
  }
}
