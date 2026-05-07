import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { PracticePlan } from './practice-plan.entity';
import { Composition } from '../../compositions/entities/composition.entity';

/**
 * Junction entitet plan ↔ pjesma s pozicijom u listi.
 * UNIQUE (planId, compositionId) sprečava duplikate.
 */
@Entity()
@Unique('UQ_practice_plan_song_pair', ['plan', 'composition'])
export class PracticePlanSong {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => PracticePlan, (p) => p.songs, {
    nullable: false,
    eager: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'planId' })
  plan!: PracticePlan;

  @ManyToOne(() => Composition, {
    nullable: false,
    eager: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'compositionId' })
  composition!: Composition;

  @Column({ type: 'int', nullable: false })
  position!: number;
}
