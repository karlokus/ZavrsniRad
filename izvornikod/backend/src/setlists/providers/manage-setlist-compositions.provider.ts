import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Setlist } from '../entities/setlist.entity';
import { SetlistComposition } from '../entities/setlist-composition.entity';
import { Composition } from '../../compositions/entities/composition.entity';
import { AddCompositionToSetlistDto } from '../dtos/add-composition-to-setlist.dto';
import { ReorderSetlistDto } from '../dtos/reorder-setlist.dto';
import { FindSetlistProvider } from './find-setlist.provider';
import { FindCompositionProvider } from '../../compositions/providers/find-composition.provider';

/**
 * Provider za upravljanje vezama Setlist ↔ Composition (FZ-R19, FZ-R20).
 *
 * Operacije:
 * - addComposition: append na kraj ili insert na zadanu poziciju
 *   (uz pomak postojećih pjesama unutar transakcije)
 * - removeComposition: brisanje + kompaktacija pozicija
 * - reorder: kompletno preuređivanje preko (compositionId, position) lista
 */
@Injectable()
export class ManageSetlistCompositionsProvider {
  constructor(
    @InjectRepository(SetlistComposition)
    private readonly scRepository: Repository<SetlistComposition>,
    private readonly findSetlistProvider: FindSetlistProvider,
    private readonly findCompositionProvider: FindCompositionProvider,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Dodaje pjesmu u setlistu.
   * - validira vlasništvo setliste i pristup pjesmi
   * - sprečava duplikat (isti compositionId ne smije biti dvaput u istoj setlisti)
   * - ako je zadan position, ostale pjesme od te pozicije nadalje pomiču se +1
   */
  public async addComposition(
    setlistId: string,
    dto: AddCompositionToSetlistDto,
    userId: string,
  ): Promise<SetlistComposition> {
    const setlist = await this.findSetlistProvider.findOneById(
      setlistId,
      userId,
    );
    if (!setlist) throw new NotFoundException('Setlista nije pronađena');

    const composition = await this.findCompositionProvider.findOneById(
      dto.compositionId,
      userId,
    );
    if (!composition) throw new NotFoundException('Kompozicija nije pronađena');

    // Provjera duplikata (i unique constraint čuva ovo na DB razini)
    const existing = await this.scRepository.findOne({
      where: {
        setlist: { id: setlistId },
        composition: { id: dto.compositionId },
      },
    });
    if (existing) {
      throw new ConflictException('Pjesma je već u setlisti');
    }

    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(SetlistComposition);

      const count = await repo.count({
        where: { setlist: { id: setlistId } },
      });
      const targetPosition = dto.position ?? count + 1;

      // Pomakni postojeće pjesme ako se umeće u sredinu
      if (dto.position !== undefined && dto.position <= count) {
        await repo
          .createQueryBuilder()
          .update(SetlistComposition)
          .set({ position: () => '"position" + 1' })
          .where('"setlistId" = :setlistId AND "position" >= :pos', {
            setlistId,
            pos: dto.position,
          })
          .execute();
      }

      const sc = repo.create({
        setlist: { id: setlistId } as Setlist,
        composition: { id: dto.compositionId } as Composition,
        position: targetPosition > count + 1 ? count + 1 : targetPosition,
      });
      return repo.save(sc);
    });
  }

  /**
   * Uklanja pjesmu iz setliste i kompaktira pozicije.
   */
  public async removeComposition(
    setlistId: string,
    compositionId: string,
    userId: string,
  ): Promise<{ removed: boolean }> {
    const setlist = await this.findSetlistProvider.findOneById(
      setlistId,
      userId,
    );
    if (!setlist) throw new NotFoundException('Setlista nije pronađena');

    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(SetlistComposition);
      const target = await repo.findOne({
        where: {
          setlist: { id: setlistId },
          composition: { id: compositionId },
        },
      });
      if (!target) {
        throw new NotFoundException('Pjesma nije u setlisti');
      }
      const removedPos = target.position;
      await repo.delete(target.id);
      // Pomakni sve pozicije > removedPos za -1 (kompaktacija)
      await repo
        .createQueryBuilder()
        .update(SetlistComposition)
        .set({ position: () => '"position" - 1' })
        .where('"setlistId" = :setlistId AND "position" > :pos', {
          setlistId,
          pos: removedPos,
        })
        .execute();
      return { removed: true };
    });
  }

  /**
   * Preuređuje cijelu setlistu prema poslanoj listi.
   *
   * Validacija:
   * - lista mora pokriti SVE postojeće pjesme u setlisti (length match)
   * - sve pozicije moraju biti jedinstvene
   * - svaki compositionId mora postojati u setlisti
   *
   * Implementacija:
   * - radi se u transakciji
   * - PRVO postavi sve pozicije na (position + offset) gdje je offset > max
   *   da se izbjegne kršenje UNIQUE constrainta tijekom updatea
   *   (ako bi UNIQUE bio na position kolone, što nije naš slučaj — ali
   *   je defenzivno za buduće dodatke)
   */
  public async reorder(
    setlistId: string,
    dto: ReorderSetlistDto,
    userId: string,
  ): Promise<SetlistComposition[]> {
    const setlist = await this.findSetlistProvider.findOneById(
      setlistId,
      userId,
    );
    if (!setlist) throw new NotFoundException('Setlista nije pronađena');

    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(SetlistComposition);
      const existing = await repo.find({
        where: { setlist: { id: setlistId } },
        relations: ['composition'],
      });

      if (existing.length !== dto.items.length) {
        throw new BadRequestException(
          `Reorder lista mora sadržavati svih ${existing.length} pjesama setliste (poslano ${dto.items.length})`,
        );
      }

      const positions = dto.items.map((i) => i.position);
      const uniquePositions = new Set(positions);
      if (uniquePositions.size !== positions.length) {
        throw new BadRequestException('Pozicije moraju biti jedinstvene');
      }

      const idMap = new Map(existing.map((sc) => [sc.composition.id, sc]));
      // Validate all incoming compositionId-evi su u setlisti
      for (const item of dto.items) {
        if (!idMap.has(item.compositionId)) {
          throw new BadRequestException(
            `Kompozicija ${item.compositionId} nije u setlisti`,
          );
        }
      }

      // Apply: prvo postavi sve pozicije na privremenu vrijednost (negative offset)
      // da izbjegnemo bilo kakvu interferenciju indexa (defenzivno).
      for (const sc of existing) {
        sc.position = -sc.position;
        await repo.save(sc);
      }
      // Postavi konačne pozicije
      const result: SetlistComposition[] = [];
      for (const item of dto.items) {
        const sc = idMap.get(item.compositionId)!;
        sc.position = item.position;
        result.push(await repo.save(sc));
      }
      result.sort((a, b) => a.position - b.position);
      return result;
    });
  }
}
