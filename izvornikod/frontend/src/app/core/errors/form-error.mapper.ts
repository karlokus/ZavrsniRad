import { HttpErrorResponse } from '@angular/common/http';
import { FormGroup } from '@angular/forms';

export function applyServerErrorsToForm(form: FormGroup, error: HttpErrorResponse): boolean {
  const messages = error?.error?.message;
  if (!Array.isArray(messages)) return false;

  let mapped = false;
  for (const line of messages) {
    if (typeof line !== 'string' || line.length === 0) continue;
    const firstWord = line.split(/\s+/, 1)[0];
    if (!firstWord) continue;
    const control = form.get(firstWord);
    if (!control) continue;
    control.setErrors({ ...(control.errors ?? {}), server: line });
    mapped = true;
  }
  return mapped;
}
