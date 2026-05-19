import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Skeleton } from '../../shared/ui/skeleton/skeleton';
import { Icon } from '../../shared/ui/icon/icon';
import { PracticePlansApiService } from './practice-plans-api.service';
import { StreakData } from './practice-plan.types';

/**
 * Streak tile (§6.6) for the dashboard. GET /practice-plans/streak →
 * `{ currentStreak, lastCompletedDate }`. Flame Icon (no emoji), Stat-like
 * card styling. Loads independently with its own skeleton.
 */
@Component({
  selector: 'app-streak-widget',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Skeleton, Icon],
  template: `
    @if (loading()) {
      <app-skeleton height="90" />
    } @else {
      <div class="streak">
        <div class="streak__title">Niz vježbanja</div>
        <div class="streak__big">
          <app-icon name="flame" [size]="28" />
          <span>{{ days() }} {{ days() === 1 ? 'dan' : 'dana' }} u nizu</span>
        </div>
        <div class="streak__sub">{{ subtitle() }}</div>
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .streak {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        padding: 20px;
        height: 100%;
      }
      .streak__title {
        font-size: 13px;
        color: var(--muted);
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }
      .streak__big {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 8px;
        font-family: var(--font-serif);
        font-size: 28px;
        line-height: 1;
        color: var(--accent);
      }
      .streak__sub {
        font-size: 12px;
        color: var(--muted);
        margin-top: 6px;
      }
    `,
  ],
})
export class StreakWidget implements OnInit {
  private readonly api = inject(PracticePlansApiService);

  private readonly data = signal<StreakData | null>(null);
  protected readonly loading = signal(true);

  protected readonly days = computed(() => this.data()?.currentStreak ?? 0);
  protected readonly subtitle = computed(() => {
    const d = this.data();
    if (!d || d.currentStreak === 0) return 'Završi plan da pokreneš niz.';
    return d.lastCompletedDate
      ? `Zadnje: ${new Date(d.lastCompletedDate).toLocaleDateString()}`
      : 'Nastavi tako!';
  });

  ngOnInit(): void {
    this.api.getStreak().subscribe({
      next: (s) => {
        this.data.set(s);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
