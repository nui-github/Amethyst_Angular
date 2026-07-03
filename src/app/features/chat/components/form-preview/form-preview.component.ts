import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LicenseFormData, InvoiceLineItem, ItemManualDetail, ITEM_MANUAL_DETAIL_FIELDS } from '@app/core/models/types';
import { ChatService } from '@app/core/services/chat.service';

interface PreviewRow {
  label: string;
  key: keyof LicenseFormData | '_qty';
  highlight?: boolean;
}

interface PreviewSection {
  title: string;
  color: string;
  rows: PreviewRow[];
}

@Component({
  selector: 'app-form-preview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [CommonModule],
  templateUrl: './form-preview.component.html',
  styleUrl: './form-preview.component.scss',
})
export class FormPreviewComponent {
  @Input({ required: true }) set data(val: LicenseFormData) {
    this._data = val;
    // init local editable copy
    this.local = { ...val };
    this.manualDetails = {};
    this.confirmedItemIds = new Set();
    for (const item of val.selectedItems ?? []) {
      this.manualDetails[item.id] = { nameTh: '', netWeight: '', manufacturerName: '', mfgDate: '', expDate: '', remarks: '' };
    }
  }
  get data(): LicenseFormData { return this._data; }
  private _data!: LicenseFormData;

  local: LicenseFormData = {};

  readonly manualFields = ITEM_MANUAL_DETAIL_FIELDS;
  manualDetails: Record<string, ItemManualDetail> = {};
  confirmedItemIds = new Set<string>();
  detailItemId: string | null = null;

  readonly chat = inject(ChatService);
  readonly cdr  = inject(ChangeDetectorRef);
  readonly el   = inject(ElementRef);

  editingKey: string | null = null;
  saved = false;

  readonly sections: PreviewSection[] = [
    {
      title: 'ข้อมูลใบขนสินค้า', color: '#0463EF',
      rows: [
        { label: 'เลขที่อ้างอิง (Ref)',  key: 'ref' },
        { label: 'เลขที่ Invoice',         key: 'invoiceNo',   highlight: true },
        { label: 'วันที่ Invoice',          key: 'invoiceDate' },
        { label: 'วันที่นำเข้า',            key: 'importDate' },
      ],
    },
    {
      title: 'ผู้ประกอบการ', color: '#7C3AED',
      rows: [
        { label: 'ผู้นำเข้า',              key: 'importer',    highlight: true },
        { label: 'ผู้ผ่านพิธีการ',          key: 'declarant' },
        { label: 'ท่าเรือ/ด่าน',           key: 'port' },
        { label: 'ประเทศต้นกำเนิด',        key: 'countryOrigin' },
      ],
    },
    {
      title: 'ข้อมูลสินค้า', color: '#0D8F61',
      rows: [
        { label: 'รายละเอียดสินค้า',       key: 'goodsDesc' },
        { label: 'HS Code',                key: 'hsCode',      highlight: true },
        { label: 'ปริมาณ / หน่วย',        key: '_qty' },
        { label: 'ประเภทใบอนุญาต',        key: 'licenseType', highlight: true },
      ],
    },
    {
      title: 'ข้อมูลทะเบียน', color: '#B45309',
      rows: [
        { label: 'เลขทะเบียน อย.',        key: 'drugRegNo' },
        { label: 'Lot No.',               key: 'lotNo' },
        { label: 'เลข U',                 key: 'uNo' },
      ],
    },
  ];

  getValue(key: string): string {
    if (key === '_qty') {
      const q = this.local.quantity;
      const u = this.local.unit;
      return q && u ? `${q} ${u}` : (q ?? '');
    }
    return (this.local as Record<string, string>)[key] ?? '';
  }

  display(key: string): string {
    const v = this.getValue(key);
    return v.trim() ? v : '—';
  }

  hasValue(key: string): boolean {
    const v = this.getValue(key);
    return v.trim().length > 0;
  }

  startEdit(key: string): void {
    if (this.saved || key === '_qty') return;
    this.editingKey = key;
    this.cdr.detectChanges();
    setTimeout(() => {
      const input = this.el.nativeElement.querySelector(`[data-key="${key}"]`) as HTMLInputElement;
      input?.focus();
      input?.select();
    }, 30);
  }

  onInput(key: string, event: Event): void {
    (this.local as Record<string, string>)[key] = (event.target as HTMLInputElement).value;
  }

  commitEdit(): void {
    this.editingKey = null;
    this.cdr.detectChanges();
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.commitEdit();
    if (event.key === 'Escape') { this.editingKey = null; this.cdr.detectChanges(); }
  }

  // ── Per-item detail (invoice path only) ─────────────────────────────────────
  get detailItem(): InvoiceLineItem | undefined {
    return this.local.selectedItems?.find(i => i.id === this.detailItemId);
  }

  isItemConfirmed(id: string): boolean { return this.confirmedItemIds.has(id); }

  isManualDetailComplete(id: string): boolean {
    const d = this.manualDetails[id];
    if (!d) return false;
    return this.manualFields.every(f => (d[f.key] ?? '').trim().length > 0);
  }

  allItemDetailsConfirmed(): boolean {
    const items = this.local.selectedItems ?? [];
    return items.every(i => this.confirmedItemIds.has(i.id));
  }

  openItemDetail(id: string): void {
    if (this.saved) return;
    this.detailItemId = id;
  }

  closeItemDetail(): void {
    this.detailItemId = null;
  }

  onManualFieldInput(id: string, key: keyof ItemManualDetail, event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.manualDetails[id] = { ...this.manualDetails[id], [key]: val };
  }

  confirmItemDetail(id: string): void {
    if (!this.isManualDetailComplete(id)) return;
    this.confirmedItemIds = new Set(this.confirmedItemIds).add(id);
    this.detailItemId = null;
    this.cdr.detectChanges();
  }

  proceed(): void {
    if (this.saved || !this.allItemDetailsConfirmed()) return;
    this.saved = true;
    this.chat.formData.update(f => ({ ...f, ...this.local }));
    this.cdr.detectChanges();
    this.chat.onFormPreviewProceed();
  }
}
