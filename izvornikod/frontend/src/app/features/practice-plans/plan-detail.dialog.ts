import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ToastService } from '../../core/notifications/toast.service';
import { formatApiMessage } from '../../core/errors/format-api-message';
import { Dialog } from '../../shared/ui/dialog/dialog';
import { Button } from '../../shared/ui/button/button';
import { Spinner } from '../../shared/ui/spinner/spinner';
import { Icon } from '../../shared/ui/icon/icon';
import { Combobox, ComboOption } from '../../shared/ui/combobox/combobox';
import { DragList } from '../../shared/ui/drag-list/drag-list';
import { CompositionsApiService } from '../repertoire/compositions-api.service';
import { PracticePlansApiService } from './practice-plans-api.service';
import { PracticePlan, PracticePlanSong } from './practice-plan.types';

export interface PlanDetailDialogData {
  planId: string;
}

/**
 * Plan detail (§6.6). Song reorder via CDK DragDrop (DragList) → maps the
 * FULL new order to `{ compositionId, position: idx+1 }[]` for
 * PUT /practice-plans/:id/songs/reorder (backend requires the complete
 * list with unique positions). Also add/remove songs, mark complete
 * (FZ-L18), delete. Closes with `true` if anything changed so the
 * calendar refetches.
 */
@Component({
  selector: 'app-plan-detail-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Dialog, Button, Spinner, Icon, Combobox, DragList],
  template: `
    <app-dialog [title]="plan()?.name ?? 'Plan'" (dismiss)="close()">
      @if (loading()) {
        <div class="center"><app-spinner /></div>
      } @else if (plan(); as p) {
        <div class="pd">
          <div class="pd__meta">
            <span><app-icon name="calendar" [size]="14" /> {{ p.scheduledDate }}</span>
            <span><app-icon name="clock" [size]="14" /> {{ p.durationMinutes }} min</span>
            @if (p.isRecurring) {
              <span class="badge">Rutina</span>
            }
            @if (p.isCompleted) {
              <span class="badge badge--ok">
                <app-icon name="check" [size]="12" /> Završeno
              </span>
            }
          </div>

          @if (p.notes) {
            <p class="pd__notes">{{ p.notes }}</p>
          }

          <div class="pd__section">
            <h3 class="pd__h">Pjesme</h3>
            @if (songs().length === 0) {
              <p class="muted">Nema pjesama u planu.</p>
            } @else {
              <app-drag-list [items]="songs()" (reordered)="onReorder($event)">
                <ng-template #row let-s let-i="index">
                  <div class="song">
                    <span class="song__pos mono">{{ i + 1 }}</span>
                    <span class="song__title">{{ s.composition.title }}</span>
                    <button
                      appButton
                      variant="ghost"
                      iconOnly
                      size="sm"
                      aria-label="Ukloni"
                      (click)="removeSong(s)"
                    >
                      <app-icon name="x" [size]="14" />
                    </button>
                  </div>
                </ng-template>
              </app-drag-list>
            }

            <div class="pd__add">
              <app-combobox
                class="pd__pick"
                placeholder="Dodaj pjesmu…"
                [options]="compositionOptions()"
                [formControl]="pick"
              />
              <button
                appButton
                variant="ghost"
                size="sm"
                [disabled]="!pick.value"
                (click)="addSong()"
              >
                <app-icon name="plus" [size]="14" /> Dodaj
              </button>
            </div>
          </div>
        </div>
      }

      <div dialog-footer>
        @if (plan(); as p) {
          @if (!p.isRecurring && !p.isCompleted) {
            <button appButton variant="accent" type="button" (click)="markComplete()">
              <app-icon name="check" [size]="14" /> Označi završenim
            </button>
          }
          <button appButton variant="danger" type="button" (click)="deletePlan()">
            Obriši
          </button>
        }
        <button appButton variant="ghost" type="button" (click)="close()">Zatvori</button>
      </div>
    </app-dialog>
  `,
  styles: [
    `
      .center {
        display: flex;
        justify-content: center;
        padding: 40px;
      }
      .pd {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .pd__meta {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 14px;
        font-size: 13px;
        color: var(--muted);
      }
      .pd__meta span {
        display: inline-flex;
        align-items: center;
        gap: 5px;
      }
      .badge {
        background: var(--surface-3);
        color: var(--ink-2);
        padding: 2px 8px;
        border-radius: 999px;
        font-size: 11px;
      }
      .badge--ok {
        background: var(--accent-soft);
        color: var(--accent);
      }
      .pd__notes {
        font-size: 14px;
        color: var(--ink-2);
        white-space: pre-wrap;
      }
      .pd__h {
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--muted);
        margin-bottom: 8px;
      }
      .muted {
        color: var(--muted);
        font-size: 13px;
      }
      .song {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
      }
      .song__pos {
        font-size: 12px;
        color: var(--muted);
        width: 18px;
      }
      .song__title {
        flex: 1;
        font-size: 14px;
      }
      .pd__add {
        display: flex;
        align-items: flex-end;
        gap: 8px;
        margin-top: 12px;
      }
      .pd__pick {
        flex: 1;
      }
    `,
  ],
})
export class PlanDetailDialog implements OnInit {
  readonly ref = inject<DialogRef<boolean>>(DialogRef);
  private readonly data = inject<PlanDetailDialogData>(DIALOG_DATA);
  private readonly api = inject(PracticePlansApiService);
  private readonly compositionsApi = inject(CompositionsApiService);
  private readonly toast = inject(ToastService);

