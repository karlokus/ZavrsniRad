import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { KeySignatureType } from '../enums/key-signature-type.enum';

/**
 * Entitet tonaliteta prema specifikaciji (sekcija 3.3.1).
 *
 * Shared katalog tablica — svi korisnici dijele iste tonalitete.
 * Seeded na startup s 30 standardnih tonaliteta (15 dur + 15 mol).
 *
 * Relacije:
 * - OneToMany → Composition (buduća implementacija)
 */
@Entity()
export class KeySignature {
  /** UUID primarni ključ — automatski generiran */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * Naziv tonaliteta u hrvatskoj notaciji.
   * Unique jer ne smiju postojati duplikati (npr. "C dur", "a mol").
   */
  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
    unique: true,
  })
  name!: string;

  /**
   * Tip tonaliteta — durski (MAJOR) ili molski (MINOR).
   * Koristi KeySignatureType enum.
   */
  @Column({
    type: 'enum',
    enum: KeySignatureType,
    nullable: false,
  })
  type!: KeySignatureType;

  /**
   * Temeljna nota tonaliteta u engleskoj notaciji.
   * Koristi englesku notaciju za interoperabilnost (C, C#, Db, Eb, ...).
   */
  @Column({
    type: 'varchar',
    length: 3,
    nullable: false,
  })
  rootNote!: string;
}
