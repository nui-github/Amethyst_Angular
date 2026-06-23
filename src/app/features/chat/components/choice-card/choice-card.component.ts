import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal } from '@angular/core';
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

  selectedValue = signal<string | null>(null);

  get isSimple(): boolean {
    return this.data.options.every(o => !o.description);
  }

  select(value: string): void {
    if (this.selectedValue() !== null) return;
    this.selectedValue.set(value);
    this.chosen.emit(value);
  }
}
