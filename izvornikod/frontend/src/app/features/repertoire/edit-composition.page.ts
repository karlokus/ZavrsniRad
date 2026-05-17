import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  input,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { switchMap } from 'rxjs';
import { CompositionsApiService } from './compositions-api.service';
import { Composition } from './composition.types';
import { CompositionFormComponent, CompositionFormValue } from './composition-form.component';
import { ToastService } from '../../core/notifications/toast.service';
import { formatApiMessage } from '../../core/errors/format-api-message';
import { Spinner } from '../../shared/ui/spinner/spinner';

@Component({
  selector: 'app-edit-composition-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CompositionFormComponent, Spinner],
  template: `
    <div class="page-wrap">
      <h1 class="page-title">Uredi pjesmu</h1>
      @if (loadingComp()) {
        <div class="center"><app-spinner /></div>
      } @else if (composition()) {
        <app-composition-form
          submitLabel="Spremi izmjene"
          [initial]="composition()"
          [saving]="saving()"
          (submitted)="onSubmit($event)"
          (cancel)="router.navigate(['/repertoire', id()])"
        />
      }
    </div>
  `,
  styles: [`
    .page-wrap { display: flex; flex-direction: column; gap: 20px; max-width: 720px; }
    .page-title { font-family: var(--font-serif); font-size: 24px; }
    .center { display: flex; justify-content: center; padding: 40px; }
  `],
})
export class EditCompositionPage implements OnInit {
  readonly id = input.required<string>();
  readonly router = inject(Router);
  private readonly api = inject(CompositionsApiService);
  private readonly toast = inject(ToastService);

  readonly composition = signal<Composition | null>(null);
  readonly loadingComp = signal(true);
  readonly saving = signal(false);

  ngOnInit(): void {
    this.api.get(this.id()).subscribe({
      next: (c) => {
        this.composition.set(c);
        this.loadingComp.set(false);
      },
      error: (err) => {
        this.loadingComp.set(false);
        this.toast.error(formatApiMessage(err?.error?.message));
        this.router.navigateByUrl('/repertoire');
      },
    });
  }

  onSubmit(val: CompositionFormValue): void {
    this.saving.set(true);
    const { categoryIds, ...dto } = val;
    this.api
      .update(this.id(), dto)
      .pipe(switchMap(() => this.api.setCategories(this.id(), categoryIds)))
      .subscribe({
        next: () => {
          this.toast.success('Izmjene spremljene.');
          this.router.navigate(['/repertoire', this.id()]);
        },
        error: (err) => {
          this.saving.set(false);
          this.toast.error(formatApiMessage(err?.error?.message));
        },
      });
  }
}
