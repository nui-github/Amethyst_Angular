import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InvoiceSelectData } from '@app/core/models/types';

@Component({
  selector: 'app-invoice-select',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './invoice-select.component.html',
  styleUrl: './invoice-select.component.scss',
})
export class InvoiceSelectComponent {
  @Input({ required: true }) data!: InvoiceSelectData;
  @Output() chosen = new EventEmitter<string>();

  get locked(): boolean {
    return !!this.data.selectedId;
  }

  select(id: string): void {
    if (this.locked) return;
    this.chosen.emit(id);
  }
}
