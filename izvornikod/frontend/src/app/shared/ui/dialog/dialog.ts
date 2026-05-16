import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Button } from '../button/button';
import { Icon } from '../icon/icon';

/**
 * Prezentacijski okvir dijaloga — koristi se kao sadržaj otvoren kroz
 * `@angular/cdk/dialog` (Dialog servis daje backdrop + focus-trap).
 * Stil `.dialog__panel` / `.dialog__head` (dizajn nema vlastite — definirano ovdje).
 *
 * Usage (unutar komponente otvorene preko CDK Dialog-a):
 *  <app-dialog title="Promjena lozinke" (dismiss)="ref.close()">
 *    ...forma...
 *    <div dialog-footer> <button appButton (click)="ref.close()">Odustani</button> </div>
 *  </app-dialog>
 */
@Component({
  selector: 'app-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Icon],
  template: `
    <div class="dialog__panel" role="dialog" aria-modal="true">
      <div class="dialog__head">
        <h2 class="dialog__title">{{ title() }}</h2>
        <button appButton variant="ghost" iconOnly type="button" aria-label="Zatvori" (click)="dismiss.emit()">
          <app-icon name="x" [size]="16" />
        </button>
      </div>
      <div class="dialog__body">
        <ng-content />
      </div>
      <div class="dialog__foot">
        <ng-content select="[dialog-footer]" />
      </div>
    </div>
  `,
  styles: [
    `
    .dialog__panel {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow);
      width: min(520px, 92vw);
      max-height: 88vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .dialog__head {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 18px;
      border-bottom: 1px solid var(--border);
    }
    .dialog__title { font-family: var(--font-serif); font-size: 22px; }
    .dialog__body { padding: 18px; overflow-y: auto; }
    .dialog__foot:empty { display: none; }
    .dialog__foot {
      display: flex; justify-content: flex-end; gap: 8px;
      padding: 14px 18px;
      border-top: 1px solid var(--border);
    }
    `,
  ],
})
export class Dialog {
  readonly title = input('');
  readonly dismiss = output<void>();
}
