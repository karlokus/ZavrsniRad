import { Injectable, NgZone, OnDestroy, computed, inject, signal } from '@angular/core';
import { Part, PolySynth, Synth, getContext, getTransport, start } from 'tone';
import { ParsedMidiData } from './composition-file.types';

type MidiNote = ParsedMidiData['tracks'][0]['notes'][0];
type ScheduledNote = { time: string; note: MidiNote };

/**
 * NOT root-provided: this owns Tone.Transport / synth / a 20fps ticker.
 * It is provided at the `practice/:compositionId` route (see app.routes.ts),
 * so leaving the player deactivates that route's injector and Angular calls
 * `ngOnDestroy` automatically — Tone teardown without manual page wiring.
 */
@Injectable()
export class MidiPlayerService implements OnDestroy {
  private readonly zone = inject(NgZone);

  // ── Public signal API ───────────────────────────────────────────────────────

  readonly parsedMidi = signal<ParsedMidiData | null>(null);
  readonly isPlaying = signal(false);
  /** Playback position in score-seconds (at original tempo). */
  readonly currentTime = signal(0);
  /** User-controlled BPM (defaults to MIDI's first tempo event on load). */
  readonly bpm = signal(120);

  readonly originalBpm = computed(() => this.parsedMidi()?.tempos[0]?.bpm ?? 120);
  readonly tempoRatio = computed(() => this.bpm() / this.originalBpm());
  readonly duration = computed(() => this.parsedMidi()?.durationSeconds ?? 0);

  /** All notes flattened across tracks, sorted by start time. */
  readonly allNotes = computed((): MidiNote[] => {
    const midi = this.parsedMidi();
    if (!midi) return [];
    return midi.tracks.flatMap((t) => t.notes).sort((a, b) => a.time - b.time);
  });

  /**
   * Index of the last note whose `time <= currentTime`.
   * Piano-roll uses this to highlight the active column.
   */
  readonly activeNoteIndex = computed((): number => {
    const notes = this.allNotes();
    const t = this.currentTime();
    if (!notes.length) return -1;
    let lo = 0, hi = notes.length - 1, result = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (notes[mid].time <= t) { result = mid; lo = mid + 1; }
      else hi = mid - 1;
    }
    return result;
  });

  // ── Private Tone.js state ───────────────────────────────────────────────────

  private _synth: PolySynth | null = null;
  private _part: Part<ScheduledNote> | null = null;
  private _tickerEventId: number | null = null;
  /** Cached origBpm — avoids reading signals from audio callbacks. */
  private _origBpm = 120;

  // ── Public methods ──────────────────────────────────────────────────────────

  load(parsed: ParsedMidiData): void {
    this._teardown();

    this.parsedMidi.set(parsed);
    this._origBpm = parsed.tempos[0]?.bpm ?? 120;
    this.bpm.set(this._origBpm);
    this.currentTime.set(0);

    const transport = getTransport();
    transport.stop();
    transport.bpm.value = this._origBpm;

    this._synth = new PolySynth(Synth, { envelope: { release: 0.1 } }).toDestination();

    const ppq = transport.PPQ;
    const origBpm = this._origBpm;
    const notes = parsed.tracks.flatMap((t) => t.notes);

    // Schedule in ticks so the Part scales naturally when Transport.bpm changes.
    this._part = new Part<ScheduledNote>(
      (time, { note }) => {
        // Scale note duration to match the current playback tempo.
        const scaledDuration = note.duration * (origBpm / transport.bpm.value);
        this._synth?.triggerAttackRelease(note.name, scaledDuration, time, note.velocity);
      },
      notes.map((n) => ({ time: `${Math.round((n.time * origBpm) / 60 * ppq)}i`, note: n })),
    );
    this._part.start(0);

    const dur = parsed.durationSeconds;

    // 20 fps position ticker — updates currentTime from Transport ticks.
    this._tickerEventId = transport.scheduleRepeat(() => {
      const scoreTime = (transport.ticks / ppq) * (60 / origBpm);
      this.zone.run(() => {
        if (scoreTime >= dur) {
          transport.stop();
          this.isPlaying.set(false);
          this.currentTime.set(dur);
        } else {
          this.currentTime.set(scoreTime);
        }
      });
    }, 0.05);
  }

  async play(): Promise<void> {
    if (getContext().state !== 'running') await start();
    getTransport().start();
    this.isPlaying.set(true);
  }

  pause(): void {
    getTransport().pause();
    this.isPlaying.set(false);
  }

  stop(): void {
    getTransport().stop();
    this.isPlaying.set(false);
    this.currentTime.set(0);
  }

  /** Seek to `t` score-seconds; resumes playback if currently playing. */
  seek(t: number): void {
    const wasPlaying = this.isPlaying();
    const transport = getTransport();
    transport.stop();
    const clamped = Math.max(0, Math.min(t, this.duration()));
    transport.ticks = Math.round((clamped * this._origBpm) / 60 * transport.PPQ);
    this.currentTime.set(clamped);
    if (wasPlaying) {
      transport.start();
      this.isPlaying.set(true);
    }
  }

  setBpm(b: number): void {
    this.bpm.set(b);
    getTransport().bpm.value = b;
  }

  ngOnDestroy(): void {
    this._teardown();
  }

  // ── Private ─────────────────────────────────────────────────────────────────

  private _teardown(): void {
    const transport = getTransport();
    transport.stop();
    if (this._tickerEventId !== null) {
      transport.clear(this._tickerEventId);
      this._tickerEventId = null;
    }
    this._part?.stop();
    this._part?.dispose();
    this._part = null;
    this._synth?.dispose();
    this._synth = null;
    this.isPlaying.set(false);
  }
}
