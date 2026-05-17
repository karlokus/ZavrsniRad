import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { switchMap } from 'rxjs';
import { CompositionsApiService } from './compositions-api.service';
import { CompositionFormComponent, CompositionFormValue } from './composition-form.component';
import { ToastService } from '../../core/notifications/toast.service';
import { formatApiMessage } from '../../core/errors/format-api-message';

@Component({
  selector: 'app-new-composition-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CompositionFormComponent],
  template: `
    <div class="page-wrap">
      <h1 class="page-title">Nova pjesma</h1>
      <app-composition-form
        submitLabel="Kreiraj"
        [saving]="saving()"
        (submitted)="onSubmit($event)"
        (cancel)="router.navigateByUrl('/repertoire')"
      />
    </div>
  `,
  styles: [`
    .page-wrap { display: flex; flex-direction: column; gap: 20px; max-width: 720px; }
    .page-title { font-family: var(--font-serif); font-size: 24px; }
  `],
})
export class NewCompositionPage {
  readonly router = inject(Router);
  private readonly api = inject(CompositionsApiService);
  private readonly toast = inject(ToastService);

  readonly saving = signal(false);

  onSubmit(val: CompositionFormValue): void {
    this.saving.set(true);
    const { categoryIds, ...dto } = val;
    this.api
      .create(dto)
      .pipe(
        switchMap((comp) =>
          this.api.setCategories(comp.id, categoryIds).pipe(
            switchMap(() => [comp]),
          ),
        ),
      )
      .subscribe({
        next: (comp) => {
          this.toast.success(`"${comp.title}" dodano u repertoar.`);
          this.router.navigate(['/repertoire', comp.id]);
        },
        error: (err) => {
          this.saving.set(false);
          this.toast.error(formatApiMessage(err?.error?.message));
        },
      });
  }
}
