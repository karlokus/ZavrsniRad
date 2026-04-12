import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Composition } from '../entities/composition.entity';
import { FindCompositionProvider } from './find-composition.provider';

/**
 * Provider za brisanje kompozicija.
 *
 * Provjerava vlasništvo preko FindCompositionProvider
 * prije izvršavanja brisanja iz baze.
 */
@Injectable()
export class DeleteCompositionProvider {
  constructor(
    /** TypeORM repozitorij za Composition entitet */
    @InjectRepository(Composition)
    private readonly compositionsRepository: Repository<Composition>,

    /** Provider za dohvat s provjerom vlasništva */
    private readonly findCompositionProvider: FindCompositionProvider,
  ) {}

  /**
   * Briše kompoziciju po UUID-u.
   *
   * Flow:
   * 1. Dohvati kompoziciju s provjerom vlasništva
   * 2. Ako ne postoji → NotFoundException
   * 3. Obriši iz baze
   *
   * @param id - UUID kompozicije za brisanje
   * @param userId - UUID aktivnog korisnika iz JWT-a
   * @returns Objekt s oznakom uspješnosti i ID-em obrisane kompozicije
   * @throws NotFoundException ako kompozicija ne postoji
   * @throws ForbiddenException ako korisnik nije vlasnik (iz FindCompositionProvider)
   */
  public async deleteComposition(
    id: string,
    userId: string,
  ): Promise<{ deleted: boolean; id: string }> {
    // Dohvat s provjerom vlasništva — baca ForbiddenException ako nije vlasnik
    const composition = await this.findCompositionProvider.findOneById(
      id,
      userId,
    );

    // Kompozicija ne postoji
    if (!composition) {
      throw new NotFoundException('Kompozicija nije pronađena');
    }

    // Brisanje iz baze
    const result = await this.compositionsRepository.delete(id);

    return { deleted: (result.affected ?? 0) > 0, id };
  }
}
