import { Injectable, signal } from '@angular/core';
import { Toast, ToastKind } from './toast.types';

const DEFAULT_DURATION_MS = 5000;

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);

  show(input: { kind: ToastKind; text: string; durationMs?: number }): void {
    const toast: Toast = {
      id: this.makeId(),
      kind: input.kind,
      text: input.text,
      durationMs: input.durationMs ?? DEFAULT_DURATION_MS,
    };
    this.toasts.update((list) => [...list, toast]);
    if (toast.durationMs > 0) {
      setTimeout(() => this.dismiss(toast.id), toast.durationMs);
    }
  }

  success(text: string, durationMs?: number): void {
    this.show({ kind: 'success', text, durationMs });
  }

  error(text: string, durationMs?: number): void {
    this.show({ kind: 'error', text, durationMs });
  }

  info(text: string, durationMs?: number): void {
    this.show({ kind: 'info', text, durationMs });
  }

  warning(text: string, durationMs?: number): void {
    this.show({ kind: 'warning', text, durationMs });
  }

  dismiss(id: string): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  private makeId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}
