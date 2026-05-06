import { Injectable, NotFoundException } from '@nestjs/common';
import { Setlist } from '../entities/setlist.entity';
import { CreateSetlistDto } from '../dtos/create-setlist.dto';
import { UpdateSetlistDto } from '../dtos/update-setlist.dto';
import { AddCompositionToSetlistDto } from '../dtos/add-composition-to-setlist.dto';
import { ReorderSetlistDto } from '../dtos/reorder-setlist.dto';
import { CreateSetlistProvider } from './create-setlist.provider';
import {
  FindSetlistProvider,
  SetlistWithMastery,
} from './find-setlist.provider';
import { UpdateSetlistProvider } from './update-setlist.provider';
import { DeleteSetlistProvider } from './delete-setlist.provider';
import { ManageSetlistCompositionsProvider } from './manage-setlist-compositions.provider';

/**
 * Fasadni servis za Setlist operacije (FZ-R18, FZ-R19, FZ-R20).
 */
@Injectable()
export class SetlistsService {
  constructor(
    private readonly createProvider: CreateSetlistProvider,
    private readonly findProvider: FindSetlistProvider,
    private readonly updateProvider: UpdateSetlistProvider,
    private readonly deleteProvider: DeleteSetlistProvider,
    private readonly manageProvider: ManageSetlistCompositionsProvider,
  ) {}

  public createSetlist(dto: CreateSetlistDto, userId: string) {
    return this.createProvider.createSetlist(dto, userId);
  }

  public findAll(userId: string) {
    return this.findProvider.findAllByUser(userId);
  }

  public async getSetlistById(
    id: string,
    userId: string,
  ): Promise<SetlistWithMastery> {
    const setlist = await this.findProvider.getOneWithCompositions(id, userId);
    if (!setlist) throw new NotFoundException('Setlista nije pronađena');
    return setlist;
  }

  public updateSetlist(id: string, dto: UpdateSetlistDto, userId: string) {
    return this.updateProvider.updateSetlist(id, dto, userId);
  }

  public removeSetlist(id: string, userId: string) {
    return this.deleteProvider.deleteSetlist(id, userId);
  }

  public addComposition(
    setlistId: string,
    dto: AddCompositionToSetlistDto,
    userId: string,
  ) {
    return this.manageProvider.addComposition(setlistId, dto, userId);
  }

  public removeComposition(
    setlistId: string,
    compositionId: string,
    userId: string,
  ) {
    return this.manageProvider.removeComposition(
      setlistId,
      compositionId,
      userId,
    );
  }

  public reorder(setlistId: string, dto: ReorderSetlistDto, userId: string) {
    return this.manageProvider.reorder(setlistId, dto, userId);
  }
}
