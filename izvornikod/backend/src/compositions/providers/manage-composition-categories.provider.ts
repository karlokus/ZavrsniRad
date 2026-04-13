import {
  Injectable,
  NotFoundException,
  RequestTimeoutException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Composition } from '../entities/composition.entity';
import { FindCompositionProvider } from './find-composition.provider';
import { FindCategoryProvider } from '../../categories/providers/find-category.provider';
import { Category } from '../../categories/entities/category.entity';

/**
 * Provider za upravljanje M:N relacijom Composition ↔ Category.
 *
 * Metode:
 * - setCategories — zamjena cijelog seta kategorija (PUT semantika)
 * - getCategories — dohvat kategorija pridruženih kompoziciji
 *
 * Validacija vlasništva:
 * - Kompozicija: FindCompositionProvider provjerava vlasništvo (SONG=vlasnik, EXERCISE=svi)
 * - Kategorije: FindCategoryProvider provjerava vlasništvo (ForbiddenException ako tuđa)
 */
@Injectable()
export class ManageCompositionCategoriesProvider {
  constructor(
    /** TypeORM repozitorij za Composition entitet */
    @InjectRepository(Composition)
    private readonly compositionsRepository: Repository<Composition>,

    /** Provider za pronalaženje kompozicija s provjerom vlasništva */
    private readonly findCompositionProvider: FindCompositionProvider,

    /** Provider za pronalaženje kategorija s provjerom vlasništva */
    private readonly findCategoryProvider: FindCategoryProvider,
  ) {}

  /**
   * Zamjenjuje cijeli set kategorija na kompoziciji.
   *
   * PUT semantika — proslijeđeni categoryIds postaju novi kompletni set.
   * Prazan array uklanja sve kategorije.
   *
   * Svaka kategorija mora pripadati aktivnom korisniku —
   * FindCategoryProvider.findOneById baca ForbiddenException za tuđe kategorije.
   *
   * @param compositionId - UUID kompozicije
   * @param categoryIds - Lista UUID-ova kategorija
   * @param userId - UUID aktivnog korisnika iz JWT-a
   * @returns Ažurirana kompozicija s kategorijama
   * @throws NotFoundException ako kompozicija ili kategorija ne postoji
   * @throws ForbiddenException ako korisnik nije vlasnik kompozicije ili kategorije
   */
  public async setCategories(
    compositionId: string,
    categoryIds: string[],
    userId: string,
  ): Promise<Composition> {
    // Dohvat kompozicije s provjerom vlasništva
    const composition = await this.findCompositionProvider.findOneById(
      compositionId,
      userId,
    );

    if (!composition) {
      throw new NotFoundException('Kompozicija nije pronađena');
    }

    // Prazan array — ukloni sve kategorije
    if (categoryIds.length === 0) {
      composition.categories = [];
      return this.saveComposition(composition);
    }

    // Validacija svake kategorije — mora postojati i pripadati korisniku
    const validCategories: Category[] = [];

    for (const categoryId of categoryIds) {
      const category = await this.findCategoryProvider.findOneById(
        categoryId,
        userId,
      );

      if (!category) {
        throw new NotFoundException(
          `Kategorija s ID-em ${categoryId} nije pronađena`,
        );
      }

      validCategories.push(category);
    }

    // Zamjena cijelog seta kategorija
    composition.categories = validCategories;
    return this.saveComposition(composition);
  }

  /**
   * Dohvaća kategorije pridružene kompoziciji.
   *
   * @param compositionId - UUID kompozicije
   * @param userId - UUID aktivnog korisnika iz JWT-a
   * @returns Lista kategorija
   * @throws NotFoundException ako kompozicija ne postoji
   * @throws ForbiddenException ako korisnik nije vlasnik SONG kompozicije
   */
  public async getCategories(
    compositionId: string,
    userId: string,
  ): Promise<Category[]> {
    // Dohvat kompozicije s provjerom vlasništva
    const composition = await this.compositionsRepository.findOne({
      where: { id: compositionId },
      relations: ['user', 'categories'],
    });

    if (!composition) {
      throw new NotFoundException('Kompozicija nije pronađena');
    }

    // Provjera vlasništva delegirana na findOneById
    // (pozivamo ga samo za ownership check)
    await this.findCompositionProvider.findOneById(compositionId, userId);

    return composition.categories ?? [];
  }

  /**
   * Sprema kompoziciju u bazu s error handlingom.
   *
   * @param composition - Composition entitet za spremanje
   * @returns Spremljena kompozicija
   */
  private async saveComposition(
    composition: Composition,
  ): Promise<Composition> {
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
