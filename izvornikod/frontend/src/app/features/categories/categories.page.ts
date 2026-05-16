import { ChangeDetectionStrategy, Component } from '@angular/core';

// TODO(§5 — Faza 1, Categories): lista + form dialog (CategoriesApi).
@Component({
  selector: 'app-categories-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h1>Kategorije</h1>`,
})
export class CategoriesPage {}
