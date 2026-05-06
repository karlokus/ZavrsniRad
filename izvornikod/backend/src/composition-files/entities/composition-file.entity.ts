import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Composition } from '../../compositions/entities/composition.entity';
import { Instrument } from '../../instruments/entities/instrument.entity';
import { FileType } from '../enums/file-type.enum';

/**
 * Entitet datoteke vezane uz kompoziciju (FZ-R08, FZ-R09, FZ-R11–R13).
 *
 * Sadržaj datoteke živi u Backblaze B2 bucketu pod ključem `objectKey`,
 * a u DB se sprema samo metadata (ime, mime, veličina, opis).
 *
 * Relacije:
 * - ManyToOne → Composition (CASCADE) — brisanje pjesme briše sve njene datoteke
 *   (DB redak; B2 objekti se brišu zasebno preko DELETE endpointa)
 * - ManyToOne → Instrument (SET NULL, nullable) — datoteka može biti vezana
 *   uz specifičan instrument (npr. partitura za gitaru), ali ne mora
 */
@Entity()
export class CompositionFile {
  /** UUID primarni ključ */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Pripadajuća kompozicija; brisanje pjesme briše DB redak (CASCADE) */
  @ManyToOne(() => Composition, {
    nullable: false,
    eager: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'compositionId' })
  composition!: Composition;

  /**
   * Opcionalna veza na Instrument (npr. partitura za gitaru vs. klavir).
   * SET NULL: brisanje instrumenta ne briše datoteku.
   */
  @ManyToOne(() => Instrument, {
    nullable: true,
    eager: false,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'instrumentId' })
  instrument?: Instrument | null;

  /** Tip datoteke — kategorizacija za UI prikaz */
  @Column({ type: 'enum', enum: FileType, nullable: false })
  fileType!: FileType;

  /** Izvorno ime datoteke (s ekstenzijom) */
  @Column({ type: 'varchar', length: 255, nullable: false })
  fileName!: string;

  /**
   * Ključ objekta u B2 bucketu.
   * Format: `{userId}/{compositionId}/{uuid}-{filename}`
   * Drži ga zasebno od fileName-a jer se isti naziv može uploadati više puta.
   */
  @Column({ type: 'varchar', length: 500, nullable: false })
  objectKey!: string;

  /** MIME type (npr. "image/png", "audio/mpeg") */
  @Column({ type: 'varchar', length: 100, nullable: false })
  mimeType!: string;

  /**
   * Veličina datoteke u bajtima.
   *
   * NAPOMENA: ovo polje je dodatak izvan stroge specifikacije iz sekcije 3.5
   * dokumenta "Funkcionalni zahtjevi i model podataka". Dodano je radi:
   * - prikaza veličine u UI listi datoteka
   * - validacije kvota (MAX_FILE_SIZE_MB)
   * - lakše dijagnostike B2 troškova
   */
  @Column({ type: 'bigint', nullable: false })
  sizeBytes!: number;

  /** Opcionalni opis datoteke koji upisuje korisnik */
  @Column({ type: 'text', nullable: true })
  description?: string | null;

  /** Vrijeme uploada — automatski iz @CreateDateColumn-a */
  @CreateDateColumn({ type: 'timestamp' })
  uploadedAt!: Date;
}
