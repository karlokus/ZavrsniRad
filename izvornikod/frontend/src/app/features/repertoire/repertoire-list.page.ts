import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CompositionsApiService } from './compositions-api.service';
import { Composition, CompositionSortBy, QueryCompositionsParams } from './composition.types';
import { CategoriesApiService } from '../categories/categories-api.service';
import { Category } from '../categories/category.types';
import { LookupsService } from '../../core/lookups/lookups.service';
import { ToastService } from '../../core/notifications/toast.service';
import { formatApiMessage } from '../../core/errors/format-api-message';
import { Button } from '../../shared/ui/button/button';
import { ListRow } from '../../shared/ui/list-row/list-row';
import { MasteryDots } from '../../shared/ui/mastery-dots/mastery-dots';
import { Chip } from '../../shared/ui/chip/chip';
import { Spinner } from '../../shared/ui/spinner/spinner';
import { Select, SelectOption } from '../../shared/ui/select/select';
import { Icon } from '../../shared/ui/icon/icon';

const GRID = '2fr 1fr 1fr 80px 90px';

const MASTERY_FILTER_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'Sve' },
  { value: 'learning', label: 'U učenju' },
  { value: 'learned', label: 'Naučene' },
];

const SORT_OPTIONS: SelectOption[] = [
  { value: 'title', label: 'Naziv (A-Z)' },
  { value: 'title_desc', label: 'Naziv (Z-A)' },
  { value: 'createdAt_desc', label: 'Najnovije' },
  { value: 'createdAt', label: 'Najstarije' },
  { value: 'avgMastery_desc', label: 'Mastery ↓' },
  { value: 'avgMastery', label: 'Mastery ↑' },
];

@Component({
  selector: 'app-repertoire-list-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, Button, ListRow, MasteryDots, Chip, Spinner, Select, Icon],
  template: `
    <div class="page-wrap">
      <div class="page-head">
        <h1 class="page-title">Repertoar</h1>
        <a routerLink="/repertoire/new">
          <button appButton variant="accent" size="sm">
            <app-icon name="plus" [size]="14" /> Nova pjesma
          </button>
        </a>
      </div>

      <!-- Filteri -->
      <div class="filters">
        <div class="search-wrap">
          <app-icon name="search" [size]="14" class="search-icon" />
          <input
            class="search-input"
            type="search"
            placeholder="Pretraži repertoar..."
            [(ngModel)]="searchInput"
            (ngModelChange)="onSearch($event)"
          />
        </div>

        <app-select
          placeholder="Kategorija"
          [options]="categoryOptions()"
          [(ngModel)]="filters.categoryId"
          (ngModelChange)="loadPage(1)"
        />
        <app-select
          placeholder="Tonalitet"
          [options]="keySignatureOptions()"
          [(ngModel)]="filters.keySignatureId"
          (ngModelChange)="loadPage(1)"
        />
        <app-select
          placeholder="Mastery"
          [options]="masteryFilterOptions"
          [(ngModel)]="masteryFilter"
          (ngModelChange)="onMasteryFilter($event)"
        />
        <app-select
          placeholder="Sortiranje"
          [options]="sortOptions"
          [(ngModel)]="sortKey"
          (ngModelChange)="onSort($event)"
        />
      </div>

      <!-- Header -->
      <app-list-row [gridTemplate]="grid" head>
        <div>Naziv</div>
        <div>Izvođač</div>
        <div>Tonalitet</div>
        <div>Mastery</div>
        <div>Kategorije</div>
      </app-list-row>

      @if (loading()) {
        <div class="center"><app-spinner /></div>
      } @else if (items().length === 0) {
        <p class="empty-state">Nema rezultata.</p>
      } @else {
        @for (c of items(); track c.id) {
          <app-list-row [gridTemplate]="grid" [routerLink]="['/repertoire', c.id]">
            <div class="title-cell">{{ c.title }}</div>
            <div class="muted">{{ c.artist?.name ?? '—' }}</div>
            <div class="muted">{{ c.keySignature?.name ?? '—' }}</div>
            <div>
              <app-mastery-dots [value]="avgMastery(c)" />
            </div>
            <div class="chips">
              @for (cat of (c.categories ?? []); track cat.id) {
                <app-chip [color]="cat.color ?? null">{{ cat.name }}</app-chip>
              }
            </div>
          </app-list-row>
        }

        <!-- Paginacija -->
        @if (totalPages() > 1) {
          <div class="pagination">
            <button appButton variant="ghost" size="sm" [disabled]="page() === 1" (click)="loadPage(page() - 1)">
              <app-icon name="chevron_right" [size]="14" style="transform:rotate(180deg)" />
            </button>
            <span class="muted">{{ page() }} / {{ totalPages() }}</span>
            <button appButton variant="ghost" size="sm" [disabled]="page() === totalPages()" (click)="loadPage(page() + 1)">
              <app-icon name="chevron_right" [size]="14" />
            </button>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .page-wrap { display: flex; flex-direction: column; gap: 16px; }
    .page-head { display: flex; align-items: center; justify-content: space-between; }
    .page-title { font-family: var(--font-serif); font-size: 24px; }
    .filters { display: flex; gap: 10px; flex-wrap: wrap; align-items: flex-end; }
    .search-wrap { position: relative; flex: 1 1 200px; }
    .search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--muted); pointer-events: none; }
    .search-input {
      width: 100%; padding: 9px 12px 9px 32px;
      border: 1px solid var(--border-strong); border-radius: var(--radius-sm);
      background: var(--surface); outline: none;
    }
    .search-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
    .center { display: flex; justify-content: center; padding: 40px; }
    .empty-state { color: var(--muted); font-size: 14px; padding: 20px 14px; }
    .title-cell { font-weight: 500; }
    .muted { color: var(--muted); font-size: 13px; }
    .chips { display: flex; gap: 4px; flex-wrap: wrap; }
    .pagination { display: flex; align-items: center; gap: 12px; justify-content: center; padding: 12px; }
  `],
})
export class RepertoireListPage implements OnInit {
  private readonly api = inject(CompositionsApiService);
  private readonly categoriesApi = inject(CategoriesApiService);
  private readonly lookups = inject(LookupsService);
  private readonly toast = inject(ToastService);

