import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { DashboardApiService } from './dashboard-api.service';
import { DashboardSummary, NeedsPracticeItem } from './dashboard.types';
import { AuthStateService } from '../../core/auth/auth-state.service';
import { Stat } from '../../shared/ui/stat/stat';
import { Card } from '../../shared/ui/card/card';
import { MasteryDots } from '../../shared/ui/mastery-dots/mastery-dots';
import { Skeleton } from '../../shared/ui/skeleton/skeleton';
import { Button } from '../../shared/ui/button/button';
import { Icon } from '../../shared/ui/icon/icon';

@Component({
  selector: 'app-dashboard-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Stat, Card, MasteryDots, Skeleton, Button, Icon],
  template: `
    <div class="dashboard">
      <div class="dash-head">
        <h1 class="dash-greeting serif">
          Dobrodošli, {{ firstName() }}
        </h1>
      </div>

      <!-- Summary stats -->
      <div class="stats-grid">
        @if (summaryLoading()) {
          <app-skeleton height="90" />
          <app-skeleton height="90" />
          <app-skeleton height="90" />
        } @else {
          <app-stat
            label="Pjesme u repertoaru"
            [value]="summary()?.totalSongs ?? 0"
          />
          <app-stat
            label="Naučene pjesme"
            [value]="summary()?.learnedCount ?? 0"
            [sub]="learnedSub()"
          />
          <app-stat
            label="Streak (dani)"
            [value]="summary()?.activeStreak ?? 0"
            deltaKind="good"
          />
        }
      </div>

      <!-- Needs practice -->
      <app-card title="Treba vježbanja">
        <a routerLink="/repertoire/new" card-actions>
          <button appButton variant="ghost" size="sm">
            <app-icon name="plus" [size]="14" /> Nova pjesma
          </button>
        </a>

        @if (practiceLoading()) {
          <div class="practice-list">
            @for (i of [1,2,3,4,5]; track i) {
              <app-skeleton height="44" />
            }
          </div>
        } @else if (needsPractice().length === 0) {
          <p class="empty-note">Sve pjesme su na visokom nivou!</p>
        } @else {
          <div class="practice-list">
            @for (item of needsPractice(); track item.id) {
              <a class="practice-row" [routerLink]="['/repertoire', item.id]">
                <span class="practice-title">{{ item.title }}</span>
                <app-mastery-dots [value]="round(item.avgMastery)" warm />
              </a>
            }
          </div>
        }
      </app-card>

      <!-- TODO(§7 — Faza 3): progress chart, category pie, heatmap, performance widgets -->
    </div>
  `,
  styles: [`
    .dashboard { display: flex; flex-direction: column; gap: 24px; }
    .dash-greeting { font-size: 26px; }
    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .practice-list { display: flex; flex-direction: column; gap: 8px; }
    .practice-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid var(--border);
      text-decoration: none; color: inherit;
    }
    .practice-row:last-child { border-bottom: none; }
    .practice-row:hover .practice-title { color: var(--accent); }
    .practice-title { font-size: 14px; font-weight: 500; }
    .empty-note { font-size: 14px; color: var(--muted); padding: 8px 0; }
    @media (max-width: 600px) { .stats-grid { grid-template-columns: 1fr; } }
  `],
})
export class DashboardPage implements OnInit {
  private readonly api = inject(DashboardApiService);
  private readonly authState = inject(AuthStateService);

  readonly summary = signal<DashboardSummary | null>(null);
  readonly needsPractice = signal<NeedsPracticeItem[]>([]);
  readonly summaryLoading = signal(true);
  readonly practiceLoading = signal(true);

  readonly firstName = () => this.authState.currentUser()?.firstName ?? '';
  readonly round = Math.round;

  readonly learnedSub = () => {
    const total = this.summary()?.totalSongs ?? 0;
    const learned = this.summary()?.learnedCount ?? 0;
    return total > 0 ? `od ${total}` : '';
  };

  ngOnInit(): void {
    this.api.summary().subscribe({
      next: (s) => {
        this.summary.set(s);
        this.summaryLoading.set(false);
      },
      error: () => this.summaryLoading.set(false),
    });

    this.api.needsPractice().subscribe({
      next: (items) => {
        this.needsPractice.set(items);
        this.practiceLoading.set(false);
      },
      error: () => this.practiceLoading.set(false),
    });
  }
}
