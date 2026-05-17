import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { CategoriesApiService } from './categories-api.service';
import { CategoryFormDialog } from './category-form.dialog';
import { Category } from './category.types';
import { ToastService } from '../../core/notifications/toast.service';
import { formatApiMessage } from '../../core/errors/format-api-message';
import { Card } from '../../shared/ui/card/card';
import { Button } from '../../shared/ui/button/button';
import { Chip } from '../../shared/ui/chip/chip';
import { Icon } from '../../shared/ui/icon/icon';
import { Spinner } from '../../shared/ui/spinner/spinner';

@Component({
  selector: 'app-categories-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card, Button, Chip, Icon, Spinner],
  template: `
    <div class="page-wrap">
      <div class="page-head">
        <h1 class="page-title">Kategorije</h1>
        <button appButton variant="accent" size="sm" (click)="openCreate()">
          <app-icon name="plus" [size]="14" /> Nova kategorija
        </button>
      </div>

      @if (loading()) {
        <div class="center"><app-spinner /></div>
      } @else if (categories().length === 0) {
        <app-card>
          <p class="empty-state">Nema kategorija. Kreirajte prvu!</p>
        </app-card>
      } @else {
        <app-card>
          @for (cat of categories(); track cat.id) {
            <div class="cat-row">
              <app-chip [color]="cat.color ?? null">{{ cat.name }}</app-chip>
              <div class="cat-actions">
                <button appButton variant="ghost" iconOnly size="sm" (click)="openEdit(cat)">
                  <app-icon name="pencil" [size]="14" />
                </button>
                <button appButton variant="danger" iconOnly size="sm" (click)="confirmDelete(cat)">
                  <app-icon name="trash" [size]="14" />
                </button>
              </div>
            </div>
          }
        </app-card>
      }
    </div>
  `,
  styles: [`
    .page-wrap { display: flex; flex-direction: column; gap: 20px; }
    .page-head { display: flex; align-items: center; justify-content: space-between; }
    .page-title { font-family: var(--font-serif); font-size: 24px; }
    .center { display: flex; justify-content: center; padding: 40px; }
    .empty-state { color: var(--muted); font-size: 14px; text-align: center; padding: 20px; }
    .cat-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid var(--border);
    }
    .cat-row:last-child { border-bottom: none; }
    .cat-actions { display: flex; gap: 4px; }
  `],
})
export class CategoriesPage implements OnInit {
  private readonly api = inject(CategoriesApiService);
  private readonly dialog = inject(Dialog);
  private readonly toast = inject(ToastService);

  readonly categories = signal<Category[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.api.list().subscribe({
      next: (cats) => {
        this.categories.set(cats);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(formatApiMessage(err?.error?.message));
      },
    });
  }

  openCreate(): void {
    const ref = this.dialog.open(CategoryFormDialog, { data: null });
    ref.closed.subscribe((result) => {
      if (result) this.load();
    });
  }

  openEdit(cat: Category): void {
    const ref = this.dialog.open(CategoryFormDialog, { data: cat });
    ref.closed.subscribe((result) => {
      if (result) this.load();
    });
  }

  confirmDelete(cat: Category): void {
    if (!confirm(`Obrisati kategoriju "${cat.name}"?`)) return;
    this.api.remove(cat.id).subscribe({
      next: () => {
        this.toast.success(`Kategorija "${cat.name}" obrisana.`);
        this.load();
      },
      error: (err) => this.toast.error(formatApiMessage(err?.error?.message)),
    });
  }
}
