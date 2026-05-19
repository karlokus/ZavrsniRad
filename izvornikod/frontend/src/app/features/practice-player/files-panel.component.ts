import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { ToastService } from '../../core/notifications/toast.service';
import { formatApiMessage } from '../../core/errors/format-api-message';
import { Button } from '../../shared/ui/button/button';
import { Icon } from '../../shared/ui/icon/icon';
import { Spinner } from '../../shared/ui/spinner/spinner';
import { Tabs, TabItem } from '../../shared/ui/tabs/tabs';
import { CompositionFile, FileType } from './composition-file.types';
import { CompositionFilesApiService } from './composition-files-api.service';
import { FileUploadDialog, FileUploadDialogData } from './file-upload.dialog';

const TYPE_META: Record<FileType, { icon: string; label: string }> = {
  SHEET_IMAGE: { icon: 'image', label: 'Notni zapis' },
  AUDIO_RECORDING: { icon: 'music', label: 'Audio snimka' },
  MIDI: { icon: 'music', label: 'MIDI' },
  LYRICS_DOC: { icon: 'file_text', label: 'Tekst' },
};

/** §6.7 master-detail tabs: Note / Tekst / Mediji / Snimke ↔ file types. */
const TABS: { type: FileType; label: string }[] = [
  { type: 'SHEET_IMAGE', label: 'Note' },
  { type: 'LYRICS_DOC', label: 'Tekst' },
  { type: 'MIDI', label: 'Mediji' },
  { type: 'AUDIO_RECORDING', label: 'Snimke' },
];

/**
 * Files panel (§6.5) — embedded in CompositionDetailPage. Upload via the
 * progress dialog; per file:
 *  - SHEET_IMAGE preview re-fetches GET /composition-files/:id every time
 *    it opens (presigned URL TTL ~5 min — never cached).
 *  - AUDIO_RECORDING plays the same-origin proxy stream fetched as a Blob
 *    through HttpClient (auth header) → object URL.
 *  - Download routes through the same authenticated Blob fetch.
 */
@Component({
  selector: 'app-files-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Icon, Spinner, Tabs],
  template: `
    <div class="files">
      <div class="files__head">
        <app-tabs
          [tabs]="tabItems()"
          [active]="activeTab()"
          (activeChange)="activeTab.set($any($event))"
        />
        <button appButton variant="accent" size="sm" (click)="openUpload()">
          <app-icon name="upload" [size]="14" /> Dodaj datoteku
        </button>
      </div>

      @if (loading()) {
        <div class="center"><app-spinner /></div>
      } @else if (visibleFiles().length === 0) {
        <p class="empty">Nema datoteka u ovoj kategoriji.</p>
      } @else {
        <ul class="file-list">
          @for (f of visibleFiles(); track f.id) {
            <li class="file-row">
              <div class="file-main">
                <app-icon [name]="meta(f).icon" [size]="16" />
                <div class="file-info">
                  <span class="file-name">{{ f.fileName }}</span>
                  <span class="file-sub">
                    {{ meta(f).label }}
                    @if (f.instrument) { · {{ f.instrument.instrumentName }} }
                  </span>
                </div>
              </div>

              <div class="file-actions">
                @if (f.fileType === 'SHEET_IMAGE') {
                  <button
                    appButton
                    variant="ghost"
                    size="sm"
                    [disabled]="busyId() === f.id"
                    (click)="togglePreview(f)"
                  >
                    {{ preview()?.id === f.id ? 'Sakrij' : 'Prikaži' }}
                  </button>
                }
                @if (f.fileType === 'AUDIO_RECORDING') {
                  <button
                    appButton
                    variant="ghost"
                    size="sm"
                    [disabled]="busyId() === f.id"
                    (click)="toggleAudio(f)"
                  >
                    {{ audio()?.id === f.id ? 'Zatvori' : 'Reproduciraj' }}
                  </button>
                }
                <button
                  appButton
                  variant="ghost"
                  iconOnly
                  size="sm"
                  aria-label="Preuzmi"
                  [disabled]="busyId() === f.id"
                  (click)="downloadFile(f)"
                >
                  <app-icon name="download" [size]="14" />
                </button>
                <button
                  appButton
                  variant="danger"
                  iconOnly
                  size="sm"
                  aria-label="Obriši"
                  (click)="remove(f)"
                >
                  <app-icon name="trash" [size]="14" />
                </button>
              </div>

              @if (preview()?.id === f.id) {
                <img class="preview" [src]="preview()!.url" [alt]="f.fileName" />
              }
              @if (audio()?.id === f.id) {
                <audio class="audio" controls [src]="audio()!.url"></audio>
              }
            </li>
          }
        </ul>
      }
    </div>
  `,
  styles: [
    `
      .files {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }
      .files__head {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
      }
      .files__head app-tabs {
        flex: 1;
        min-width: 0;
      }
      .center {
        display: flex;
        justify-content: center;
        padding: 24px;
      }
      .empty {
        font-size: 14px;
        color: var(--muted);
        text-align: center;
        padding: 16px;
      }
      .file-list {
        display: flex;
        flex-direction: column;
      }
      .file-row {
        display: grid;
        grid-template-columns: 1fr auto;
        align-items: center;
        gap: 12px;
        padding: 10px 0;
        border-bottom: 1px solid var(--border);
      }
      .file-row:last-child {
        border-bottom: none;
      }
      .file-main {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 0;
      }
      .file-info {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }
      .file-name {
        font-size: 14px;
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .file-sub {
        font-size: 12px;
        color: var(--muted);
      }
      .file-actions {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .preview {
        grid-column: 1 / -1;
        max-width: 100%;
        max-height: 420px;
        object-fit: contain;
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        background: var(--surface-2);
      }
      .audio {
        grid-column: 1 / -1;
        width: 100%;
      }
    `,
  ],
})
export class FilesPanel implements OnInit {
  readonly compositionId = input.required<string>();

