import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KeySignature } from './entities/key-signature.entity';
import { KeySignatureType } from './enums/key-signature-type.enum';

/**
 * Seed provider za inicijalno popunjavanje kataloga tonaliteta.
 *
 * Implementira OnModuleInit — NestJS automatski poziva onModuleInit()
 * pri pokretanju aplikacije. Provjerava je li tablica tonaliteta prazna
 * i ako jest, ubacuje 30 standardnih tonaliteta (15 dur + 15 mol).
 *
 * Nazivi koriste hrvatsku notaciju (H dur, B dur, a mol...).
 * rootNote koristi englesku notaciju (B, Bb, C#...) za interoperabilnost.
 */
@Injectable()
export class KeySignaturesSeedProvider implements OnModuleInit {
  private readonly logger = new Logger(KeySignaturesSeedProvider.name);

  constructor(
    /** TypeORM repozitorij za KeySignature entitet */
    @InjectRepository(KeySignature)
    private readonly keySignaturesRepository: Repository<KeySignature>,
  ) {}

  /**
   * Seed metoda koja se poziva automatski na startup aplikacije.
   *
   * Flow:
   * 1. Provjeri broj zapisa u tablici tonaliteta
   * 2. Ako tablica nije prazna — preskoči seed
   * 3. Ako je prazna — kreiraj i spremi 30 defaultnih tonaliteta
   */
  async onModuleInit(): Promise<void> {
    // Provjera broja zapisa u tablici
    const count = await this.keySignaturesRepository.count();

    // Ako tablica nije prazna, preskoči seed
    if (count > 0) {
      this.logger.log(
        `Tablica tonaliteta već sadrži ${count} zapisa — seed preskočen`,
      );
      return;
    }

    // Defaultni tonaliteti za seed — 15 durskih + 15 molskih
    const defaultKeySignatures: {
      name: string;
      type: KeySignatureType;
      rootNote: string;
    }[] = [
      // ── Durske ljestvice (15) ──
      { name: 'C dur', type: KeySignatureType.MAJOR, rootNote: 'C' },
      { name: 'G dur', type: KeySignatureType.MAJOR, rootNote: 'G' },
      { name: 'D dur', type: KeySignatureType.MAJOR, rootNote: 'D' },
      { name: 'A dur', type: KeySignatureType.MAJOR, rootNote: 'A' },
      { name: 'E dur', type: KeySignatureType.MAJOR, rootNote: 'E' },
      { name: 'H dur', type: KeySignatureType.MAJOR, rootNote: 'B' },
      { name: 'Fis dur', type: KeySignatureType.MAJOR, rootNote: 'F#' },
      { name: 'Cis dur', type: KeySignatureType.MAJOR, rootNote: 'C#' },
      { name: 'F dur', type: KeySignatureType.MAJOR, rootNote: 'F' },
      { name: 'B dur', type: KeySignatureType.MAJOR, rootNote: 'Bb' },
      { name: 'Es dur', type: KeySignatureType.MAJOR, rootNote: 'Eb' },
      { name: 'As dur', type: KeySignatureType.MAJOR, rootNote: 'Ab' },
      { name: 'Des dur', type: KeySignatureType.MAJOR, rootNote: 'Db' },
      { name: 'Ges dur', type: KeySignatureType.MAJOR, rootNote: 'Gb' },
      { name: 'Ces dur', type: KeySignatureType.MAJOR, rootNote: 'Cb' },

      // ── Molske ljestvice (15) ──
      { name: 'a mol', type: KeySignatureType.MINOR, rootNote: 'A' },
      { name: 'e mol', type: KeySignatureType.MINOR, rootNote: 'E' },
      { name: 'h mol', type: KeySignatureType.MINOR, rootNote: 'B' },
      { name: 'fis mol', type: KeySignatureType.MINOR, rootNote: 'F#' },
      { name: 'cis mol', type: KeySignatureType.MINOR, rootNote: 'C#' },
      { name: 'gis mol', type: KeySignatureType.MINOR, rootNote: 'G#' },
      { name: 'dis mol', type: KeySignatureType.MINOR, rootNote: 'D#' },
      { name: 'ais mol', type: KeySignatureType.MINOR, rootNote: 'A#' },
      { name: 'd mol', type: KeySignatureType.MINOR, rootNote: 'D' },
      { name: 'g mol', type: KeySignatureType.MINOR, rootNote: 'G' },
      { name: 'c mol', type: KeySignatureType.MINOR, rootNote: 'C' },
      { name: 'f mol', type: KeySignatureType.MINOR, rootNote: 'F' },
      { name: 'b mol', type: KeySignatureType.MINOR, rootNote: 'Bb' },
      { name: 'es mol', type: KeySignatureType.MINOR, rootNote: 'Eb' },
      { name: 'as mol', type: KeySignatureType.MINOR, rootNote: 'Ab' },
    ];

    // Kreiranje KeySignature entiteta za svaki defaultni tonalitet
    const keySignatures = defaultKeySignatures.map((ks) =>
      this.keySignaturesRepository.create(ks),
    );

    // Spremanje svih tonaliteta u bazu odjednom
    await this.keySignaturesRepository.save(keySignatures);

    this.logger.log(
      `Seed završen — ubačeno ${defaultKeySignatures.length} tonaliteta`,
    );
  }
}
