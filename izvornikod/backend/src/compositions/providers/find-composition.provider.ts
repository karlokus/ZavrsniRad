import {
  ForbiddenException,
  Injectable,
  RequestTimeoutException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Composition } from '../entities/composition.entity';
import { CompositionType } from '../enums/composition-type.enum';
import { QueryCompositionsDto } from '../dtos/query-compositions.dto';

/**
 * Rezultat paginirane pretrage kompozicija.
 */
export interface PaginatedCompositions {
  items: Composition[];
  total: number;
  page: number;
  limit: number;
}

/**
 * SQL izraz za izračun prosjeka mastery polja.
 * Koristi COALESCE jer su polja nullable s defaultom 1.
 */
const AVG_MASTERY_SQL =
  '(COALESCE(composition.notesMastery, 1) + COALESCE(composition.lyricsMastery, 1) + COALESCE(composition.playingMastery, 1)) / 3.0';

/**
 * Provider za pronalaženje kompozicija.
 *
 * Metode:
 * - findOneById — dohvat po UUID-u s provjerom vlasništva
 * - findAllByUser — paginirana pretraga/filter/sort kompozicija (FZ-R05–R07)
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
    const composition = await this.compositionsRepository.findOne({
      where: { id },
      relations: [
        'user',
        'artist',
        'keySignature',
        'categories',
        'targetAreas',
      ],
    });

    if (!composition) return null;

    if (
      composition.type === CompositionType.SONG &&
      composition.user?.id !== userId
    ) {
      throw new ForbiddenException('Nemate pristup ovoj kompoziciji');
    }

    return composition;
  }

  /**
   * Paginirana pretraga kompozicija s dinamičkim filterima i sortiranjem (FZ-R05–R07).
   *
   * Vraća sve SONG kompozicije korisnika i sve EXERCISE kompozicije,
   * filtrirane prema poljima u QueryCompositionsDto.
   *
   * Implementacijske napomene:
   * - Koristi createQueryBuilder zbog dinamičkih WHERE/JOIN klauzula
   * - innerJoin na categories se dodaje samo kad je categoryId postavljen
   *   (inače M:N join nepotrebno umnažja redove)
   * - DISTINCT je obavezan jer M:N join na composition_category može
   *   producirati duplikate retke
   * - avgMastery je SQL izraz; addSelect ga eksponira za ORDER BY
   *
   * @param userId - UUID aktivnog korisnika iz JWT-a
   * @param query - DTO s filter/sort/paginacija parametrima
   * @returns Paginirani rezultat { items, total, page, limit }
   */
  public async findAllByUser(
    userId: string,
    query: QueryCompositionsDto,
  ): Promise<PaginatedCompositions> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const sortBy = query.sortBy ?? 'title';
    const sortOrder = query.sortOrder ?? 'ASC';

    try {
      const qb = this.compositionsRepository
        .createQueryBuilder('composition')
        .leftJoinAndSelect('composition.artist', 'artist')
        .leftJoinAndSelect('composition.keySignature', 'keySignature')
        .leftJoinAndSelect('composition.user', 'user');

      qb.where(
        '((composition.userId = :userId AND composition.type = :songType) OR composition.type = :exerciseType)',
        {
          userId,
          songType: CompositionType.SONG,
          exerciseType: CompositionType.EXERCISE,
        },
      );

      if (query.search) {
        qb.andWhere('composition.title ILIKE :search', {
          search: `%${query.search}%`,
        });
      }

      if (query.categoryId) {
        qb.innerJoin(
          'composition.categories',
          'filterCategory',
          'filterCategory.id = :categoryId',
          { categoryId: query.categoryId },
        );
      }

      if (query.keySignatureId) {
        qb.andWhere('composition.keySignatureId = :keySignatureId', {
          keySignatureId: query.keySignatureId,
        });
      }

      if (query.artistId) {
        qb.andWhere('composition.artistId = :artistId', {
          artistId: query.artistId,
        });
      }

      if (query.type) {
        qb.andWhere('composition.type = :filterType', {
          filterType: query.type,
        });
      }

      if (query.minMastery !== undefined) {
        qb.andWhere(`${AVG_MASTERY_SQL} >= :minMastery`, {
          minMastery: query.minMastery,
        });
      }

      if (query.maxMastery !== undefined) {
        qb.andWhere(`${AVG_MASTERY_SQL} <= :maxMastery`, {
          maxMastery: query.maxMastery,
        });
      }

      if (query.dateFrom) {
        qb.andWhere('composition.createdAt >= :dateFrom', {
          dateFrom: query.dateFrom,
        });
      }

      if (query.dateTo) {
        qb.andWhere('composition.createdAt <= :dateTo', {
          dateTo: query.dateTo,
        });
      }

      // Sortiranje:
      // - skalarna polja (title, createdAt, ...) → direktno na composition aliasu
      // - avgMastery je computed izraz koji se prosljeđuje sirov u ORDER BY
      //
      // Napomena o paginaciji: koristimo offset/limit (direktno SQL OFFSET/LIMIT)
      // umjesto skip/take jer skip/take aktivira DISTINCT pagination subquery
      // koji u Postgresu zahtijeva da svi ORDER BY izrazi postoje u SELECT listi —
      // što ne vrijedi za naš avgMastery raw izraz.
      if (sortBy === 'avgMastery') {
        qb.orderBy(AVG_MASTERY_SQL, sortOrder);
      } else {
        const sortColumnMap: Record<string, string> = {
          title: 'composition.title',
          createdAt: 'composition.createdAt',
          updatedAt: 'composition.updatedAt',
          tempoBpm: 'composition.tempoBpm',
        };
        qb.orderBy(sortColumnMap[sortBy], sortOrder);
      }

      // Stabilan secondary sort (id) za deterministički poredak kod tied vrijednosti
      qb.addOrderBy('composition.id', 'ASC');

      // Total prije OFFSET/LIMIT
      const total = await qb.getCount();

      qb.offset((page - 1) * limit).limit(limit);
      const items = await qb.getMany();

      return { items, total, page, limit };
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
