import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChoiceCardData } from '@app/core/models/types';

@Component({
  selector: 'app-choice-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './choice-card.component.html',
  styleUrl: './choice-card.component.scss',
})
export class ChoiceCardComponent {
  @Input({ required: true }) data!: ChoiceCardData;
  @Output() chosen = new EventEmitter<string>();

  /** Rich layout when options have descriptions */
  get isSimple(): boolean {
    return this.data.options.every(o => !o.description);
  }
}