  readonly grid = GRID;
  readonly masteryFilterOptions = MASTERY_FILTER_OPTIONS;
  readonly sortOptions = SORT_OPTIONS;

  readonly items = signal<Composition[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly loading = signal(true);
  readonly allCategories = signal<Category[]>([]);

  searchInput = '';
  masteryFilter = 'all';
  sortKey = 'title';
  readonly filters: QueryCompositionsParams = {};

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / 20)));

  readonly categoryOptions = computed<SelectOption[]>(() => [
    { value: '', label: 'Sve kategorije' },
    ...this.allCategories().map((c) => ({ value: c.id, label: c.name })),
  ]);

  readonly keySignatureOptions = computed<SelectOption[]>(() => [
    { value: '', label: 'Svi tonaliteti' },
    ...this.lookups.keySignatures().map((k) => ({ value: k.id, label: k.name })),
  ]);

  private readonly search$ = new Subject<string>();

  constructor() {
    this.search$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((q) => {
        this.filters.search = q || undefined;
        this.loadPage(1);
      });
  }

  ngOnInit(): void {
    this.categoriesApi.list().subscribe((cats) => this.allCategories.set(cats));
    this.loadPage(1);
  }

  onSearch(q: string): void {
    this.search$.next(q);
  }

  onMasteryFilter(val: string): void {
    delete this.filters.minMastery;
    delete this.filters.maxMastery;
    if (val === 'learned') this.filters.minMastery = 4;
    if (val === 'learning') this.filters.maxMastery = 3.99;
    this.loadPage(1);
  }

  onSort(val: string): void {
    const [field, dir] = val.includes('_desc')
      ? [val.replace('_desc', '') as CompositionSortBy, 'DESC' as const]
      : [val as CompositionSortBy, 'ASC' as const];
    this.filters.sortBy = field;
    this.filters.sortOrder = dir;
    this.loadPage(1);
  }

  loadPage(p: number): void {
    this.page.set(p);
    this.loading.set(true);
    this.api.list({ ...this.filters, page: p, limit: 20 }).subscribe({
      next: (res) => {
        this.items.set(res.items);
        this.total.set(res.total);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(formatApiMessage(err?.error?.message));
      },
    });
  }

  avgMastery(c: Composition): number {
    const n = c.notesMastery ?? 1;
    const l = c.lyricsMastery ?? 1;
    const p = c.playingMastery ?? 1;
    return Math.round((n + l + p) / 3);
  }
}
