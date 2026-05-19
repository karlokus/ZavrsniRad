import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { LookupsService } from '../../core/lookups/lookups.service';
import { Dialog } from '../../shared/ui/dialog/dialog';
import { Button } from '../../shared/ui/button/button';
import { Select, SelectOption } from '../../shared/ui/select/select';
import { TextArea } from '../../shared/ui/text-area/text-area';
import { Icon } from '../../shared/ui/icon/icon';
import { CompositionFile, FileType } from './composition-file.types';
import { CompositionFilesApiService } from './composition-files-api.service';

export interface FileUploadDialogData {
  compositionId: string;
}

const FILE_TYPE_OPTIONS: SelectOption[] = [
  { value: 'SHEET_IMAGE', label: 'Notni zapis (slika/PDF)' },
  { value: 'AUDIO_RECORDING', label: 'Audio snimka' },
  { value: 'MIDI', label: 'MIDI' },
  { value: 'LYRICS_DOC', label: 'Tekst pjesme (dokument)' },
];

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Upload dialog (§6.5, FZ-R08/R09/R11). Streams progress via
 * CompositionFilesApiService.uploadWithProgress; the dialog cannot be
 * dismissed while an upload is in flight (CDK disableClose + hidden close).
 * 413 (too large) is surfaced by errorInterceptor with the backend's max.
 */
@Component({
  selector: 'app-file-upload-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Dialog, Button, Select, TextArea, Icon],
  template: `
    <app-dialog title="Dodaj datoteku" (dismiss)="onDismiss()">
      <form [formGroup]="form" class="form-body">
        <div class="file-pick">
          <label class="field__label">Datoteka</label>
          <input
            #fileInput
            type="file"
            class="file-input"
            [disabled]="uploading()"
            (change)="onFile($event)"
          />
          @if (selectedFile(); as f) {
            <p class="file-meta">
              <app-icon name="file_text" [size]="13" />
              {{ f.name }} · {{ size() }}
            </p>
          }
        </div>

        <app-select
          label="Tip datoteke"
          [options]="fileTypeOptions"
          formControlName="fileType"
        />

        <app-select
          label="Instrument (opcionalno)"
          placeholder="Nije vezano uz instrument"
          [options]="instrumentOptions()"
          formControlName="instrumentId"
        />

        <app-text-area
          label="Opis (opcionalno)"
          placeholder="npr. Aranžman za lijevu ruku"
          formControlName="description"
          [rows]="2"
        />

        @if (uploading()) {
          <div class="progress" role="progressbar" [attr.aria-valuenow]="progress()">
            <div class="progress__bar" [style.width.%]="progress()"></div>
            <span class="progress__pct mono">{{ progress() }}%</span>
          </div>
        }
      </form>

      <div dialog-footer>
        @if (!uploading()) {
          <button appButton variant="ghost" type="button" (click)="ref.close()">
            Odustani
          </button>
        }
        <button
          appButton
          variant="accent"
          type="button"
          [disabled]="!selectedFile() || uploading()"
          (click)="submit()"
        >
          {{ uploading() ? 'Učitavam…' : 'Učitaj' }}
        </button>
      </div>
    </app-dialog>
  `,
  styles: [
    `
      .form-body {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .field__label {
        font-size: 12px;
        color: var(--muted);
        letter-spacing: 0.01em;
      }
      .file-pick {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .file-input {
        font-size: 13px;
      }
      .file-meta {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: var(--muted);
      }
      .progress {
        position: relative;
        height: 22px;
        background: var(--surface-3);
        border-radius: var(--radius-sm);
        overflow: hidden;
      }
      .progress__bar {
        height: 100%;
        background: var(--accent);
        transition: width 0.15s ease;
      }
      .progress__pct {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        color: var(--ink);
      }
    `,
  ],
})
export class FileUploadDialog {
  readonly ref = inject<DialogRef<CompositionFile>>(DialogRef);
  private readonly data = inject<FileUploadDialogData>(DIALOG_DATA);
  private readonly api = inject(CompositionFilesApiService);
  private readonly lookups = inject(LookupsService);
  private readonly fb = inject(FormBuilder);

  protected readonly fileTypeOptions = FILE_TYPE_OPTIONS;
  protected readonly instrumentOptions = computed<SelectOption[]>(() =>
    this.lookups.instruments().map((i) => ({ value: i.id, label: i.instrumentName })),
  );

  protected readonly selectedFile = signal<File | null>(null);
  protected readonly uploading = signal(false);
  protected readonly progress = signal(0);
  protected readonly size = computed(() => {
    const f = this.selectedFile();
    return f ? humanSize(f.size) : '';
  });

  protected readonly form = this.fb.nonNullable.group({
    fileType: 'SHEET_IMAGE' as FileType,
    instrumentId: '',
    description: '',
  });

  protected onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile.set(input.files?.[0] ?? null);
  }

  /** App-dialog X button — only honoured when no upload is running. */
  protected onDismiss(): void {
    if (!this.uploading()) this.ref.close();
  }

  protected submit(): void {
    const file = this.selectedFile();
    if (!file || this.uploading()) return;

    this.uploading.set(true);
    this.progress.set(0);
    // Block backdrop / Esc dismissal for the duration of the upload.
    this.ref.disableClose = true;

    const v = this.form.getRawValue();
    this.api
      .uploadWithProgress(this.data.compositionId, file, {
        fileType: v.fileType,
        instrumentId: v.instrumentId || undefined,
        description: v.description || undefined,
      })
      .subscribe({
        next: (ev) => {
          if (ev.status === 'progress') this.progress.set(ev.percent);
          else this.ref.close(ev.file);
        },
        error: () => {
          // errorInterceptor already toasted (incl. 413 max-size message).
          this.uploading.set(false);
          this.ref.disableClose = false;
        },
      });
  }
}
