import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InvoiceLineItem, ItemMeasurementData, CustomsDeclarationItem } from '@app/core/models/types';

@Component({
  selector: 'app-item-measurement',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [CommonModule, FormsModule],
  templateUrl: './item-measurement.component.html',
  styleUrl: './item-measurement.component.scss',
})
export class ItemMeasurementComponent {
  @Input({ required: true }) set data(val: ItemMeasurementData) {
    this._data = val;
    this.rows = val.items.map(item => ({
      item,
      measurement: item.measurement ?? '',
      measUnit: item.measUnit ?? '',
    }));
  }
  get data(): ItemMeasurementData { return this._data; }
  private _data!: ItemMeasurementData;

  @Output() confirmed = new EventEmitter<InvoiceLineItem[]>();

  rows: { item: InvoiceLineItem; measurement: string; measUnit: string }[] = [];
  saved = false;

  declarationItem(item: InvoiceLineItem): CustomsDeclarationItem | undefined {
    if (item.declarationItemNumber == null) return undefined;
    return this.data.customsDeclaration?.items.find(i => i.itemNumber === item.declarationItemNumber);
  }

  nameTh(item: InvoiceLineItem): string {
    return this.declarationItem(item)?.nameTh || item.name;
  }

  nameEn(item: InvoiceLineItem): string {
    return this.declarationItem(item)?.nameEn || item.name;
  }

  tariffCode(item: InvoiceLineItem): string {
    return this.declarationItem(item)?.tariffCode || item.hsCode || '—';
  }

  lotNo(item: InvoiceLineItem): string {
    return this.declarationItem(item)?.productions?.[0]?.lotNo || item.lotNo || '—';
  }

  onMeasurementInput(row: { measurement: string }, event: Event): void {
    row.measurement = (event.target as HTMLInputElement).value;
  }

  onMeasUnitInput(row: { measUnit: string }, event: Event): void {
    row.measUnit = (event.target as HTMLInputElement).value;
  }

  allFilled(): boolean {
    return this.rows.every(r => r.measurement.trim().length > 0 && r.measUnit.trim().length > 0);
  }

  confirm(): void {
    if (this.saved || !this.allFilled()) return;
    this.saved = true;
    const items = this.rows.map(r => ({ ...r.item, measurement: r.measurement, measUnit: r.measUnit }));
    this.confirmed.emit(items);
  }
}
