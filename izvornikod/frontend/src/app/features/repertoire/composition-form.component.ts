import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LookupsService } from '../../core/lookups/lookups.service';
import { CategoriesApiService } from '../categories/categories-api.service';
import { Category } from '../categories/category.types';
import { Composition } from './composition.types';
import { Button } from '../../shared/ui/button/button';
import { TextField } from '../../shared/ui/text-field/text-field';
import { TextArea } from '../../shared/ui/text-area/text-area';
import { Select, SelectOption } from '../../shared/ui/select/select';
import { Combobox, ComboOption } from '../../shared/ui/combobox/combobox';
import { MasteryDots } from '../../shared/ui/mastery-dots/mastery-dots';
import { Chip } from '../../shared/ui/chip/chip';

export interface CompositionFormValue {
  title: string;
  artistId?: string;
  keySignatureId?: string;
  tempoBpm?: number;
  description?: string;
  youtubeSongUrl?: string;
  youtubeInstrumentUrl?: string;
  notesMastery: number;
  lyricsMastery: number;
  playingMastery: number;
  categoryIds: string[];
}

@Component({
  selector: 'app-composition-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Button, TextField, TextArea, Select, Combobox, MasteryDots, Chip],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="comp-form">
      <div class="form-section">
        <h3 class="section-title">Osnovno</h3>
        <div class="fields">
          <app-text-field
            label="Naziv *"
            placeholder="npr. Đelozija"
            formControlName="title"
            [error]="fieldError('title')"
          />
          <div class="row-2">
            <app-combobox
              label="Izvođač"
              placeholder="Pretražite izvođače..."
              [options]="artistOptions()"
              formControlName="artistId"
            />
            <app-select
              label="Tonalitet"
              placeholder="Odaberite tonalitet..."
              [options]="keySignatureOptions()"
              formControlName="keySignatureId"
            />
          </div>
          <app-text-field
            label="Tempo (BPM)"
            type="number"
            placeholder="npr. 120"
            formControlName="tempoBpm"
          />
        </div>
      </div>

      <div class="form-section">
        <h3 class="section-title">Napredak</h3>
        <div class="mastery-grid">
          <div class="mastery-item">
            <span class="mastery-label">Note</span>
            <app-mastery-dots interactive formControlName="notesMastery" />
          </div>
          <div class="mastery-item">
            <span class="mastery-label">Tekst</span>
            <app-mastery-dots interactive formControlName="lyricsMastery" />
          </div>
          <div class="mastery-item">
            <span class="mastery-label">Sviranje</span>
            <app-mastery-dots interactive formControlName="playingMastery" />
          </div>
        </div>
      </div>

      <div class="form-section">
        <h3 class="section-title">Kategorije</h3>
        @if (allCategories().length === 0) {
          <p class="muted-note">Nema kategorija. Kreirajte ih na stranici Kategorije.</p>
        } @else {
          <div class="cat-checks">
            @for (cat of allCategories(); track cat.id) {
              <label class="cat-check">
                <input
                  type="checkbox"
                  [checked]="isCatSelected(cat.id)"
                  (change)="toggleCat(cat.id)"
                />
                <app-chip [color]="cat.color ?? null">{{ cat.name }}</app-chip>
              </label>
            }
          </div>
        }
      </div>

      <div class="form-section">
        <h3 class="section-title">Linkovi</h3>
        <div class="fields">
          <app-text-field
            label="YouTube — originalna izvedba"
            placeholder="https://youtube.com/..."
            formControlName="youtubeSongUrl"
          />
          <app-text-field
            label="YouTube — instrumental"
            placeholder="https://youtube.com/..."
            formControlName="youtubeInstrumentUrl"
          />
        </div>
      </div>

      <div class="form-section">
        <h3 class="section-title">Bilješke</h3>
        <app-text-area
          label="Opis"
          placeholder="Napomene, posebnosti, ciljevi..."
          formControlName="description"
          [rows]="4"
        />
      </div>

      <div class="form-actions">
        <button appButton variant="ghost" type="button" (click)="cancel.emit()">Odustani</button>
        <button appButton variant="primary" type="submit" [disabled]="saving()">
          {{ saving() ? 'Sprema...' : submitLabel() }}
        </button>
      </div>
    </form>
  `,
  styles: [`
    .comp-form { display: flex; flex-direction: column; gap: 28px; }
    .form-section { display: flex; flex-direction: column; gap: 14px; }
    .section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); }
    .fields { display: flex; flex-direction: column; gap: 14px; }
    .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .mastery-grid { display: flex; gap: 24px; flex-wrap: wrap; }
    .mastery-item { display: flex; flex-direction: column; gap: 6px; }
    .mastery-label { font-size: 12px; color: var(--muted); }
    .cat-checks { display: flex; flex-wrap: wrap; gap: 8px; }
    .cat-check { display: flex; align-items: center; gap: 6px; cursor: pointer; }
    .cat-check input { cursor: pointer; }
    .muted-note { font-size: 13px; color: var(--muted); }
    .form-actions { display: flex; justify-content: flex-end; gap: 10px; padding-top: 8px; border-top: 1px solid var(--border); }
  `],
})
export class CompositionFormComponent implements OnInit {
  readonly initial = input<Composition | null>(null);
  readonly saving = input(false);
  readonly submitLabel = input('Spremi');
  readonly submitted = output<CompositionFormValue>();
  readonly cancel = output<void>();

  private readonly fb = inject(FormBuilder);
  private readonly lookups = inject(LookupsService);
  private readonly categoriesApi = inject(CategoriesApiService);

  readonly allCategories = signal<Category[]>([]);
  private readonly selectedCategoryIds = signal<Set<string>>(new Set());

  readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(255)]],
    artistId: [''],
    keySignatureId: [''],
    tempoBpm: [null as number | null],
    notesMastery: [1],
    lyricsMastery: [1],
    playingMastery: [1],
    youtubeSongUrl: [''],
    youtubeInstrumentUrl: [''],
    description: [''],
  });

  readonly artistOptions = computed<ComboOption[]>(() =>
    this.lookups.artists().map((a) => ({ value: a.id, label: a.name })),
  );

  readonly keySignatureOptions = computed<SelectOption[]>(() => [
    { value: '', label: 'Odaberite tonalitet...' },
    ...this.lookups.keySignatures().map((k) => ({ value: k.id, label: k.name })),
  ]);

  ngOnInit(): void {
    this.categoriesApi.list().subscribe((cats) => this.allCategories.set(cats));
    const c = this.initial();
    if (c) {
      this.form.patchValue({
        title: c.title,
        artistId: c.artist?.id ?? '',
        keySignatureId: c.keySignature?.id ?? '',
        tempoBpm: c.tempoBpm ?? null,
        notesMastery: c.notesMastery ?? 1,
        lyricsMastery: c.lyricsMastery ?? 1,
        playingMastery: c.playingMastery ?? 1,
        youtubeSongUrl: c.youtubeSongUrl ?? '',
        youtubeInstrumentUrl: c.youtubeInstrumentUrl ?? '',
        description: c.description ?? '',
      });
      if (c.categories) {
        this.selectedCategoryIds.set(new Set(c.categories.map((cat) => cat.id)));
      }
    }
  }

  isCatSelected(id: string): boolean {
    return this.selectedCategoryIds().has(id);
  }

  toggleCat(id: string): void {
    const set = new Set(this.selectedCategoryIds());
    if (set.has(id)) set.delete(id);
    else set.add(id);
    this.selectedCategoryIds.set(set);
  }

  fieldError(name: string): string {
    const c = this.form.get(name);
    if (!c || !c.touched || !c.errors) return '';
    if (c.errors['required']) return 'Ovo polje je obavezno.';
    if (c.errors['maxlength']) return 'Naziv je predugačak.';
    return '';
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.submitted.emit({
      title: v.title!,
      artistId: v.artistId || undefined,
      keySignatureId: v.keySignatureId || undefined,
      tempoBpm: v.tempoBpm ?? undefined,
      notesMastery: v.notesMastery ?? 1,
      lyricsMastery: v.lyricsMastery ?? 1,
      playingMastery: v.playingMastery ?? 1,
      youtubeSongUrl: v.youtubeSongUrl || undefined,
      youtubeInstrumentUrl: v.youtubeInstrumentUrl || undefined,
      description: v.description || undefined,
      categoryIds: [...this.selectedCategoryIds()],
    });
  }
}
