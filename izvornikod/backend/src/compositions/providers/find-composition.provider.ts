import {
  ForbiddenException,
  Injectable,
  RequestTimeoutException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Composition } from '../entities/composition.entity';
import { CompositionType } from '../enums/composition-type.enum';

/**
 * Provider za pronalaženje kompozicija.
 *
 * Metode:
 * - findOneById — dohvat po UUID-u s provjerom vlasništva
 * - findAllByUser — sve SONG kompozicije korisnika + sve EXERCISE
 *
 * Vlasništvo: SONG kompozicija je dostupna samo vlasniku,
 * EXERCISE je dostupan svim autenticiranim korisnicima.
 */
@Injectable()
export class FindCompositionProvider {
  constructor(
    @InjectRepository(Composition)
    private readonly compositionsRepository: Repository<Composition>,
  ) {}

  /**
   * Pronalazi kompoziciju po UUID-u s provjerom vlasništva.
   *
   * Pravila pristupa:
   * - SONG: samo vlasnik (composition.user.id === userId)
   * - EXERCISE: svi autenticirani korisnici
   *
   * @param id - UUID kompozicije
   * @param userId - UUID aktivnog korisnika iz JWT-a
   * @returns Composition entitet ili null ako ne postoji
   * @throws ForbiddenException ako korisnik nije vlasnik SONG kompozicije
   */
  public async findOneById(
    id: string,
    userId: string,
  ): Promise<Composition | null> {
    // Dohvat s relacijama za prikaz izvođača i tonaliteta
    const composition = await this.compositionsRepository.findOne({
      where: { id },
      relations: ['user', 'artist', 'keySignature', 'categories'],
    });

    // Kompozicija ne postoji
    if (!composition) return null;

    // Provjera vlasništva — EXERCISE je dostupan svima, SONG samo vlasniku
    if (
      composition.type === CompositionType.SONG &&
      composition.user?.id !== userId
    ) {
      throw new ForbiddenException('Nemate pristup ovoj kompoziciji');
    }

    return composition;
  }

  /**
   * Dohvaća sve kompozicije dostupne korisniku.
   *
   * Vraća:
   * - Sve SONG kompozicije čiji je vlasnik dani korisnik
   * - Sve EXERCISE kompozicije (dostupne svima)
   *
   * Sortirano po naslovu (A-Z).
   *
   * @param userId - UUID aktivnog korisnika iz JWT-a
   * @returns Lista kompozicija
   */
  public async findAllByUser(userId: string): Promise<Composition[]> {
    try {
      // Dohvat korisnikovih SONG-ova + svih EXERCISE-a
      return await this.compositionsRepository
        .createQueryBuilder('composition')
        .leftJoinAndSelect('composition.user', 'user')
        .leftJoinAndSelect('composition.artist', 'artist')
        .leftJoinAndSelect('composition.keySignature', 'keySignature')
        .where(
          '(composition.userId = :userId AND composition.type = :songType) OR composition.type = :exerciseType',
          {
            userId,
            songType: CompositionType.SONG,
            exerciseType: CompositionType.EXERCISE,
          },
        )
        .orderBy('composition.title', 'ASC')
        .getMany();
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