  private readonly api = inject(CompositionFilesApiService);
  private readonly dialog = inject(Dialog);
  private readonly toast = inject(ToastService);

  protected readonly files = signal<CompositionFile[]>([]);
  protected readonly loading = signal(true);
  protected readonly activeTab = signal<FileType>('SHEET_IMAGE');

  protected readonly tabItems = computed<TabItem[]>(() =>
    TABS.map((t) => {
      const n = this.files().filter((f) => f.fileType === t.type).length;
      return { id: t.type, label: n > 0 ? `${t.label} (${n})` : t.label };
    }),
  );
  protected readonly visibleFiles = computed(() =>
    this.files().filter((f) => f.fileType === this.activeTab()),
  );
  /** Sheet-image preview — fresh presigned URL, never cached. */
  protected readonly preview = signal<{ id: string; url: string } | null>(null);
  /** Audio object URL (revoked on swap / destroy). */
  protected readonly audio = signal<{ id: string; url: string } | null>(null);
  protected readonly busyId = signal<string | null>(null);

  constructor() {
    inject(DestroyRef).onDestroy(() => this.revokeAudio());
  }

  ngOnInit(): void {
    this.load();
  }

  protected meta(f: CompositionFile) {
    return TYPE_META[f.fileType];
  }

  private load(): void {
    this.loading.set(true);
    this.api.listForComposition(this.compositionId()).subscribe({
      next: (list) => {
        this.files.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(formatApiMessage(err?.error?.message));
      },
    });
  }

  protected openUpload(): void {
    const ref = this.dialog.open<CompositionFile>(FileUploadDialog, {
      data: { compositionId: this.compositionId() } satisfies FileUploadDialogData,
    });
    ref.closed.subscribe((created) => {
      if (created) {
        this.toast.success('Datoteka učitana.');
        this.load();
      }
    });
  }

  protected togglePreview(f: CompositionFile): void {
    if (this.preview()?.id === f.id) {
      this.preview.set(null);
      return;
    }
    // Always re-fetch: the presigned URL lives ~5 min, so it is never cached.
    this.busyId.set(f.id);
    this.api.getById(f.id).subscribe({
      next: (full) => {
        this.busyId.set(null);
        if (full.downloadUrl) this.preview.set({ id: f.id, url: full.downloadUrl });
        else this.toast.error('Pregled trenutno nije dostupan.');
      },
      error: (err) => {
        this.busyId.set(null);
        this.toast.error(formatApiMessage(err?.error?.message));
      },
    });
  }

  protected toggleAudio(f: CompositionFile): void {
    if (this.audio()?.id === f.id) {
      this.revokeAudio();
      return;
    }
    this.busyId.set(f.id);
    this.api.download(f.id).subscribe({
      next: (blob) => {
        this.busyId.set(null);
        this.revokeAudio();
        this.audio.set({ id: f.id, url: URL.createObjectURL(blob) });
      },
      error: (err) => {
        this.busyId.set(null);
        this.toast.error(formatApiMessage(err?.error?.message));
      },
    });
  }

  protected downloadFile(f: CompositionFile): void {
    this.busyId.set(f.id);
    this.api.download(f.id).subscribe({
      next: (blob) => {
        this.busyId.set(null);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = f.fileName;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: (err) => {
        this.busyId.set(null);
        this.toast.error(formatApiMessage(err?.error?.message));
      },
    });
  }

  protected remove(f: CompositionFile): void {
    if (!confirm(`Obrisati datoteku "${f.fileName}"?`)) return;
    this.api.remove(f.id).subscribe({
      next: () => {
        if (this.preview()?.id === f.id) this.preview.set(null);
        if (this.audio()?.id === f.id) this.revokeAudio();
        this.toast.success('Datoteka obrisana.');
        this.load();
      },
      error: (err) => this.toast.error(formatApiMessage(err?.error?.message)),
    });
  }

  private revokeAudio(): void {
    const a = this.audio();
    if (a) {
      URL.revokeObjectURL(a.url);
      this.audio.set(null);
    }
  }
}
