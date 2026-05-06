import {
  Injectable,
  NotFoundException,
  RequestTimeoutException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setlist } from '../entities/setlist.entity';
import { UpdateSetlistDto } from '../dtos/update-setlist.dto';
import { FindSetlistProvider } from './find-setlist.provider';

@Injectable()
export class UpdateSetlistProvider {
  constructor(
    @InjectRepository(Setlist)
    private readonly setlistsRepository: Repository<Setlist>,
    private readonly findSetlistProvider: FindSetlistProvider,
  ) {}

  public async updateSetlist(
    id: string,
    dto: UpdateSetlistDto,
    userId: string,
  ): Promise<Setlist> {
    const setlist = await this.findSetlistProvider.findOneById(id, userId);
    if (!setlist) throw new NotFoundException('Setlista nije pronađena');

    setlist.name = dto.name ?? setlist.name;
    if (dto.description !== undefined) {
      setlist.description = dto.description;
    }

    try {
      return await this.setlistsRepository.save(setlist);
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
