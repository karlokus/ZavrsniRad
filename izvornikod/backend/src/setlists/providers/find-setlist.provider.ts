import {
  ForbiddenException,
  Injectable,
  RequestTimeoutException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setlist } from '../entities/setlist.entity';

/**
 * Result tip za GET /setlists/:id sa izračunatim mastery prosjekom.
 *
 * masteryAverage je prosjek `(notes + lyrics + playing) / 3` preko svih
 * pjesama u setlisti — koristan za UI indicator "spremnost setliste".
 * null ako setlista nema niti jednu pjesmu.
 */
export interface SetlistWithMastery extends Setlist {
  masteryAverage: number | null;
  songCount: number;
}

@Injectable()
export class FindSetlistProvider {
  constructor(
    @InjectRepository(Setlist)
    private readonly setlistsRepository: Repository<Setlist>,
  ) {}

  /**
   * Pronalazi setlistu po UUID-u s provjerom vlasništva.
   * Ne učitava pjesme — to radi getOneWithCompositions kad treba.
   */
  public async findOneById(
    id: string,
    userId: string,
  ): Promise<Setlist | null> {
    const setlist = await this.setlistsRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!setlist) return null;

    if (setlist.user.id !== userId) {
      throw new ForbiddenException('Nemate pristup ovoj setlisti');
    }
    return setlist;
  }

  /**
   * Vraća setlistu s pjesmama (sortirane po position ASC), uključujući
   * artist + keySignature relacije za UI prikaz, te izračunati mastery
   * prosjek i broj pjesama.
   */
  public async getOneWithCompositions(
    id: string,
    userId: string,
  ): Promise<SetlistWithMastery | null> {
    const setlist = await this.setlistsRepository
      .createQueryBuilder('setlist')
      .leftJoinAndSelect('setlist.user', 'user')
      .leftJoinAndSelect('setlist.compositions', 'sc')
      .leftJoinAndSelect('sc.composition', 'composition')
      .leftJoinAndSelect('composition.artist', 'artist')
      .leftJoinAndSelect('composition.keySignature', 'keySignature')
      .where('setlist.id = :id', { id })
      .orderBy('sc.position', 'ASC')
      .getOne();

    if (!setlist) return null;
    if (setlist.user.id !== userId) {
      throw new ForbiddenException('Nemate pristup ovoj setlisti');
    }

    const items = setlist.compositions ?? [];
    const songCount = items.length;
    let masteryAverage: number | null = null;
    if (songCount > 0) {
      const sum = items.reduce((acc, sc) => {
        const c = sc.composition;
        const avg =
          ((c.notesMastery ?? 1) +
            (c.lyricsMastery ?? 1) +
            (c.playingMastery ?? 1)) /
          3;
        return acc + avg;
      }, 0);
      masteryAverage = Math.round((sum / songCount) * 100) / 100;
    }

    return Object.assign(setlist, { masteryAverage, songCount });
  }

  public async findAllByUser(userId: string): Promise<Setlist[]> {
    try {
      return await this.setlistsRepository.find({
        where: { user: { id: userId } },
        order: { name: 'ASC' },
      });
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
