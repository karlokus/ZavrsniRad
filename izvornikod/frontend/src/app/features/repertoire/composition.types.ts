import { Artist, KeySignature } from '../../core/lookups/lookup.types';
import { Category } from '../categories/category.types';

export type CompositionType = 'SONG' | 'EXERCISE';

export interface Composition {
  id: string;
  type: CompositionType;
  title: string;
  artist?: Artist | null;
  keySignature?: KeySignature | null;
  tempoBpm?: number | null;
  description?: string | null;
  youtubeSongUrl?: string | null;
  youtubeInstrumentUrl?: string | null;
  notesMastery?: number;
  lyricsMastery?: number;
  playingMastery?: number;
  categories?: Category[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedCompositions {
  items: Composition[];
  total: number;
  page: number;
  limit: number;
}

export type CompositionSortBy = 'title' | 'createdAt' | 'updatedAt' | 'tempoBpm' | 'avgMastery';

export interface QueryCompositionsParams {
  search?: string;
  categoryId?: string;
  keySignatureId?: string;
  artistId?: string;
  type?: CompositionType;
  minMastery?: number;
  maxMastery?: number;
  sortBy?: CompositionSortBy;
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

export interface CreateCompositionDto {
  title: string;
  artistId?: string;
  keySignatureId?: string;
  tempoBpm?: number;
  description?: string;
  youtubeSongUrl?: string;
  youtubeInstrumentUrl?: string;
  notesMastery?: number;
  lyricsMastery?: number;
  playingMastery?: number;
}

export type UpdateCompositionDto = Partial<CreateCompositionDto>;