  protected readonly plan = signal<PracticePlan | null>(null);
  protected readonly loading = signal(true);
  protected readonly pick = new FormControl<string>('', { nonNullable: true });

  private readonly compositions = signal<{ id: string; title: string }[]>([]);
  private changed = false;

  protected readonly songs = computed<PracticePlanSong[]>(() =>
    [...(this.plan()?.songs ?? [])].sort((a, b) => a.position - b.position),
  );

  /** Compositions not already in the plan. */
  protected readonly compositionOptions = computed<ComboOption[]>(() => {
    const inPlan = new Set(this.songs().map((s) => s.composition.id));
    return this.compositions()
      .filter((c) => !inPlan.has(c.id))
      .map((c) => ({ value: c.id, label: c.title }));
  });

  ngOnInit(): void {
    this.refresh();
    this.compositionsApi.list({ limit: 200, sortBy: 'title', sortOrder: 'ASC' }).subscribe({
      next: (res) =>
        this.compositions.set(res.items.map((c) => ({ id: c.id, title: c.title }))),
      error: () => {},
    });
  }

  private refresh(): void {
    this.loading.set(true);
    this.api.getById(this.data.planId).subscribe({
      next: (p) => {
        this.plan.set(p);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(formatApiMessage(err?.error?.message));
        this.close();
      },
    });
  }

  protected onReorder(next: PracticePlanSong[]): void {
    const items = next.map((s, i) => ({ compositionId: s.composition.id, position: i + 1 }));
    this.api.reorderSongs(this.data.planId, items).subscribe({
      next: () => {
        this.changed = true;
        this.refresh();
      },
      error: (err) => {
        // Optimistic order may have diverged — re-pull the source of truth.
        this.toast.error(formatApiMessage(err?.error?.message));
        this.refresh();
      },
    });
  }

  protected addSong(): void {
    const id = this.pick.value;
    if (!id) return;
    this.api.addSong(this.data.planId, id).subscribe({
      next: () => {
        this.pick.setValue('');
        this.changed = true;
        this.refresh();
      },
      error: (err) => this.toast.error(formatApiMessage(err?.error?.message)),
    });
  }

  protected removeSong(s: PracticePlanSong): void {
    this.api.removeSong(this.data.planId, s.composition.id).subscribe({
      next: () => {
        this.changed = true;
        this.refresh();
      },
      error: (err) => this.toast.error(formatApiMessage(err?.error?.message)),
    });
  }

  protected markComplete(): void {
    this.api.markCompleted(this.data.planId).subscribe({
      next: () => {
        this.changed = true;
        this.toast.success('Plan označen završenim.');
        this.refresh();
      },
      error: (err) => this.toast.error(formatApiMessage(err?.error?.message)),
    });
  }

  protected deletePlan(): void {
    const name = this.plan()?.name ?? '';
    if (!confirm(`Obrisati plan "${name}"?`)) return;
    this.api.remove(this.data.planId).subscribe({
      next: () => {
        this.toast.success('Plan obrisan.');
        this.ref.close(true);
      },
      error: (err) => this.toast.error(formatApiMessage(err?.error?.message)),
    });
  }

  protected close(): void {
    this.ref.close(this.changed);
  }
}
