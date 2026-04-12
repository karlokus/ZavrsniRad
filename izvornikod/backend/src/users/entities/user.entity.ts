import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { SkillLevel } from '../enums/skill-level.enum';
import { Instrument } from '../../instruments/entities/instrument.entity';

/**
 * Entitet korisnika sustava.
 *
 * Predstavlja registriranog korisnika prema specifikaciji (sekcija 3.1).
 * Svaki korisnik ima email, hashiranu lozinku, opcionalni instrument
 * koji svira i razinu sviranja. Polje isBlocked nije u specifikaciji
 * ali je dio auth sustava za blokiranje korisničkih računa.
 *
 * Relacije:
 * - ManyToOne → Instrument (nullable) — instrument koji korisnik svira
 *
 * @see SkillLevel — enum za razinu sviranja (BEGINNER, INTERMEDIATE, ADVANCED)
 */
@Entity()
export class User {
  /** UUID primarni ključ — automatski generiran */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Email adresa korisnika — mora biti jedinstvena u sustavu */
  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    unique: true,
  })
  email!: string;

  /**
   * Hashirana lozinka (bcrypt).
   * @Exclude() sprječava slanje u API odgovorima kroz class-transformer.
   */
  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  @Exclude()
  passwordHash!: string;

  /** Ime korisnika */
  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  firstName!: string;

  /** Prezime korisnika */
  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  lastName!: string;

  /**
   * Preferirani instrument korisnika.
   * ManyToOne relacija na Instrument entitet — nullable jer korisnik
   * ne mora odmah odabrati instrument. Eager loading omogućuje
   * automatsko dohvaćanje instrumenta zajedno s korisnikom.
   */
  @ManyToOne(() => Instrument, { nullable: true, eager: true })
  @JoinColumn({ name: 'instrumentId' })
  instrument?: Instrument | null;

  /** Razina sviranja korisnika — nullable jer se može postaviti naknadno */
  @Column({
    type: 'enum',
    enum: SkillLevel,
    nullable: true,
  })
  skillLevel?: SkillLevel | null;

  /**
   * Oznaka je li korisnički račun blokiran.
   * Nije u specifikaciji — dodano za auth sustav.
   * AccessTokenGuard provjerava ovo polje i baca ForbiddenException ako je true.
   */
  @Column({
    default: false,
  })
  isBlocked!: boolean;

  /** Datum registracije korisnika — automatski postavljen pri kreiranju */
  @CreateDateColumn({
    type: 'timestamp',
  })
  createdAt!: Date;

  /** Datum zadnje izmjene profila — automatski ažuriran */
  @UpdateDateColumn({
    type: 'timestamp',
  })
  updatedAt!: Date;
}
