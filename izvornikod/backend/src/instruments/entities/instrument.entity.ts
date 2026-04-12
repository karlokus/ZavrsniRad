import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Entitet instrumenta prema specifikaciji (sekcija 3.1.1).
 *
 * Katalog instrumenata koje korisnici mogu odabrati kao preferirani instrument.
 * Ovo je seeded/lookup tablica — instrumenti se unaprijed popunjavaju u bazu.
 *
 * Relacije:
 * - OneToMany → User (korisnik svira jedan instrument)
 * - OneToMany → CompositionFile (datoteka vezana uz instrument) — buduća implementacija
 */
@Entity()
export class Instrument {
  /** UUID primarni ključ — automatski generiran */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Naziv instrumenta (npr. "Gitara", "Klavir", "Violina") */
  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  instrumentName!: string;
}
