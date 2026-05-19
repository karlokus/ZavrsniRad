import {
  HttpClient,
  HttpEvent,
  HttpEventType,
  HttpResponse,
} from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, filter, map } from 'rxjs';
import {
  CompositionFile,
  ParsedMidiData,
  UploadFileDto,
  UploadProgress,
} from './composition-file.types';

@Injectable({ providedIn: 'root' })
export class CompositionFilesApiService {
  private readonly http = inject(HttpClient);

  listForComposition(compositionId: string): Observable<CompositionFile[]> {
    return this.http.get<CompositionFile[]>(`/compositions/${compositionId}/files`);
  }

  private buildUploadForm(file: File, dto: UploadFileDto): FormData {
    const form = new FormData();
    form.append('file', file);
    form.append('fileType', dto.fileType);
    if (dto.instrumentId) form.append('instrumentId', dto.instrumentId);
    if (dto.description) form.append('description', dto.description);
    return form;
  }

  upload(compositionId: string, file: File, dto: UploadFileDto): Observable<CompositionFile> {
    return this.http.post<CompositionFile>(
      `/compositions/${compositionId}/files`,
      this.buildUploadForm(file, dto),
    );
  }

  /**
   * Upload variant that streams progress for the §6.5 upload dialog.
   * Emits `{ status:'progress', percent }` while uploading, then a single
   * terminal `{ status:'done', file }` with the created CompositionFile.
   */
  uploadWithProgress(
    compositionId: string,
    file: File,
    dto: UploadFileDto,
  ): Observable<UploadProgress> {
    return this.http
      .post<CompositionFile>(
        `/compositions/${compositionId}/files`,
        this.buildUploadForm(file, dto),
        { reportProgress: true, observe: 'events' },
      )
      .pipe(
        filter(
          (e: HttpEvent<CompositionFile>) =>
            e.type === HttpEventType.UploadProgress ||
            e.type === HttpEventType.Response,
        ),
        map((e): UploadProgress => {
          if (e.type === HttpEventType.UploadProgress) {
            const percent = e.total ? Math.round((e.loaded / e.total) * 100) : 0;
            return { status: 'progress', percent };
          }
          return { status: 'done', file: (e as HttpResponse<CompositionFile>).body! };
        }),
      );
  }

  getById(fileId: string): Observable<CompositionFile> {
    return this.http.get<CompositionFile>(`/composition-files/${fileId}`);
  }

  getMidiData(fileId: string): Observable<ParsedMidiData> {
    return this.http.get<ParsedMidiData>(`/composition-files/${fileId}/midi-data`);
  }

  /** Relative proxy path (for reference / non-auth contexts). */
  downloadUrl(fileId: string): string {
    return `/composition-files/${fileId}/download`;
  }

  /**
   * Fetches the same-origin proxy stream as a Blob *through HttpClient* so
   * the auth + base-url interceptors apply (a bare <audio src>/<a href>
   * can't send the Bearer token). Caller wraps it in an object URL.
   * Used for audio playback and downloads; sheet images instead use the
   * short-lived presigned URL from getById (§6.5).
   */
  download(fileId: string): Observable<Blob> {
    return this.http.get(`/composition-files/${fileId}/download`, {
      responseType: 'blob',
    });
  }

  remove(fileId: string): Observable<unknown> {
    return this.http.delete(`/composition-files/${fileId}`);
  }
}
