import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Package, Check } from 'lucide-angular';
import { InvoiceItemsData, InvoiceLineItem } from '@app/core/models/types';

@Component({
  selector: 'app-invoice-items',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './invoice-items.component.html',
  styleUrl: './invoice-items.component.scss',
})
export class InvoiceItemsComponent implements OnInit {
  @Input({ required: true }) data!: InvoiceItemsData;
  @Output() confirmed = new EventEmitter<InvoiceLineItem[]>();

  readonly Package = Package;
  readonly Check = Check;

  selectedIds = signal<Set<string>>(new Set());
  proceeded = signal(false);

  ngOnInit(): void {
    this.selectedIds.set(new Set(this.data.selectedIds ?? []));
    if (this.data.selectedIds?.length) this.proceeded.set(true);
  }

  readonly selectedCount = () => this.selectedIds().size;

  isSelected(item: InvoiceLineItem): boolean {
    return this.selectedIds().has(item.id);
  }

  toggle(item: InvoiceLineItem): void {
    if (this.proceeded()) return;
    this.selectedIds.update(set => {
      const next = new Set(set);
      if (next.has(item.id)) next.delete(item.id); else next.add(item.id);
      return next;
    });
  }

  proceed(): void {
    if (this.proceeded() || this.selectedCount() === 0) return;
    this.proceeded.set(true);
    const items = this.data.items.filter(i => this.selectedIds().has(i.id));
    this.confirmed.emit(items);
  }
}
