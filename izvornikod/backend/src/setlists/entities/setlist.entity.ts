import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { SetlistComposition } from './setlist-composition.entity';

/**
 * Setlist — popis pjesama za nastup ili vježbu (FZ-R18, FZ-R19, FZ-R20).
 *
 * User-owned: brisanje korisnika briše sve njegove setliste (CASCADE).
 * Pjesme se vežu kroz SetlistComposition junction entitet sa pozicijom
 * (definiran redoslijed unutar setliste).
 */
@Entity()
export class Setlist {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, { nullable: false, eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @OneToMany(() => SetlistComposition, (sc) => sc.setlist)
  compositions?: SetlistComposition[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;
}
