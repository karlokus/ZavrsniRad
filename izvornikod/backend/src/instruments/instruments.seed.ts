import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Instrument } from './entities/instrument.entity';

/**
 * Seed provider za inicijalno popunjavanje kataloga instrumenata.
 *
 * Implementira OnModuleInit — NestJS automatski poziva onModuleInit()
 * pri pokretanju aplikacije. Provjerava je li tablica instrumenata prazna
 * i ako jest, ubacuje defaultne instrumente.
 *
 * Defaultni instrumenti: Harmonika, Klavir, Gitara, Violina,
 * Flauta, Saksofon, Truba, Bubnjevi.
 */
@Injectable()
export class InstrumentsSeedProvider implements OnModuleInit {
  private readonly logger = new Logger(InstrumentsSeedProvider.name);

  constructor(
    /** TypeORM repozitorij za Instrument entitet */
    @InjectRepository(Instrument)
    private readonly instrumentsRepository: Repository<Instrument>,
  ) {}

  /**
   * Seed metoda koja se poziva automatski na startup aplikacije.
   *
   * Flow:
   * 1. Provjeri broj zapisa u tablici instrumenata
   * 2. Ako tablica nije prazna — preskoči seed
   * 3. Ako je prazna — kreiraj i spremi defaultne instrumente
   */
  async onModuleInit(): Promise<void> {
    // Provjera broja zapisa u tablici
    const count = await this.instrumentsRepository.count();

    // Ako tablica nije prazna, preskoči seed
    if (count > 0) {
      this.logger.log(
        `Tablica instrumenata već sadrži ${count} zapisa — seed preskočen`,
      );
      return;
    }

    // Defaultni instrumenti za seed
    const defaultInstruments = [
      'Harmonika',
      'Klavir',
      'Gitara',
      'Violina',
      'Flauta',
      'Saksofon',
      'Truba',
      'Bubnjevi',
    ];

    // Kreiranje Instrument entiteta za svaki defaultni naziv
    const instruments = defaultInstruments.map((name) =>
      this.instrumentsRepository.create({ instrumentName: name }),
    );

    // Spremanje svih instrumenata u bazu odjednom
    await this.instrumentsRepository.save(instruments);

    this.logger.log(
      `Seed završen — ubačeno ${defaultInstruments.length} instrumenata`,
    );
  }
}
