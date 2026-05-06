import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setlist } from '../entities/setlist.entity';
import { FindSetlistProvider } from './find-setlist.provider';

@Injectable()
export class DeleteSetlistProvider {
  constructor(
    @InjectRepository(Setlist)
    private readonly setlistsRepository: Repository<Setlist>,
    private readonly findSetlistProvider: FindSetlistProvider,
  ) {}

  public async deleteSetlist(
    id: string,
    userId: string,
  ): Promise<{ deleted: boolean; id: string }> {
    const setlist = await this.findSetlistProvider.findOneById(id, userId);
    if (!setlist) throw new NotFoundException('Setlista nije pronađena');

    const result = await this.setlistsRepository.delete(id);
    return { deleted: (result.affected ?? 0) > 0, id };
  }
}
