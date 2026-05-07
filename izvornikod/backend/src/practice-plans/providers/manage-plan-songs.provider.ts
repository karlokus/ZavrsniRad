import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PracticePlan } from '../entities/practice-plan.entity';
import { PracticePlanSong } from '../entities/practice-plan-song.entity';
import { Composition } from '../../compositions/entities/composition.entity';
import { AddSongToPlanDto } from '../dtos/add-song-to-plan.dto';
import { ReorderPlanSongsDto } from '../dtos/reorder-plan-songs.dto';
import { FindPracticePlanProvider } from './find-practice-plan.provider';
import { FindCompositionProvider } from '../../compositions/providers/find-composition.provider';

/**
 * Provider za upravljanje pjesmama unutar plana (analogno setlist managementu).
 */
@Injectable()
export class ManagePlanSongsProvider {
  constructor(
    @InjectRepository(PracticePlanSong)
    private readonly songsRepo: Repository<PracticePlanSong>,
    private readonly findPlanProvider: FindPracticePlanProvider,
    private readonly findCompositionProvider: FindCompositionProvider,
    private readonly dataSource: DataSource,
  ) {}

  public async addSong(
    planId: string,
    dto: AddSongToPlanDto,
    userId: string,
  ): Promise<PracticePlanSong> {
    const plan = await this.findPlanProvider.findOneById(planId, userId);
    if (!plan) throw new NotFoundException('Plan nije pronađen');

    const composition = await this.findCompositionProvider.findOneById(
      dto.compositionId,
      userId,
    );
    if (!composition) throw new NotFoundException('Kompozicija nije pronađena');

    const existing = await this.songsRepo.findOne({
      where: {
        plan: { id: planId },
        composition: { id: dto.compositionId },
      },
    });
    if (existing) {
      throw new ConflictException('Pjesma je već u planu');
    }

    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(PracticePlanSong);
      const count = await repo.count({ where: { plan: { id: planId } } });
      const target = dto.position ?? count + 1;

      if (dto.position !== undefined && dto.position <= count) {
        await repo
          .createQueryBuilder()
          .update(PracticePlanSong)
          .set({ position: () => '"position" + 1' })
          .where('"planId" = :pid AND "position" >= :pos', {
            pid: planId,
            pos: dto.position,
          })
          .execute();
      }

      const sc = repo.create({
        plan: { id: planId } as PracticePlan,
        composition: { id: dto.compositionId } as Composition,
        position: target > count + 1 ? count + 1 : target,
      });
      return repo.save(sc);
    });
  }

  public async removeSong(
    planId: string,
    compositionId: string,
    userId: string,
  ): Promise<{ removed: boolean }> {
    const plan = await this.findPlanProvider.findOneById(planId, userId);
    if (!plan) throw new NotFoundException('Plan nije pronađen');

    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(PracticePlanSong);
      const target = await repo.findOne({
        where: { plan: { id: planId }, composition: { id: compositionId } },
      });
      if (!target) {
        throw new NotFoundException('Pjesma nije u planu');
      }
      const removedPos = target.position;
      await repo.delete(target.id);
      await repo
        .createQueryBuilder()
        .update(PracticePlanSong)
        .set({ position: () => '"position" - 1' })
        .where('"planId" = :pid AND "position" > :pos', {
          pid: planId,
          pos: removedPos,
        })
        .execute();
      return { removed: true };
    });
  }

  public async reorder(
    planId: string,
    dto: ReorderPlanSongsDto,
    userId: string,
  ): Promise<PracticePlanSong[]> {
    const plan = await this.findPlanProvider.findOneById(planId, userId);
    if (!plan) throw new NotFoundException('Plan nije pronađen');

    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(PracticePlanSong);
      const existing = await repo.find({
        where: { plan: { id: planId } },
        relations: ['composition'],
      });

      if (existing.length !== dto.items.length) {
        throw new BadRequestException(
          `Reorder lista mora sadržavati svih ${existing.length} pjesama plana (poslano ${dto.items.length})`,
        );
      }

      const positions = dto.items.map((i) => i.position);
      if (new Set(positions).size !== positions.length) {
        throw new BadRequestException('Pozicije moraju biti jedinstvene');
      }

      const idMap = new Map(existing.map((sc) => [sc.composition.id, sc]));
      for (const item of dto.items) {
        if (!idMap.has(item.compositionId)) {
          throw new BadRequestException(
            `Kompozicija ${item.compositionId} nije u planu`,
          );
        }
      }

      // Negate trick za izbjeganje moguceg UNIQUE problema
      for (const sc of existing) {
        sc.position = -sc.position;
        await repo.save(sc);
      }
      const result: PracticePlanSong[] = [];
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
