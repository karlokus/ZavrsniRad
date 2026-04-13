import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Composition } from '../../compositions/entities/composition.entity';

/**
 * Entitet kategorije pjesama prema specifikaciji (sekcija 3.2).
 *
 * Kategorija je user-owned — svaka pripada točno jednom korisniku.
 * Kad se korisnik obriše, brišu se i sve njegove kategorije (CASCADE).
 * Korisnik može koristiti kategorije za organizaciju svog repertoara.
 *
 * Relacije:
 * - ManyToOne → User (vlasnik kategorije, onDelete: CASCADE)
 * - ManyToMany → Composition (inverzna strana, owning side je Composition)
 *
 * Relevantni FZ: R03, R04, R05, R07
 */
@Entity()
export class Category {
  /** UUID primarni ključ — automatski generiran */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * Vlasnik kategorije — ManyToOne relacija na User entitet.
   * eager: false jer ne trebamo cijelog korisnika pri svakom dohvatu,
   * ali koristimo relations: ['user'] kad trebamo provjeriti vlasništvo.
   * onDelete: 'CASCADE' — brisanje korisnika briše i sve njegove kategorije.
   */
  @ManyToOne(() => User, { nullable: false, eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  /** Naziv kategorije — obavezno, max 100 znakova */
  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  name!: string;

  /**
   * Boja kategorije u HEX formatu (npr. "#FF5733").
   * Nullable — korisnik ne mora odmah odabrati boju.
   */
  @Column({
    type: 'varchar',
    length: 7,
    nullable: true,
  })
  color?: string | null;

  // ── Kompozicije (M:N inverzna strana) ──
  // Owning side je Composition entitet (@JoinTable tamo)
  @ManyToMany(() => Composition, (composition) => composition.categories)
  compositions!: Composition[];

  /** Datum kreiranja kategorije — automatski postavljen pri kreiranju */
  @CreateDateColumn({
    type: 'timestamp',
  })
  createdAt!: Date;

  /** Datum ažuriranja kategorije */
  @UpdateDateColumn({
    type: 'timestamp',
  })
  updatedAt!: Date;
}
