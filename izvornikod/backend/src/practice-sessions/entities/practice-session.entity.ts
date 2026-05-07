import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Composition } from '../../compositions/entities/composition.entity';

/**
 * PracticeSession — zabilježena sesija vježbanja kompozicije
 * (FZ-L07, FZ-L08, FZ-L09, FZ-L10).
 *
 * Tri performanse metrike (noteAccuracy, rhythmAccuracy, tempoStability)
 * su decimal(5,2) u rasponu 0-100 (postoci). Trajanje u sekundama,
 * stvarni tempo u BPM-u.
 *
 * Index na (userId, startedAt) ubrzava agregacije za dashboard
 * trendove (FZ-D06).
 */
@Entity()
@Index('IDX_practice_session_user_started', ['user', 'startedAt'])
@Check('"noteAccuracy" >= 0 AND "noteAccuracy" <= 100')
@Check('"rhythmAccuracy" >= 0 AND "rhythmAccuracy" <= 100')
@Check('"tempoStability" >= 0 AND "tempoStability" <= 100')
@Check('"durationSeconds" >= 0')
@Check('"tempoBpm" >= 20 AND "tempoBpm" <= 300')
export class PracticeSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, { nullable: false, eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ManyToOne(() => Composition, {
    nullable: false,
    eager: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'compositionId' })
  composition!: Composition;

  /** Postotak točnosti pogađanja nota (0-100) */
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: false })
  noteAccuracy!: number;

  /** Postotak ritmičke točnosti (0-100) */
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: false })
  rhythmAccuracy!: number;

  /** Postotak stabilnosti tempa (0-100) */
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: false })
  tempoStability!: number;

  /** Stvarni tempo izvedbe (BPM) */
  @Column({ type: 'int', nullable: false })
  tempoBpm!: number;

  /** Trajanje sesije u sekundama */
  @Column({ type: 'int', nullable: false })
  durationSeconds!: number;

  @Column({ type: 'timestamp', nullable: false })
  startedAt!: Date;

  @Column({ type: 'timestamp', nullable: false })
  completedAt!: Date;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;
}
