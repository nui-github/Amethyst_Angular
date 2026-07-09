import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { LicenseFormData, InvoiceLineItem, ItemManualDetail, ITEM_MANUAL_DETAIL_FIELDS, CustomsDeclarationData, CustomsDeclarationItem } from '@app/core/models/types';
import { CUSTOMS_DECLARATION_HEADER_SECTIONS } from '@app/shared/utils/customs-declaration-sections';
import { CustomsItemDetailComponent } from '../customs-item-detail/customs-item-detail.component';
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
  imports: [CommonModule, FormsModule, NzDatePickerModule, CustomsItemDetailComponent],
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
      // Lot/Mfg/Exp/Qty are already known from OCR — only Measurement + Meas. Unit need the
      // user to key in, since no document captures the declared measurement/unit for LPI.
      this.manualDetails[item.id] = {
        lotNo: item.lotNo ?? '', mfgDate: item.mfgDate ?? '', expDate: item.expDate ?? '',
        measurement: '', measUnit: '', qty: item.quantity ?? '', qtyUnit: item.unit ?? '',
      };
    }
  }
  get data(): LicenseFormData { return this._data; }
  private _data!: LicenseFormData;

  local: LicenseFormData = {};

  readonly manualFields = ITEM_MANUAL_DETAIL_FIELDS;
  // Lot Number / Mfg. Date / Exp. Date / Qty. / Qty. Unit are auto-filled from OCR (see `data`
  // setter above) — only Measurement + Meas. Unit are left for the user to key in by hand.
  readonly editableFields = ITEM_MANUAL_DETAIL_FIELDS.filter(f => f.key === 'measurement' || f.key === 'measUnit');
  manualDetails: Record<string, ItemManualDetail> = {};
  confirmedItemIds = new Set<string>();
  detailItemId: string | null = null;

  readonly chat = inject(ChatService);
  readonly cdr  = inject(ChangeDetectorRef);
  readonly el   = inject(ElementRef);

  editingKey: string | null = null;
  saved = false;

  readonly declSections = CUSTOMS_DECLARATION_HEADER_SECTIONS;
  get declaration(): CustomsDeclarationData | undefined { return this.local.customsDeclaration; }

  declValue(key: string): string {
    return ((this.declaration as unknown as Record<string, string>)?.[key] ?? '').toString();
  }
  declHasValue(key: string): boolean { return this.declValue(key).trim().length > 0; }
  declDisplay(key: string): string { return this.declValue(key) || '—'; }
  sectionHasAnyValue(section: { rows: { key: string }[] }): boolean {
    return section.rows.some(r => this.declHasValue(r.key));
  }

  startDeclEdit(key: string): void {
    if (this.saved) return;
    this.editingKey = 'decl:' + key;
    this.cdr.detectChanges();
    setTimeout(() => {
      const input = this.el.nativeElement.querySelector(`[data-decl-key="${key}"]`) as HTMLInputElement;
      input?.focus(); input?.select();
    }, 30);
  }

  onDeclInput(key: string, event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    if (!this.local.customsDeclaration) return;
    this.local.customsDeclaration = { ...this.local.customsDeclaration, [key]: val };
  }

  /** The full CustomsDeclarationItem this line item was sourced from, when one exists (customs/
   *  SPN paths) — drives the rich read-only detail via <app-customs-item-detail>. Invoice-path
   *  items with no matching declaration item fall back to the basic InvoiceLineItem fields. */
  declarationItem(item: InvoiceLineItem): CustomsDeclarationItem | undefined {
    if (item.declarationItemNumber == null) return undefined;
    return this.declaration?.items.find(i => i.itemNumber === item.declarationItemNumber);
  }

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
    // Only the user-editable fields gate completion — Lot/Mfg/Exp/Qty are auto-filled from OCR
    // and may legitimately stay blank when the source document simply didn't have them (e.g. no
    // production/lot details on file for a given item).
    return this.editableFields.every(f => (d[f.key] ?? '').trim().length > 0);
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

  /** วว-ดด-ปปปป (พ.ศ.) → Date, for binding the manual-detail date pickers. */
  manualDateValue(id: string, key: keyof ItemManualDetail): Date | null {
    const val = this.manualDetails[id]?.[key];
    if (!val) return null;
    const [d, m, y] = val.split('-').map(Number);
    if (!d || !m || !y) return null;
    return new Date(y - 543, m - 1, d);
  }

  onManualDateChange(id: string, key: keyof ItemManualDetail, date: Date | null): void {
    const val = date
      ? `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear() + 543}`
      : '';
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
