import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Composition } from '../../compositions/entities/composition.entity';
import { TargetArea } from '../enums/target-area.enum';

/**
 * Entitet ciljnog područja vježbanja vezanog uz kompoziciju (FZ-L11, FZ-L12).
 *
 * Sub-resurs Compositiona — definira se prilikom kreiranja pjesme/vježbe.
 * Korisnik označava koje aspekte sviranja kompozicija trenira (npr. ritam,
 * preciznost nota, ljestvice...) zajedno s razinom težine i relativnom
 * težinom (postocima) kojom kompozicija doprinosi tom aspektu.
 *
 * Vlasništvo se nasljeđuje preko parent Composition entiteta — provjera
 * ide kroz composition.user.id u find provideru.
 *
 * Relacije:
 * - ManyToOne → Composition (CASCADE) — brisanje kompozicije briše sve
 *   pripadajuće target areas
 *
 * Constraintovi:
 * - difficultyLevel ∈ [1, 10]
 * - weightPercentage ∈ [0, 100]
 */
@Entity()
@Check('"difficultyLevel" >= 1 AND "difficultyLevel" <= 10')
@Check('"weightPercentage" >= 0 AND "weightPercentage" <= 100')
export class CompositionTargetArea {
  /** UUID primarni ključ — automatski generiran */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * Pripadajuća kompozicija — ManyToOne relacija na Composition entitet.
   * onDelete: 'CASCADE' — brisanje kompozicije briše i sve target area zapise.
   */
  @ManyToOne(() => Composition, {
    nullable: false,
    eager: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'compositionId' })
  composition!: Composition;

  /** Aspekt sviranja koji se trenira (enum) */
  @Column({ type: 'enum', enum: TargetArea, nullable: false })
  targetArea!: TargetArea;

  /** Razina težine (1-10) */
  @Column({ type: 'smallint', nullable: false })
  difficultyLevel!: number;

  /**
   * Postotak doprinosa kompozicije ovom target area-u (0-100).
   * Decimal radi finije granulacije (npr. 33.33).
   */
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: false })
  weightPercentage!: number;

  /** Datum kreiranja zapisa */
  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  /** Datum zadnjeg ažuriranja zapisa */
  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;
}
