import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

/** TODO: implement full OcrProgressComponent — see ANGULAR.md */
@Component({
  selector: 'app-ocr-progress',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: '<p style="color:var(--bizx-n500);font-size:11px">TODO: OcrProgressComponent</p>',
})
export class OcrProgressComponent {
  @Input() data: Record<string, unknown> = {};
  @Input() progress = 0;
  @Input() stages: string[] = [];
  @Output() requestPermit = new EventEmitter<string[]>();
}
