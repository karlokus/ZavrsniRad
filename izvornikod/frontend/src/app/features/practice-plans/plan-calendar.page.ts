import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Dialog } from '@angular/cdk/dialog';
import { ToastService } from '../../core/notifications/toast.service';
import { formatApiMessage } from '../../core/errors/format-api-message';
import { toIsoDate, addDays } from '../../core/utils/date.utils';
import { Button } from '../../shared/ui/button/button';
import { Icon } from '../../shared/ui/icon/icon';
import { Spinner } from '../../shared/ui/spinner/spinner';
import { PracticePlansApiService } from './practice-plans-api.service';
import { PracticePlan } from './practice-plan.types';
import { PlanFormDialog, PlanFormDialogData } from './plan-form.dialog';
import { PlanDetailDialog, PlanDetailDialogData } from './plan-detail.dialog';

const MONTHS = [
  'Siječanj', 'Veljača', 'Ožujak', 'Travanj', 'Svibanj', 'Lipanj',
  'Srpanj', 'Kolovoz', 'Rujan', 'Listopad', 'Studeni', 'Prosinac',
];
const WEEKDAYS = ['Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub', 'Ned'];

interface Cell {
  date: Date;
  iso: string;
  inMonth: boolean;
  isToday: boolean;
  plans: PracticePlan[];
}

/**
 * Practice plan calendar (§6.6). Fetches the FULL visible grid range
 * (incl. adjacent-month spill) via PracticePlansApiService.listInRange —
 * that GET lazily materializes recurring instances server-side. Changing
 * month re-requests. Click a day → create; click a pill → detail.
 */
@Component({
  selector: 'app-plan-calendar-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Button, Icon, Spinner],
  template: `
    <div class="cal-wrap">
      <div class="cal-head">
        <div class="cal-nav">
          <button appButton variant="ghost" iconOnly aria-label="Prethodni mjesec" (click)="shift(-1)">
            <app-icon name="chevron_right" [size]="16" class="flip" />
          </button>
          <h1 class="cal-title">{{ monthLabel() }}</h1>
          <button appButton variant="ghost" iconOnly aria-label="Sljedeći mjesec" (click)="shift(1)">
            <app-icon name="chevron_right" [size]="16" />
          </button>
          <button appButton variant="ghost" size="sm" (click)="goToday()">Danas</button>
        </div>
        <div class="cal-actions">
          <a routerLink="/plan/templates">
            <button appButton variant="ghost" size="sm">Rutine</button>
          </a>
          <button appButton variant="accent" size="sm" (click)="openCreate()">
            <app-icon name="plus" [size]="14" /> Novi plan
          </button>
        </div>
      </div>

      <div class="cal">
        @for (w of weekdays; track w) {
          <div class="cal__dow">{{ w }}</div>
        }
        @for (c of cells(); track c.iso) {
          <div
            class="cal__cell"
            [class.is-other]="!c.inMonth"
            [class.is-today]="c.isToday"
            (click)="openCreate(c.iso)"
          >
            <span class="cal__num">{{ c.date.getDate() }}</span>
            <div class="cal__plans">
              @for (p of c.plans; track p.id) {
                <button
                  type="button"
                  class="pill"
                  [class.pill--done]="p.isCompleted"
                  (click)="openDetail(p, $event)"
                  [title]="p.name"
                >
                  @if (p.isCompleted) {
                    <app-icon name="check" [size]="10" />
                  }
                  {{ p.name }}
                </button>
              }
            </div>
          </div>
        }
      </div>

      @if (loading()) {
        <div class="cal-loading"><app-spinner /></div>
      }
    </div>
  `,
  styles: [
    `
      .cal-wrap {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .cal-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 12px;
      }
      .cal-nav {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .cal-title {
        font-family: var(--font-serif);
        font-size: 24px;
        min-width: 190px;
        text-align: center;
      }
      .cal-actions {
        display: flex;
        gap: 8px;
      }
      .flip {
        transform: rotate(180deg);
      }
      .cal {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 1px;
        background: var(--border);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        overflow: hidden;
      }
      .cal__dow {
        background: var(--surface-2);
        padding: 8px;
        font-size: 12px;
        font-weight: 600;
        color: var(--muted);
        text-align: center;
      }
      .cal__cell {
        background: var(--surface);
        min-height: 88px;
        padding: 6px;
        display: flex;
        flex-direction: column;
        gap: 4px;
        cursor: pointer;
        transition: background 0.1s;
      }
      .cal__cell:hover {
        background: var(--surface-2);
      }
      .cal__cell.is-other {
        opacity: 0.45;
      }
      .cal__cell.is-today {
        background: var(--accent-soft);
        border: 1px solid var(--accent);
      }
      .cal__num {
        font-size: 12px;
        color: var(--muted);
      }
      .cal__plans {
        display: flex;
        flex-direction: column;
        gap: 3px;
      }
      .pill {
        display: flex;
        align-items: center;
        gap: 4px;
        text-align: left;
        font-size: 11px;
        padding: 3px 6px;
        border: none;
        border-left: 2px solid var(--accent);
        background: var(--surface-2);
        border-radius: 3px;
        cursor: pointer;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .pill:hover {
        filter: brightness(0.97);
      }
      .pill--done {
        border-left-color: var(--good, var(--accent));
        color: var(--muted);
        text-decoration: line-through;
      }
      .cal-loading {
        display: flex;
        justify-content: center;
        padding: 16px;
      }
    `,
  ],
})
export class PlanCalendarPage {
  private readonly api = inject(PracticePlansApiService);
  private readonly dialog = inject(Dialog);
  private readonly toast = inject(ToastService);

