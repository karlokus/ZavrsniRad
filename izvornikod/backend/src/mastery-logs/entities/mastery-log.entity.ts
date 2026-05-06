import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Composition } from '../../compositions/entities/composition.entity';
import { MasteryAspect } from '../enums/mastery-aspect.enum';

/**
 * Entitet za bilježenje povijesti promjena mastery razina (FZ-R15, FZ-R16, FZ-R17).
 *
 * Svaki put kad korisnik ažurira jedno od mastery polja na kompoziciji
 * (notesMastery, lyricsMastery, playingMastery), kreira se jedan ovakav zapis
 * sa starom i novom vrijednošću. Time se omogućuje grafički prikaz napretka
 * kroz vrijeme (line chart) u dashboardu.
 *
 * Append-only — zapisi se nikad ne ažuriraju ni brišu API-jem;
 * brišu se samo CASCADE-om kad se obriše parent kompozicija.
 *
 * Vlasništvo se nasljeđuje preko parent Composition entiteta —
 * provjera u find provideru ide kroz composition.user.id.
 *
 * Index na (compositionId, changedAt) za brzo dohvaćanje povijesti
 * sortirane kronološki.
 */
@Entity()
@Index('IDX_mastery_log_composition_changed_at', [
  'composition',
  'changedAt',
])
export class MasteryLog {
  /** UUID primarni ključ */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * Pripadajuća kompozicija — ManyToOne relacija.
   * onDelete: 'CASCADE' — brisanje kompozicije briše sve njene logove.
   */
  @ManyToOne(() => Composition, {
    nullable: false,
    eager: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'compositionId' })
  composition!: Composition;

  /** Aspekt naučenosti čija se promjena bilježi */
  @Column({ type: 'enum', enum: MasteryAspect, nullable: false })
  aspect!: MasteryAspect;

  /** Stara vrijednost mastery polja (1-5) */
  @Column({ type: 'smallint', nullable: false })
  oldValue!: number;

  /** Nova vrijednost mastery polja (1-5) */
  @Column({ type: 'smallint', nullable: false })
  newValue!: number;

  /** Vrijeme promjene — automatski iz @CreateDateColumn-a */
  @CreateDateColumn({ type: 'timestamp' })
  changedAt!: Date;
}
