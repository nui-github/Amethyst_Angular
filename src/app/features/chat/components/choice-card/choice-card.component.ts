import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { ChoiceCardData } from '@app/core/models/types';

@Component({
  selector: 'app-choice-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NzButtonModule],
  template: `
    <div style="display:flex;flex-direction:column;gap:8px">
      @if (data.question) {
        <p style="font-size:12px;color:var(--bizx-n600);margin:0 0 4px">{{ data.question }}</p>
      }
      <div style="display:flex;flex-wrap:wrap;gap:8px">
        @for (opt of data.options; track opt.value; let i = $index) {
          <button nz-button [nzType]="i === 0 ? 'primary' : 'default'"
            (click)="chosen.emit(opt.value)">
            {{ opt.label }}
          </button>
        }
      </div>
    </div>
  `,
})
export class ChoiceCardComponent {
  @Input({ required: true }) data!: ChoiceCardData;
  @Output() chosen = new EventEmitter<string>();
}
