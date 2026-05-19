import { Injectable, computed, signal } from '@angular/core';

/**
 * Draft produced by a finished recording — handed to SessionReportPage,
 * which turns it into a CreatePracticeSessionDto after the user fills the
 * manual accuracy sliders (§6.4 pragmatic FZ-L07).
 */
export interface RecordedSession {
  compositionId: string;
  startedAt: string; // ISO
  completedAt: string; // ISO
  durationSeconds: number;
  tempoBpm: number;
}

/**
 * Root-provided (NOT route-scoped, unlike MidiPlayerService): the recording
 * must survive the navigation from the player route to the report route.
 * Holds only the wall-clock envelope of a practice session; the player
 * supplies the final BPM at stop() since the data model carries a single
 * `tempoBpm` per session.
 */
@Injectable({ providedIn: 'root' })
export class SessionRecorderService {
  private readonly _startedAt = signal<Date | null>(null);
  /** Finalized draft for SessionReportPage; cleared once consumed. */
  private readonly _lastRecording = signal<RecordedSession | null>(null);

  readonly isRecording = computed(() => this._startedAt() !== null);
  readonly startedAt = this._startedAt.asReadonly();
  readonly lastRecording = this._lastRecording.asReadonly();

  /** Begin a recording. Discards any unconsumed previous draft. */
  start(): void {
    this._lastRecording.set(null);
    this._startedAt.set(new Date());
  }

  /**
   * Finalize the current recording into a draft.
   * @returns the draft, or null if start() was never called.
   */
  stop(compositionId: string, tempoBpm: number): RecordedSession | null {
    const started = this._startedAt();
    if (!started) return null;
    const completed = new Date();
    const durationSeconds = Math.max(
      0,
      Math.round((completed.getTime() - started.getTime()) / 1000),
    );
    const draft: RecordedSession = {
      compositionId,
      startedAt: started.toISOString(),
      completedAt: completed.toISOString(),
      durationSeconds,
      tempoBpm: Math.round(tempoBpm),
    };
    this._lastRecording.set(draft);
    this._startedAt.set(null);
    return draft;
  }

  /** Abandon an in-progress recording without producing a draft. */
  cancel(): void {
    this._startedAt.set(null);
  }

  /** Read and clear the draft (call after a successful POST). */
  consume(): RecordedSession | null {
    const draft = this._lastRecording();
    this._lastRecording.set(null);
    return draft;
  }
}
