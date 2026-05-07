import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Midi } from '@tonejs/midi';
import { FindCompositionFileProvider } from './find-composition-file.provider';
import { FileStorageProvider } from './file-storage.provider';
import { FileType } from '../enums/file-type.enum';

/**
 * Parsirani izlaz za frontend Tone.js vizualizaciju (FZ-L01).
 *
 * Struktura prati `@tonejs/midi` model — vraća header (BPM, time signature)
 * i listu trakova s notama. Note imaju time/duration u sekundama (apsolutno
 * vrijeme od početka), pitch kao MIDI broj 0-127 i naziv (C4, F#5...).
 */
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

/**
 * Provider za parsiranje MIDI datoteka iz B2 storage-a (FZ-L01).
 *
 * Flow:
 * 1. Dohvati metadata + provjera vlasništva (FindCompositionFileProvider)
 * 2. Validiraj fileType=MIDI
 * 3. Stream sadržaj iz B2 → buffer → @tonejs/midi parser
 * 4. Mapiraj u sažeti JSON (samo ono što frontend treba)
 *
 * Bez DB caching-a u MVP-u; svaka request re-parsira (ms operacija).
 */
@Injectable()
export class MidiParserProvider {
  constructor(
    private readonly findFileProvider: FindCompositionFileProvider,
    private readonly fileStorageProvider: FileStorageProvider,
  ) {}

  public async parse(fileId: string, userId: string): Promise<ParsedMidiData> {
    const file = await this.findFileProvider.findOneById(fileId, userId);
    if (!file) {
      throw new NotFoundException('Datoteka nije pronađena');
    }
    if (file.fileType !== FileType.MIDI) {
      throw new BadRequestException(
        `Datoteka nije MIDI tipa (fileType=${file.fileType})`,
      );
    }

    const { stream } = await this.fileStorageProvider.getStream(file.objectKey);
    const buffer = await this.streamToBuffer(stream);

    const midi = new Midi(buffer);

    return {
      durationSeconds: midi.duration,
      ppq: midi.header.ppq,
      tempos: midi.header.tempos.map((t) => ({
        bpm: t.bpm,
        ticks: t.ticks,
        time: t.time ?? 0,
      })),
      timeSignatures: midi.header.timeSignatures.map((ts) => ({
        ticks: ts.ticks,
        timeSignature: ts.timeSignature,
      })),
      tracks: midi.tracks.map((track) => ({
        name: track.name,
        instrument: track.instrument?.name ?? '',
        channel: track.channel,
        notes: track.notes.map((n) => ({
          midi: n.midi,
          name: n.name,
          time: n.time,
          duration: n.duration,
          velocity: n.velocity,
        })),
      })),
    };
  }

  private async streamToBuffer(
    stream: NodeJS.ReadableStream,
  ): Promise<Buffer> {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(
        Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string),
      );
    }
    return Buffer.concat(chunks);
  }
}
