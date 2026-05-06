/**
 * Tipovi datoteka koje se mogu vezati uz kompoziciju (FZ-R08, FZ-R09).
 *
 * - SHEET_IMAGE     — slike notacije (PDF, PNG, JPG)
 * - AUDIO_RECORDING — audio snimke (MP3, WAV, OGG)
 * - MIDI            — MIDI datoteke za Tone.js vizualizaciju
 * - LYRICS_DOC      — tekstualni dokumenti s riječima (TXT, PDF)
 */
export enum FileType {
  SHEET_IMAGE = 'SHEET_IMAGE',
  AUDIO_RECORDING = 'AUDIO_RECORDING',
  MIDI = 'MIDI',
  LYRICS_DOC = 'LYRICS_DOC',
}
