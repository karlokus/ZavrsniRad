import { Instrument } from '../../core/lookups/lookup.types';

export type FileType = 'SHEET_IMAGE' | 'AUDIO_RECORDING' | 'MIDI' | 'LYRICS_DOC';

export interface CompositionFile {
  id: string;
  fileType: FileType;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  description?: string | null;
  instrument?: Instrument | null;
  uploadedAt: string;
  /** Presigned download URL — only present on GET /composition-files/:id */
  downloadUrl?: string;
}

export interface UploadFileDto {
  fileType: FileType;
  instrumentId?: string;
  description?: string;
}

/** Emitted by CompositionFilesApiService.uploadWithProgress (§6.5 dialog). */
export type UploadProgress =
  | { status: 'progress'; percent: number }
  | { status: 'done'; file: CompositionFile };

/** Parsed MIDI data returned by GET /composition-files/:id/midi-data */
export interface ParsedMidiData {
  durationSeconds: number;
  ppq: number;
  tempos: { bpm: number; ticks: number; time: number }[];
  timeSignatures: { ticks: number; timeSignature: number[] }[];
  tracks: {
    name: string;
    instrument: string;
    channel: number;
    notes: {
      midi: number;
      name: string;
      time: number;
      duration: number;
      velocity: number;
    }[];
  }[];
}
