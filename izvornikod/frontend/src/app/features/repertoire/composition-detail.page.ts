import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CompositionsApiService } from './compositions-api.service';
import { Composition } from './composition.types';
import { ToastService } from '../../core/notifications/toast.service';
import { formatApiMessage } from '../../core/errors/format-api-message';
import { Card } from '../../shared/ui/card/card';
import { Button } from '../../shared/ui/button/button';
import { MasteryDots } from '../../shared/ui/mastery-dots/mastery-dots';
import { Chip } from '../../shared/ui/chip/chip';
import { Spinner } from '../../shared/ui/spinner/spinner';
import { Icon } from '../../shared/ui/icon/icon';
import { FilesPanel } from '../practice-player/files-panel.component';

@Component({
  selector: 'app-composition-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Card, Button, MasteryDots, Chip, Spinner, Icon, FilesPanel],
  template: `
    @if (loading()) {
      <div class="center"><app-spinner /></div>
    } @else if (composition()) {
      <div class="detail-wrap">
        <div class="detail-head">
          <div>
            <h1 class="detail-title">{{ composition()!.title }}</h1>
            @if (composition()!.artist) {
              <p class="detail-sub">{{ composition()!.artist!.name }}</p>
            }
          </div>
          <div class="head-actions">
            <a [routerLink]="['/repertoire', id(), 'edit']">
              <button appButton variant="ghost" size="sm">
                <app-icon name="pencil" [size]="14" /> Uredi
              </button>
            </a>
            <button appButton variant="danger" size="sm" (click)="confirmDelete()">
              <app-icon name="trash" [size]="14" /> Obriši
            </button>
            <button appButton variant="accent" size="sm" [routerLink]="['/practice', id()]">
              <app-icon name="play" [size]="14" /> Vježbaj
            </button>
          </div>
        </div>

        <div class="detail-grid">
          <app-card title="Info">
            <dl class="info-list">
              @if (composition()!.keySignature) {
                <div class="info-row">
                  <dt>Tonalitet</dt>
                  <dd>{{ composition()!.keySignature!.name }}</dd>
                </div>
              }
              @if (composition()!.tempoBpm) {
                <div class="info-row">
                  <dt>Tempo</dt>
                  <dd>{{ composition()!.tempoBpm }} BPM</dd>
                </div>
              }
            </dl>
          </app-card>

          <app-card title="Napredak">
            <div class="mastery-list">
              <div class="mastery-row">
                <span class="mastery-label">Note</span>
                <app-mastery-dots [value]="composition()!.notesMastery ?? 1" />
              </div>
              <div class="mastery-row">
                <span class="mastery-label">Tekst</span>
                <app-mastery-dots [value]="composition()!.lyricsMastery ?? 1" />
              </div>
              <div class="mastery-row">
                <span class="mastery-label">Sviranje</span>
                <app-mastery-dots [value]="composition()!.playingMastery ?? 1" />
              </div>
              <div class="mastery-row avg-row">
                <span class="mastery-label">Prosjek</span>
                <app-mastery-dots [value]="avgMastery()" warm />
              </div>
            </div>
          </app-card>

          @if ((composition()!.categories ?? []).length > 0) {
            <app-card title="Kategorije">
              <div class="chips-wrap">
                @for (cat of composition()!.categories!; track cat.id) {
                  <app-chip [color]="cat.color ?? null">{{ cat.name }}</app-chip>
                }
              </div>
            </app-card>
          }

          @if (composition()!.youtubeSongUrl || composition()!.youtubeInstrumentUrl) {
            <app-card title="Linkovi">
              <div class="links-list">
                @if (composition()!.youtubeSongUrl) {
                  <a class="link" [href]="composition()!.youtubeSongUrl!" target="_blank" rel="noopener">
                    <app-icon name="youtube" [size]="14" /> Originalna izvedba
                  </a>
                }
                @if (composition()!.youtubeInstrumentUrl) {
                  <a class="link" [href]="composition()!.youtubeInstrumentUrl!" target="_blank" rel="noopener">
                    <app-icon name="youtube" [size]="14" /> Instrumental
                  </a>
                }
              </div>
            </app-card>
          }

          @if (composition()!.description) {
            <app-card title="Bilješke" class="full-width">
              <p class="description">{{ composition()!.description }}</p>
            </app-card>
          }

          <app-card title="Datoteke" class="full-width">
            <app-files-panel [compositionId]="id()" />
          </app-card>
        </div>
      </div>
    }
  `,
  styles: [`
    .center { display: flex; justify-content: center; padding: 60px; }
    .detail-wrap { display: flex; flex-direction: column; gap: 24px; }
    .detail-head { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
    .detail-title { font-family: var(--font-serif); font-size: 28px; }
    .detail-sub { color: var(--muted); font-size: 15px; margin-top: 4px; }
    .head-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .detail-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
    .full-width { grid-column: 1 / -1; }
    .info-list { display: flex; flex-direction: column; gap: 10px; }
    .info-row { display: flex; justify-content: space-between; align-items: baseline; font-size: 14px; }
    .info-row dt { color: var(--muted); }
    .info-row dd { font-weight: 500; }
    .mastery-list { display: flex; flex-direction: column; gap: 10px; }
    .mastery-row { display: flex; align-items: center; justify-content: space-between; }
    .mastery-label { font-size: 13px; color: var(--muted); }
    .avg-row { padding-top: 8px; border-top: 1px solid var(--border); margin-top: 4px; }
    .chips-wrap { display: flex; flex-wrap: wrap; gap: 6px; }
    .links-list { display: flex; flex-direction: column; gap: 8px; }
    .description { font-size: 14px; line-height: 1.6; color: var(--ink-2); white-space: pre-wrap; }
  `],
})
export class CompositionDetailPage implements OnInit {
  readonly id = input.required<string>();
  private readonly api = inject(CompositionsApiService);
  private readonly toast = inject(ToastService);
  readonly router = inject(Router);

  readonly composition = signal<Composition | null>(null);
  readonly loading = signal(true);

  readonly avgMastery = computed(() => {
    const c = this.composition();
    if (!c) return 1;
    return Math.round(((c.notesMastery ?? 1) + (c.lyricsMastery ?? 1) + (c.playingMastery ?? 1)) / 3);
  });

  ngOnInit(): void {
    this.api.get(this.id()).subscribe({
      next: (c) => {
        this.composition.set(c);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(formatApiMessage(err?.error?.message));
        this.router.navigateByUrl('/repertoire');
      },
    });
  }

  confirmDelete(): void {
    const title = this.composition()?.title ?? '';
    if (!confirm(`Obrisati "${title}" iz repertoara?`)) return;
    this.api.remove(this.id()).subscribe({
      next: () => {
        this.toast.success(`"${title}" obrisano.`);
        this.router.navigateByUrl('/repertoire');
      },
      error: (err) => this.toast.error(formatApiMessage(err?.error?.message)),
    });
  }
}
