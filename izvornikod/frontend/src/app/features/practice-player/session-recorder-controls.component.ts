import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { Button } from '../../shared/ui/button/button';
import { Icon } from '../../shared/ui/icon/icon';
import { SessionRecorderService } from '../practice-sessions/session-recorder.service';
import { MidiPlayerService } from './midi-player.service';

function mmss(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * Session recorder controls (§6.3 / §6.4). Marks startedAt, shows a live
 * elapsed timer, and on "Završi sesiju" finalizes the draft (capturing the
 * player's current BPM) and routes to SessionReportPage for manual metrics.
 */
@Component({
  selector: 'app-session-recorder-controls',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Icon],
  template: `
    <div class="rec">
      @if (!recorder.isRecording()) {
        <button appButton variant="primary" (click)="begin()">
          <app-icon name="mic" [size]="15" /> Započni sesiju
        </button>
        <span class="hint">Bilježi vrijeme i tempo vježbanja.</span>
      } @else {
        <span class="dot" aria-hidden="true"></span>
        <span class="elapsed mono">{{ elapsedLabel() }}</span>
        <button appButton variant="accent" (click)="finish()">
          <app-icon name="check" [size]="15" /> Završi sesiju
        </button>
        <button appButton variant="ghost" size="sm" (click)="recorder.cancel()">
          Odustani
        </button>
      }
    </div>
  `,
  styles: [
    `
      .rec {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }
      .hint {
        font-size: 12px;
        color: var(--muted);
      }
      .elapsed {
        font-size: 14px;
        font-weight: 600;
      }
      .dot {
        width: 9px;
        height: 9px;
        border-radius: 50%;
        background: var(--danger);
        animation: pulse 1.2s ease-in-out infinite;
      }
      @keyframes pulse {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.35;
        }
      }
    `,
  ],
})
export class SessionRecorderControls {
  readonly compositionId = input.required<string>();

  protected readonly recorder = inject(SessionRecorderService);
  private readonly player = inject(MidiPlayerService);
  private readonly router = inject(Router);

  private readonly now = signal(Date.now());

  protected readonly elapsedLabel = computed(() => {
    const started = this.recorder.startedAt();
    if (!started) return '0:00';
    return mmss((this.now() - started.getTime()) / 1000);
  });

  constructor() {
    const timer = setInterval(() => this.now.set(Date.now()), 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  protected begin(): void {
    this.now.set(Date.now());
    this.recorder.start();
  }

  protected finish(): void {
    this.player.pause();
    const draft = this.recorder.stop(this.compositionId(), this.player.bpm());
    if (!draft) return;
    // Route param carries the compositionId: no PracticeSession exists yet
    // (SessionReportPage creates it on submit — §6.4).
    void this.router.navigate(['/practice', 'session', this.compositionId(), 'report']);
  }
}
