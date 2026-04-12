import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * Entitet izvođača prema specifikaciji (sekcija 3.3.3).
 *
 * Shared katalog tablica — svi korisnici dijele iste izvođače.
 * Naziv je denormaliziran (npr. "Oliver Dragojević", "The Beatles")
 * jer nije potrebno odvajanje ime/prezime za izvođače.
 *
 * Relacije:
 * - OneToMany → Composition (buduća implementacija)
 */
@Entity()
export class Artist {
  /** UUID primarni ključ — automatski generiran */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * Naziv izvođača — denormalizirano "Prezime Ime" ili naziv benda.
   * Max 200 znakova jer može sadržavati puni naziv benda.
   */
  @Column({
    type: 'varchar',
    length: 200,
    nullable: false,
  })
  name!: string;

  /** Datum kreiranja zapisa — automatski postavljen pri kreiranju */
  @CreateDateColumn({
    type: 'timestamp',
  })
  createdAt!: Date;
}
