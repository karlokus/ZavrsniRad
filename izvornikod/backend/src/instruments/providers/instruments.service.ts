import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Instrument } from '../entities/instrument.entity';
import { CreateInstrumentDto } from '../dtos/create-instrument.dto';
import { UpdateInstrumentDto } from '../dtos/update-instrument.dto';
import { FindInstrumentProvider } from './find-instrument.provider';
import { CreateInstrumentProvider } from './create-instrument.provider';
import { UpdateInstrumentProvider } from './update-instrument.provider';

/**
 * Fasadni servis za upravljanje instrumentima.
 *
 * Pruža sučelje za InstrumentsController delegirajući operacije
 * specijaliziranim providerima. Pokriva CRUD operacije nad katalogom
 * instrumenata prema specifikaciji (sekcija 3.1.1).
 */
@Injectable()
export class InstrumentsService {
  constructor(
    /** TypeORM repozitorij za direktne operacije (delete) */
    @InjectRepository(Instrument)
    private readonly instrumentsRepository: Repository<Instrument>,

    /** Provider za pronalaženje instrumenata */
    private readonly findInstrumentProvider: FindInstrumentProvider,
    /** Provider za kreiranje instrumenata */
    private readonly createInstrumentProvider: CreateInstrumentProvider,
    /** Provider za ažuriranje instrumenata */
    private readonly updateInstrumentProvider: UpdateInstrumentProvider,
  ) {}

  /**
   * Kreira novi instrument — delegira na CreateInstrumentProvider.
   *
   * @param createInstrumentDto - Podaci za kreiranje instrumenta
   * @returns Kreirani Instrument entitet
   */
  public async createInstrument(
    createInstrumentDto: CreateInstrumentDto,
  ): Promise<Instrument> {
    return this.createInstrumentProvider.createInstrument(createInstrumentDto);
  }

  /**
   * Dohvaća sve instrumente iz kataloga.
   *
   * Javno dostupan endpoint — koristi se na registraciji
   * za prikaz liste instrumenata korisniku.
   *
   * @returns Lista svih instrumenata sortirano po nazivu (A-Z)
   */
  public async findAll(): Promise<Instrument[]> {
    return this.findInstrumentProvider.findAll();
  }

  /**
   * Dohvaća instrument po ID-u.
   *
   * @param id - UUID instrumenta
   * @returns Instrument entitet
   * @throws NotFoundException — ako instrument ne postoji
   */
  public async getInstrumentById(id: string): Promise<Instrument> {
    // Pronalaženje instrumenta po ID-u
    const instrument = await this.findInstrumentProvider.findOneById(id);

    if (!instrument) {
      throw new NotFoundException('Instrument nije pronađen');
    }

    return instrument;
  }

  /**
   * Ažurira instrument — delegira na UpdateInstrumentProvider.
   *
   * @param updateInstrumentDto - Polja za ažuriranje
   * @param id - UUID instrumenta
   * @returns Ažurirani Instrument entitet
   */
  public async updateInstrument(
    updateInstrumentDto: UpdateInstrumentDto,
    id: string,
  ): Promise<Instrument> {
    return this.updateInstrumentProvider.updateInstrument(
      updateInstrumentDto,
      id,
    );
  }

  /**
   * Briše instrument iz kataloga.
   *
   * @param id - UUID instrumenta za brisanje
   * @returns Objekt s oznakom uspješnosti i ID-em obrisanog instrumenta
   */
  public async removeInstrument(
    id: string,
  ): Promise<{ deleted: boolean; id: string }> {
    // Brisanje instrumenta iz baze — affected > 0 znači da je brisanje uspjelo
    const result = await this.instrumentsRepository.delete(id);
    return { deleted: (result.affected ?? 0) > 0, id };
  }
}