  protected readonly weekdays = WEEKDAYS;

  private readonly today = new Date();
  private readonly todayIso = toIsoDate(this.today);

  protected readonly viewYear = signal(this.today.getFullYear());
  protected readonly viewMonth = signal(this.today.getMonth()); // 0-11

  protected readonly loading = signal(true);
  private readonly plans = signal<PracticePlan[]>([]);

  protected readonly monthLabel = computed(
    () => `${MONTHS[this.viewMonth()]} ${this.viewYear()}`,
  );

  /** Monday-aligned 6×7 grid covering the visible month. */
  private readonly gridStart = computed(() => {
    const first = new Date(this.viewYear(), this.viewMonth(), 1);
    const offset = (first.getDay() + 6) % 7; // 0 = Monday
    return addDays(first, -offset);
  });

  private readonly plansByDate = computed(() => {
    const map = new Map<string, PracticePlan[]>();
    for (const p of this.plans()) {
      const key = p.scheduledDate.slice(0, 10);
      const arr = map.get(key);
      if (arr) arr.push(p);
      else map.set(key, [p]);
    }
    return map;
  });

  protected readonly cells = computed<Cell[]>(() => {
    const start = this.gridStart();
    const month = this.viewMonth();
    const byDate = this.plansByDate();
    return Array.from({ length: 42 }, (_, i) => {
      const date = addDays(start, i);
      const iso = toIsoDate(date);
      return {
        date,
        iso,
        inMonth: date.getMonth() === month,
        isToday: iso === this.todayIso,
        plans: byDate.get(iso) ?? [],
      };
    });
  });

  constructor() {
    // Re-fetch whenever the visible month changes: gridStart() is read
    // inside fetch(), so the effect tracks viewYear/viewMonth and the GET
    // lazily materializes recurring instances for the new range.
    effect(() => this.fetch());
  }

  private fetch(): void {
    const start = this.gridStart();
    this.loading.set(true);
    this.api.listInRange(toIsoDate(start), toIsoDate(addDays(start, 41))).subscribe({
      next: (list) => {
        this.plans.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(formatApiMessage(err?.error?.message));
      },
    });
  }

  protected shift(delta: number): void {
    // new Date() normalizes year rollover (month -1 → prev-year December).
    const d = new Date(this.viewYear(), this.viewMonth() + delta, 1);
    this.viewYear.set(d.getFullYear());
    this.viewMonth.set(d.getMonth());
  }

  protected goToday(): void {
    this.viewYear.set(this.today.getFullYear());
    this.viewMonth.set(this.today.getMonth());
  }

  protected openCreate(date?: string): void {
    const ref = this.dialog.open<PracticePlan>(PlanFormDialog, {
      data: { date: date ?? this.todayIso } satisfies PlanFormDialogData,
    });
    ref.closed.subscribe((created) => {
      if (created) {
        this.toast.success('Plan kreiran.');
        this.fetch();
      }
    });
  }

  protected openDetail(plan: PracticePlan, event: Event): void {
    event.stopPropagation(); // don't also trigger the cell's create handler
    const ref = this.dialog.open<boolean>(PlanDetailDialog, {
      data: { planId: plan.id } satisfies PlanDetailDialogData,
    });
    ref.closed.subscribe((changed) => {
      if (changed) this.fetch();
    });
  }
}
