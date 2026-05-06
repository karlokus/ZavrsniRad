import { Injectable, RequestTimeoutException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setlist } from '../entities/setlist.entity';
import { CreateSetlistDto } from '../dtos/create-setlist.dto';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class CreateSetlistProvider {
  constructor(
    @InjectRepository(Setlist)
    private readonly setlistsRepository: Repository<Setlist>,
  ) {}

  public async createSetlist(
    dto: CreateSetlistDto,
    userId: string,
  ): Promise<Setlist> {
    const setlist = this.setlistsRepository.create({
      ...dto,
      user: { id: userId } as User,
    });
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
