import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  contentChild,
  input,
  output,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDragPlaceholder,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { Icon } from '../icon/icon';

/**
 * Generička reorder lista (CDK DragDrop). Reorder pattern za
 * setliste i practice planove (§6.6 / §7.6) — backend traži kompletan
 * popis pa `reordered` emitira CIJELI novi poredak.
 *
 * Usage:
 *  <app-drag-list [items]="songs()" (reordered)="onReorder($event)">
 *    <ng-template #row let-song let-i="index">
 *      {{ i + 1 }}. {{ song.title }}
 *    </ng-template>
 *  </app-drag-list>
 */
@Component({
  selector: 'app-drag-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CdkDropList, CdkDrag, CdkDragHandle, CdkDragPlaceholder, NgTemplateOutlet, Icon],
  template: `
    <div cdkDropList class="dl" (cdkDropListDropped)="drop($event)">
      @for (item of items(); track $index) {
        <div class="dl__row" cdkDrag>
          <span class="dl__handle" cdkDragHandle aria-label="Povuci za promjenu redoslijeda">
            <app-icon name="drag" [size]="16" />
          </span>
          <div class="dl__content">
            <ng-container
              *ngTemplateOutlet="rowTpl(); context: { $implicit: item, index: $index }"
            />
          </div>
          <div class="dl__placeholder" *cdkDragPlaceholder></div>
        </div>
      }
    </div>
  `,
  styles: [
    `
    .dl { display: flex; flex-direction: column; }
    .dl__row {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 14px;
      border-bottom: 1px solid var(--border);
      background: var(--surface);
    }
    .dl__handle {
      color: var(--muted-2);
      cursor: grab;
      display: inline-flex;
      flex: 0 0 auto;
    }
    .dl__handle:active { cursor: grabbing; }
    .dl__content { flex: 1; min-width: 0; }
    .dl__placeholder { height: 0; }

    .cdk-drag-preview {
      box-shadow: var(--shadow);
      border-radius: var(--radius-sm);
      background: var(--surface);
    }
    .cdk-drag-placeholder { opacity: 0.4; }
    .cdk-drag-animating { transition: transform 0.18s cubic-bezier(0, 0, 0.2, 1); }
    .dl.cdk-drop-list-dragging .dl__row:not(.cdk-drag-placeholder) {
      transition: transform 0.18s cubic-bezier(0, 0, 0.2, 1);
    }
    `,
  ],
})
export class DragList<T = unknown> {
  readonly items = input.required<T[]>();
  readonly reordered = output<T[]>();

  protected readonly rowTpl = contentChild.required<TemplateRef<unknown>>(TemplateRef);

  drop(e: CdkDragDrop<T[]>): void {
    if (e.previousIndex === e.currentIndex) return;
    const next = [...this.items()];
    moveItemInArray(next, e.previousIndex, e.currentIndex);
    this.reordered.emit(next);
  }
}
