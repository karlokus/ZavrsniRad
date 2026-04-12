import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Artist } from '../../artists/entities/artist.entity';
import { KeySignature } from '../../key-signatures/entities/key-signature.entity';
import { CompositionType } from '../enums/composition-type.enum';

/**
 * Centralni entitet sustava — pjesma ili vježba u repertoaru.
 *
 * Dva tipa:
 * - SONG — korisnikova pjesma (user-owned, userId != null)
 * - EXERCISE — generirana vježba (userId = null, read-only)
 *
 * ManyToOne relacije:
 * - User (CASCADE) — brisanje korisnika briše sve njegove kompozicije
 * - Artist (SET NULL) — brisanje izvođača ne briše kompoziciju
 * - KeySignature (SET NULL) — brisanje tonaliteta ne briše kompoziciju
 *
 * Mastery polja (notesMastery, lyricsMastery, playingMastery) prate
 * razinu naučenosti po aspektima (1-5 ljestvica).
 */
@Entity()
export class Composition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ── Vlasnik kompozicije ──
  // Nullable jer EXERCISE nema vlasnika
  @ManyToOne(() => User, { nullable: true, eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  // ── Tip kompozicije (SONG ili EXERCISE) ──
  @Column({ type: 'enum', enum: CompositionType, nullable: false })
  type: CompositionType;

  // ── Naziv kompozicije ──
  @Column({ type: 'varchar', length: 255, nullable: false })
  title: string;

  // ── Izvođač (shared lookup tablica) ──
  @ManyToOne(() => Artist, { nullable: true, eager: false, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'artistId' })
  artist: Artist;

  // ── Tonalitet (shared lookup tablica) ──
  @ManyToOne(() => KeySignature, {
    nullable: true,
    eager: false,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'keySignatureId' })
  keySignature: KeySignature;

  // ── Tempo u udarcima po minuti ──
  @Column({ type: 'int', nullable: true })
  tempoBpm: number;

  // ── Dodatne bilješke o kompoziciji ──
  @Column({ type: 'text', nullable: true })
  description: string;

  // ── YouTube link na originalnu izvedbu ──
  @Column({ type: 'varchar', length: 500, nullable: true })
  youtubeSongUrl: string;

  // ── YouTube link na instrumentalnu verziju ──
  @Column({ type: 'varchar', length: 500, nullable: true })
  youtubeInstrumentUrl: string;

  // ── Status naučenosti nota (1-5) ──
  @Column({ type: 'smallint', nullable: true, default: 1 })
  notesMastery: number;

  // ── Status naučenosti riječi (1-5) ──
  @Column({ type: 'smallint', nullable: true, default: 1 })
  lyricsMastery: number;

  // ── Status naučenosti sviranja (1-5) ──
  @Column({ type: 'smallint', nullable: true, default: 1 })
  playingMastery: number;

  // ── Automatski timestampovi ──
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
