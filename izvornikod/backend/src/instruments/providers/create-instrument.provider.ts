import {
  ConflictException,
  Injectable,
  RequestTimeoutException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateInstrumentDto } from '../dtos/create-instrument.dto';
import { Instrument } from '../entities/instrument.entity';
import { FindInstrumentProvider } from './find-instrument.provider';

/**
 * Provider za kreiranje novog instrumenta u bazi podataka.
 *
 * Provjerava duplikat po nazivu prije kreiranja i baca
 * ConflictException ako instrument s istim nazivom već postoji.
 */
@Injectable()
export class CreateInstrumentProvider {
  constructor(
    /** Provider za provjeru postoji li instrument s istim nazivom */
    private readonly findInstrumentProvider: FindInstrumentProvider,

    /** TypeORM repozitorij za Instrument entitet */
    @InjectRepository(Instrument)
    private readonly instrumentsRepository: Repository<Instrument>,
  ) {}

  /**
   * Kreira novi instrument u bazi podataka.
   *
   * Flow:
   * 1. Provjera postoji li instrument s istim nazivom
   * 2. Kreiranje Instrument entiteta
   * 3. Spremanje u bazu s error handling-om za duplikat naziva
   *
   * @param createInstrumentDto - Podaci za kreiranje instrumenta (instrumentName)
   * @returns Kreirani Instrument entitet
   * @throws ConflictException — ako instrument s istim nazivom već postoji
   * @throws RequestTimeoutException — ako dođe do greške pri povezivanju s bazom
   */
  public async createInstrument(
    createInstrumentDto: CreateInstrumentDto,
  ): Promise<Instrument> {
    // Provjera postoji li instrument s istim nazivom
    const existing = await this.findInstrumentProvider.findOneByName(
      createInstrumentDto.instrumentName,
    );

    if (existing) {
      throw new ConflictException(
        'Instrument s ovim nazivom već postoji u katalogu',
      );
    }

    // Kreiranje Instrument entiteta
    const newInstrument = this.instrumentsRepository.create(
      createInstrumentDto,
    );

    try {
      // Spremanje instrumenta u bazu
      return await this.instrumentsRepository.save(newInstrument);
    } catch (error: unknown) {
      // Hvatanje PostgreSQL unique constraint greške za instrumentName
      if (error instanceof Error && 'detail' in error) {
        const detail = (error as { detail: string }).detail;
        if (detail.includes('instrumentName')) {
          throw new ConflictException('Naziv instrumenta mora biti jedinstven');
        }
      }
      // Sve ostale greške → generička poruka
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
