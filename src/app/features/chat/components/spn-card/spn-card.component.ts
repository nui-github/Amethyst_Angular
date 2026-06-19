import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

/** TODO: implement full SpnCardComponent — see ANGULAR.md */
@Component({
  selector: 'app-spn-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: '<p style="color:var(--bizx-n500);font-size:11px">TODO: SpnCardComponent</p>',
})
export class SpnCardComponent {
  @Input() data: Record<string, unknown> = {};
  @Input() progress = 0;
  @Input() stages: string[] = [];
  @Output() requestPermit = new EventEmitter<string[]>();
}
