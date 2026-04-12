import { Injectable, RequestTimeoutException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Instrument } from '../entities/instrument.entity';

/**
 * Provider za pronalaženje instrumenata u bazi podataka.
 *
 * Koristi se u:
 * - InstrumentsService — dohvaćanje instrumenta po ID-u i lista svih
 * - CreateInstrumentProvider — provjera duplikata po nazivu
 * - UpdateInstrumentProvider — dohvaćanje instrumenta prije ažuriranja
 * - Budući moduli — dohvaćanje instrumenta za relacije (exportan iz InstrumentsModule)
 */
@Injectable()
export class FindInstrumentProvider {
  constructor(
    /** TypeORM repozitorij za Instrument entitet */
    @InjectRepository(Instrument)
    private readonly instrumentsRepository: Repository<Instrument>,
  ) {}

  /**
   * Pronalazi instrument po UUID-u.
   *
   * @param id - UUID instrumenta
   * @returns Instrument entitet ili null ako ne postoji
   */
  public async findOneById(id: string): Promise<Instrument | null> {
    return await this.instrumentsRepository.findOneBy({ id });
  }

  /**
   * Pronalazi instrument po nazivu.
   *
   * Koristi se za provjeru duplikata pri kreiranju i ažuriranju.
   * Ako dođe do greške pri upitu u bazu, baca RequestTimeoutException.
   *
   * @param instrumentName - Naziv instrumenta
   * @returns Instrument entitet ili null ako ne postoji
   * @throws RequestTimeoutException — ako dođe do greške pri povezivanju s bazom
   */
  public async findOneByName(
    instrumentName: string,
  ): Promise<Instrument | null> {
    try {
      return await this.instrumentsRepository.findOneBy({ instrumentName });
    } catch (error) {
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

  /**
   * Dohvaća sve instrumente iz baze, sortirano po nazivu (A-Z).
   *
   * Koristi se za javni GET /instruments endpoint i za seed provjeru.
   *
   * @returns Lista svih instrumenata
   * @throws RequestTimeoutException — ako dođe do greške pri povezivanju s bazom
   */
  public async findAll(): Promise<Instrument[]> {
    try {
      // Sortiranje po nazivu instrumenta uzlazno (A-Z)
      return await this.instrumentsRepository.find({
        order: { instrumentName: 'ASC' },
      });
    } catch (error) {
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
