import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Composition } from '../entities/composition.entity';
import { CreateCompositionDto } from '../dtos/create-composition.dto';
import { UpdateCompositionDto } from '../dtos/update-composition.dto';
import { FindCompositionProvider } from './find-composition.provider';
import { CreateCompositionProvider } from './create-composition.provider';
import { UpdateCompositionProvider } from './update-composition.provider';
import { DeleteCompositionProvider } from './delete-composition.provider';
import { ManageCompositionCategoriesProvider } from './manage-composition-categories.provider';
import { Category } from '../../categories/entities/category.entity';

/**
 * Fasadni servis za upravljanje kompozicijama.
 *
 * Delegira logiku na specijalizirane providere:
 * - FindCompositionProvider — pronalaženje i listanje
 * - CreateCompositionProvider — kreiranje novih SONG kompozicija
 * - UpdateCompositionProvider — ažuriranje polja
 * - DeleteCompositionProvider — brisanje
 * - ManageCompositionCategoriesProvider — upravljanje M:N relacijom s kategorijama
 *
 * EXERCISE kompozicije se ne kreiraju, ažuriraju ni brišu preko API-ja.
 */
@Injectable()
export class CompositionsService {
  constructor(
    /** Provider za pronalaženje kompozicija */
    private readonly findCompositionProvider: FindCompositionProvider,

    /** Provider za kreiranje kompozicija */
    private readonly createCompositionProvider: CreateCompositionProvider,

    /** Provider za ažuriranje kompozicija */
    private readonly updateCompositionProvider: UpdateCompositionProvider,

    /** Provider za brisanje kompozicija */
    private readonly deleteCompositionProvider: DeleteCompositionProvider,

    /** Provider za upravljanje kategorijama kompozicije */
    private readonly manageCompositionCategoriesProvider: ManageCompositionCategoriesProvider,
  ) {}

  /**
   * Kreira novu SONG kompoziciju.
   *
   * @param createCompositionDto - Podaci za kreiranje
   * @param userId - UUID vlasnika iz JWT-a
   * @returns Kreirana kompozicija
   */
  public async createComposition(
    createCompositionDto: CreateCompositionDto,
    userId: string,
  ): Promise<Composition> {
    return this.createCompositionProvider.createComposition(
      createCompositionDto,
      userId,
    );
  }

  /**
   * Dohvaća sve kompozicije dostupne korisniku.
   *
   * Vraća korisnikove SONG-ove + sve EXERCISE kompozicije.
   *
   * @param userId - UUID aktivnog korisnika iz JWT-a
   * @returns Lista kompozicija
   */
  public async findAll(userId: string): Promise<Composition[]> {
    return this.findCompositionProvider.findAllByUser(userId);
  }

  /**
   * Dohvaća kompoziciju po UUID-u.
   *
   * @param id - UUID kompozicije
   * @param userId - UUID aktivnog korisnika iz JWT-a
   * @returns Composition entitet
   * @throws NotFoundException ako kompozicija ne postoji
   */
  public async getCompositionById(
    id: string,
    userId: string,
  ): Promise<Composition> {
    const composition = await this.findCompositionProvider.findOneById(
      id,
      userId,
    );

    if (!composition) {
      throw new NotFoundException('Kompozicija nije pronađena');
    }

    return composition;
  }

  /**
   * Ažurira kompoziciju po UUID-u.
   *
   * @param updateCompositionDto - Polja za ažuriranje
   * @param id - UUID kompozicije
   * @param userId - UUID aktivnog korisnika iz JWT-a
   * @returns Ažurirana kompozicija
   */
  public async updateComposition(
    updateCompositionDto: UpdateCompositionDto,
    id: string,
    userId: string,
  ): Promise<Composition> {
    return this.updateCompositionProvider.updateComposition(
      updateCompositionDto,
      id,
      userId,
    );
  }

  /**
   * Briše kompoziciju po UUID-u.
   *
   * @param id - UUID kompozicije
   * @param userId - UUID aktivnog korisnika iz JWT-a
   * @returns Objekt s oznakom uspješnosti i ID-em
   */
  public async removeComposition(
    id: string,
    userId: string,
  ): Promise<{ deleted: boolean; id: string }> {
    return this.deleteCompositionProvider.deleteComposition(id, userId);
  }

  /**
   * Zamjenjuje cijeli set kategorija na kompoziciji (PUT semantika).
   *
   * @param compositionId - UUID kompozicije
   * @param categoryIds - Lista UUID-ova kategorija
   * @param userId - UUID aktivnog korisnika iz JWT-a
   * @returns Ažurirana kompozicija s kategorijama
   */
  public async setCategories(
    compositionId: string,
    categoryIds: string[],
    userId: string,
  ): Promise<Composition> {
    return this.manageCompositionCategoriesProvider.setCategories(
      compositionId,
      categoryIds,
      userId,
    );
  }

  /**
   * Dohvaća kategorije pridružene kompoziciji.
   *
   * @param compositionId - UUID kompozicije
   * @param userId - UUID aktivnog korisnika iz JWT-a
   * @returns Lista kategorija
   */
  public async getCategories(
    compositionId: string,
    userId: string,
  ): Promise<Category[]> {
    return this.manageCompositionCategoriesProvider.getCategories(
      compositionId,
      userId,
    );
  }
}
