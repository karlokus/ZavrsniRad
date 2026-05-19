import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastService } from '../../core/notifications/toast.service';
import { formatApiMessage } from '../../core/errors/format-api-message';
import { Card } from '../../shared/ui/card/card';
import { Button } from '../../shared/ui/button/button';
import { CreatePracticeSessionDto } from './practice-session.types';
import { PracticeSessionsApiService } from './practice-sessions-api.service';
import { RecordedSession, SessionRecorderService } from './session-recorder.service';

function mmss(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * Session report (§6.4 — pragmatic FZ-L07). The recorder draft supplies the
 * automatic envelope (startedAt/completedAt/duration/tempoBpm); the user
 * fills the three accuracy metrics manually (true automatic scoring needs
 * mic + pitch detection + DTW — out of scope, optional Faza 3 mic-assist).
 * Submit → POST /practice-sessions → composition detail.
 *
 * NOTE: route `:id` carries the compositionId, not a session id — no
 * PracticeSession exists until this page POSTs it.
 */
@Component({
  selector: 'app-session-report-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Card, Button],
  template: `
    @if (draft(); as d) {
      <div class="report-wrap">
        <h1 class="report-title">Izvještaj sesije</h1>

        <app-card title="Zabilježeno">
          <dl class="auto-list">
            <div><dt>Trajanje</dt><dd class="mono">{{ durationLabel() }}</dd></div>
            <div><dt>Tempo</dt><dd class="mono">{{ d.tempoBpm }} BPM</dd></div>
            <div><dt>Početak</dt><dd class="mono">{{ startedLabel() }}</dd></div>
            <div><dt>Kraj</dt><dd class="mono">{{ completedLabel() }}</dd></div>
          </dl>
        </app-card>

        <app-card title="Ocjena izvedbe (0–100)">
          <form [formGroup]="form" (ngSubmit)="submit()" class="metrics">
            @for (m of metrics; track m.key) {
              <div class="metric">
                <div class="metric__head">
                  <label [for]="m.key">{{ m.label }}</label>
                  <span class="metric__val mono">{{ form.controls[m.key].value }}</span>
                </div>
                <input
                  [id]="m.key"
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  [formControlName]="m.key"
                />
              </div>
            }

            <div class="actions">
              <button appButton type="button" variant="ghost" (click)="cancel()">
                Odustani
              </button>
              <button appButton type="submit" variant="accent" [disabled]="saving()">
                {{ saving() ? 'Spremam…' : 'Spremi sesiju' }}
              </button>
            </div>
          </form>
        </app-card>
      </div>
    }
  `,
  styles: [
    `
      .report-wrap {
        display: flex;
        flex-direction: column;
        gap: 16px;
        max-width: 560px;
      }
      .report-title {
        font-family: var(--font-serif);
        font-size: 28px;
      }
      .auto-list {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      .auto-list div {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        font-size: 14px;
      }
      .auto-list dt {
        color: var(--muted);
      }
      .auto-list dd {
        font-weight: 500;
      }
      .metrics {
        display: flex;
        flex-direction: column;
        gap: 18px;
      }
      .metric__head {
        display: flex;
        justify-content: space-between;
        font-size: 13px;
        margin-bottom: 6px;
      }
      .metric__val {
        color: var(--accent);
        font-weight: 600;
      }
      .metric input[type='range'] {
        width: 100%;
        accent-color: var(--accent);
      }
      .actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        padding-top: 4px;
      }
    `,
  ],
})
export class SessionReportPage implements OnInit {
  /** Route `practice/session/:id/report` — `:id` is the compositionId. */
  readonly id = input.required<string>();

  private readonly recorder = inject(SessionRecorderService);
  private readonly api = inject(PracticeSessionsApiService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly draft = signal<RecordedSession | null>(null);
  protected readonly saving = signal(false);

  protected readonly metrics = [
    { key: 'noteAccuracy', label: 'Točnost nota' },
    { key: 'rhythmAccuracy', label: 'Točnost ritma' },
    { key: 'tempoStability', label: 'Stabilnost tempa' },
  ] as const;

  protected readonly form = this.fb.nonNullable.group({
    noteAccuracy: 75,
    rhythmAccuracy: 75,
    tempoStability: 75,
  });

  protected durationLabel = (): string => mmss(this.draft()?.durationSeconds ?? 0);
  protected startedLabel = (): string =>
    this.draft() ? new Date(this.draft()!.startedAt).toLocaleTimeString() : '';
  protected completedLabel = (): string =>
    this.draft() ? new Date(this.draft()!.completedAt).toLocaleTimeString() : '';

  ngOnInit(): void {
    const rec = this.recorder.lastRecording();
    if (!rec || rec.compositionId !== this.id()) {
      this.toast.info('Nema zabilježene sesije za prikaz.');
      void this.router.navigate(['/repertoire', this.id()]);
      return;
    }
    this.draft.set(rec);
  }

  protected submit(): void {
    const rec = this.draft();
    if (!rec || this.saving()) return;
    this.saving.set(true);
    const v = this.form.getRawValue();
    const dto: CreatePracticeSessionDto = {
      compositionId: rec.compositionId,
      noteAccuracy: v.noteAccuracy,
      rhythmAccuracy: v.rhythmAccuracy,
      tempoStability: v.tempoStability,
      tempoBpm: rec.tempoBpm,
      durationSeconds: rec.durationSeconds,
      startedAt: rec.startedAt,
      completedAt: rec.completedAt,
    };
    this.api.create(dto).subscribe({
      next: () => {
        this.recorder.consume();
        this.toast.success('Sesija spremljena.');
        // SessionsHistoryPage nije rutiran u ovom koraku — composition
        // detail je pragmatičan landing (session stats žive ondje).
        void this.router.navigate(['/repertoire', rec.compositionId]);
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.error(formatApiMessage(err?.error?.message));
      },
    });
  }

  protected cancel(): void {
    const rec = this.recorder.consume();
    void this.router.navigate(['/repertoire', rec?.compositionId ?? this.id()]);
  }
}
