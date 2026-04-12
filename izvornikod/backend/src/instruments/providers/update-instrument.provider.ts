import {
  BadRequestException,
  ConflictException,
  Injectable,
  RequestTimeoutException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateInstrumentDto } from '../dtos/update-instrument.dto';
import { Instrument } from '../entities/instrument.entity';
import { FindInstrumentProvider } from './find-instrument.provider';

/**
 * Provider za ažuriranje instrumenta u bazi podataka.
 *
 * Dohvaća instrument po ID-u, primjenjuje promjene iz DTO-a
 * i sprema ažurirani entitet. Koristi nullish coalescing (??)
 * za zadržavanje postojeće vrijednosti ako polje nije poslano.
 */
@Injectable()
export class UpdateInstrumentProvider {
  constructor(
    /** Provider za pronalaženje instrumenta prije ažuriranja */
    private readonly findInstrumentProvider: FindInstrumentProvider,

    /** TypeORM repozitorij za Instrument entitet */
    @InjectRepository(Instrument)
    private readonly instrumentsRepository: Repository<Instrument>,
  ) {}

  /**
   * Ažurira instrument u bazi podataka.
   *
   * Dohvaća instrument iz baze, primjenjuje promjene iz DTO-a
   * i sprema ažurirani entitet.
   *
   * @param updateInstrumentDto - Polja za ažuriranje (instrumentName?)
   * @param id - UUID instrumenta koji se ažurira
   * @returns Ažurirani Instrument entitet
   * @throws BadRequestException — ako instrument ne postoji
   * @throws ConflictException — ako ažuriranje uzrokuje duplikat naziva
   * @throws RequestTimeoutException — ako dođe do greške pri povezivanju s bazom
   */
  public async updateInstrument(
    updateInstrumentDto: UpdateInstrumentDto,
    id: string,
  ): Promise<Instrument> {
    // Dohvaćanje trenutnog instrumenta iz baze
    const instrument = await this.findInstrumentProvider.findOneById(id);

    if (!instrument) {
      throw new BadRequestException('Instrument ne postoji');
    }

    // Ažuriranje naziva — zadržava postojeću vrijednost ako polje nije poslano
    instrument.instrumentName =
      updateInstrumentDto.instrumentName ?? instrument.instrumentName;

    try {
      // Spremanje ažuriranog instrumenta u bazu
      return await this.instrumentsRepository.save(instrument);
    } catch (error: unknown) {
      // Hvatanje PostgreSQL unique constraint greške za instrumentName
      if (error instanceof Error && 'detail' in error) {
        const detail = (error as { detail: string }).detail;
        if (detail.includes('instrumentName')) {
          throw new ConflictException('Naziv instrumenta mora biti jedinstven');
        }
      }
      // Sve ostale greške → generička poruka
      throw new RequestTimeoutException(
        'Unable to process your request at the moment, please try later',
        { description: 'Error connecting to the database' },
      );
    }
  }
}
