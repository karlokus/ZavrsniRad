import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Setlist } from './setlist.entity';
import { Composition } from '../../compositions/entities/composition.entity';

/**
 * Junction entitet između Setlist i Composition koji čuva poziciju u listi.
 *
 * UNIQUE constraint na (setlistId, compositionId) sprečava duple unose
 * iste pjesme u istu setlistu. Pozicija je 1-based int.
 *
 * CASCADE u oba smjera:
 * - brisanje setliste briše sve njene SetlistComposition zapise
 * - brisanje pjesme automatski izbacuje pjesmu iz svih setlista
 */
@Entity()
@Unique('UQ_setlist_composition_pair', ['setlist', 'composition'])
export class SetlistComposition {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Setlist, (s) => s.compositions, {
    nullable: false,
    eager: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'setlistId' })
  setlist!: Setlist;

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
