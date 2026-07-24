import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatService } from '@app/core/services/chat.service';
import { DmfDutyRow, DmfItemData, DmfPermitRow, PetroleumDutyDeclarationData } from '@app/core/models/types';
import { PETROLEUM_DECL_SECTIONS } from '../petroleum-ocr-results/petroleum-ocr-results.component';

interface ItemCol { label: string; key: string; width: number; unitKey?: string; unitWidth?: number; required?: boolean; }
interface ExtraField { label: string; key: string; width?: number; required?: boolean; select?: string[]; }
interface FlatDutyRow { item: DmfItemData; index: number; d: DmfDutyRow; }
interface FlatPermitRow { item: DmfItemData; index: number; p: DmfPermitRow; }

/**
 * Full-screen "กรอกข้อมูลเพิ่มเติม" panel for the petroleum duty-exemption ("ขอออกของไปก่อน") path —
 * mounted globally by ChatPageComponent (own signals, see ChatService.petroleumEditorOpen/
 * petroleumEditorMsgId), same overlay/table conventions as CustomsDeclarationEditorComponent but a
 * fully separate component/schema modeled on the real DMF License Request message (Control/
 * Invoice/Detail/Duty/Permit) — see PetroleumDutyDeclarationData.
 */
@Component({
  selector: 'app-petroleum-declaration-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [CommonModule],
  templateUrl: './petroleum-declaration-editor.component.html',
  styleUrl: './petroleum-declaration-editor.component.scss',
})
export class PetroleumDeclarationEditorComponent {
  readonly chat = inject(ChatService);

  readonly declSections = PETROLEUM_DECL_SECTIONS;

  // Main item table — core commercial fields shown as columns; everything else (value/exchange
  // breakdown, BOI/Bond-style flags, duty, permit) lives in the per-item groups below so this main
  // table stays a manageable width.
  readonly itemCols: ItemCol[] = [
    { label: 'ชื่อรายการ (TH)', key: 'nameTh', width: 190, required: true },
    { label: 'ชื่อรายการ (EN)', key: 'nameEn', width: 190, required: true },
    { label: 'พิกัดศุลกากร', key: 'tariffCode', width: 90, required: true },
    { label: 'ลำดับอัตราอากร', key: 'tariffSequence', width: 60, required: true },
    { label: 'รหัสสถิติ', key: 'statisticalCode', width: 60, required: true },
    { label: 'รหัสสิทธิพิเศษ', key: 'privilegeCode', width: 70, required: true },
    { label: 'ปีของสินค้า', key: 'productYear', width: 60, required: true },
    { label: 'เครื่องหมายการค้า', key: 'brandName', width: 110, required: true },
    { label: 'จำนวน', key: 'quantity', width: 70, unitKey: 'quantityUnit', unitWidth: 55, required: true },
    { label: 'น้ำหนักสุทธิ', key: 'netWeight', width: 90, unitKey: 'netWeightUnit', unitWidth: 55, required: true },
    { label: 'ประเทศแหล่งกำเนิด', key: 'originCountryCode', width: 70, required: true },
    { label: 'มูลค่า CIF (บาท)', key: 'cifValueBaht', width: 100, required: true },
  ];

  // Per-item flat fields (not arrays) — value/exchange breakdown + special-privilege Y/N flags,
  // rendered as a small form-grid inside each item's group card.
  readonly extraFields: ExtraField[] = [
    { label: 'ลำดับในอินวอย', key: 'invoiceItemNumber', required: true },
    { label: 'พิกัดภาค 4 (ยกเว้นอากร)', key: 'importTariff' },
    { label: 'ประเภทข้อมูล (Nature)', key: 'natureOfTransaction', required: true },
    { label: 'สกุลเงิน', key: 'currencyCode', required: true },
    { label: 'อัตราแลกเปลี่ยน', key: 'exchangeRate', required: true },
    { label: 'ราคาต่อหน่วย (ตปท.)', key: 'unitPriceForeign', required: true },
    { label: 'ราคาต่อหน่วย (บาท)', key: 'unitPriceBaht', required: true },
    { label: 'ปริมาณตามอินวอย', key: 'invoiceQuantity', required: true },
    { label: 'หน่วยปริมาณอินวอย', key: 'invoiceQuantityUnit', required: true },
    { label: 'มูลค่าอินวอย (ตปท.)', key: 'invoiceAmountForeign', required: true },
    { label: 'มูลค่าอินวอย (บาท)', key: 'invoiceAmountBaht', required: true },
    { label: 'ราคา CIF (ตปท.)', key: 'cifValueForeign', required: true },
    { label: 'เครื่องหมาย/เลขหมายหีบห่อ', key: 'shippingMarks', required: true },
    { label: 'สุทธินำกลับ', key: 'reImportationCertificate', select: ['Y', 'N'], required: true },
    { label: 'BOI', key: 'boi', select: ['Y', 'N'], required: true },
    { label: 'คลังสินค้าทัณฑ์บน (Bond)', key: 'bond', select: ['Y', 'N'], required: true },
    { label: 'คืนอากร ม.19 ทวิ', key: 'bis19', select: ['Y', 'N'], required: true },
    { label: 'Re-Export', key: 'reExport', select: ['Y', 'N'], required: true },
    { label: 'Free Zone', key: 'fz', select: ['Y', 'N'], required: true },
    { label: 'IEAT', key: 'ieat', select: ['Y', 'N'], required: true },
  ];

  local: PetroleumDutyDeclarationData;

  constructor() {
    const existing = this.chat.formData().petroleumDeclaration;
    this.local = existing ? structuredClone(existing) : { control: {}, invoice: {}, items: [] };
  }

  // ── Header (Control / Invoice) ──────────────────────────────────────────────
  headerValue(group: 'control' | 'invoice', key: string): string {
    return ((this.local[group] as unknown as Record<string, string>)[key] ?? '').toString();
  }

  onHeaderInput(group: 'control' | 'invoice', key: string, event: Event): void {
    (this.local[group] as unknown as Record<string, string>)[key] = (event.target as HTMLInputElement).value;
  }

  isHeaderMissing(group: 'control' | 'invoice', row: { key: string; required?: boolean }): boolean {
    return !!row.required && !this.headerValue(group, row.key).trim();
  }

  // ── Item main-table fields ──────────────────────────────────────────────────
  itemValue(item: DmfItemData, key: string): string {
    return ((item as unknown as Record<string, string>)[key] ?? '').toString();
  }

  onItemInput(item: DmfItemData, key: string, event: Event): void {
    (item as unknown as Record<string, string>)[key] = (event.target as HTMLInputElement | HTMLSelectElement).value;
  }

  isItemFieldMissing(item: DmfItemData, key: string): boolean {
    return this.itemCols.some(c => c.key === key && c.required) && !this.itemValue(item, key).trim();
  }

  isExtraFieldMissing(item: DmfItemData, field: ExtraField): boolean {
    return !!field.required && !this.itemValue(item, field.key).trim();
  }

  itemLabel(item: DmfItemData): string {
    return item.nameEn || item.nameTh || `รายการที่ ${item.itemNumber}`;
  }

  itemOrder(item: DmfItemData): number {
    return this.local.items.findIndex(i => i.itemNumber === item.itemNumber) + 1;
  }

  // ── Duty (ส่วนภาษี) — array per item ─────────────────────────────────────────
  get flatDuties(): FlatDutyRow[] {
    return this.local.items.flatMap(item => (item.duties ?? []).map((d, index) => ({ item, index, d })));
  }

  dutyValue(d: DmfDutyRow, key: keyof DmfDutyRow): string { return (d[key] ?? '').toString(); }
  onDutyInput(d: DmfDutyRow, key: keyof DmfDutyRow, event: Event): void { d[key] = (event.target as HTMLInputElement).value; }
  isDutyMissing(d: DmfDutyRow): boolean {
    return !this.dutyValue(d, 'dutyType').trim() || !this.dutyValue(d, 'valueRate').trim() || !this.dutyValue(d, 'amount').trim() || !this.dutyValue(d, 'amountPaid').trim();
  }

  addDuty(item: DmfItemData): void { item.duties = [...(item.duties ?? []), {}]; }
  removeDutyAt(item: DmfItemData, index: number): void { item.duties = (item.duties ?? []).filter((_, i) => i !== index); }

  // ── Permit (ส่วนใบอนุญาต) — optional array per item ──────────────────────────
  get flatPermits(): FlatPermitRow[] {
    return this.local.items.flatMap(item => (item.permits ?? []).map((p, index) => ({ item, index, p })));
  }

  permitValue(p: DmfPermitRow, key: keyof DmfPermitRow): string { return (p[key] ?? '').toString(); }
  onPermitInput(p: DmfPermitRow, key: keyof DmfPermitRow, event: Event): void { p[key] = (event.target as HTMLInputElement).value; }

  addPermit(item: DmfItemData): void { item.permits = [...(item.permits ?? []), {}]; }
  removePermitAt(item: DmfItemData, index: number): void { item.permits = (item.permits ?? []).filter((_, i) => i !== index); }

  // ── Completion / save ────────────────────────────────────────────────────────
  get missingHeaderCount(): number {
    let n = 0;
    for (const section of this.declSections) {
      for (const row of section.rows) {
        if (this.isHeaderMissing(section.group, row)) n++;
      }
    }
    return n;
  }

  get missingItemCount(): number {
    return this.local.items.reduce((sum, item) => {
      const mainMissing = this.itemCols.filter(c => c.required && this.isItemFieldMissing(item, c.key)).length;
      const extraMissing = this.extraFields.filter(f => this.isExtraFieldMissing(item, f)).length;
      return sum + mainMissing + extraMissing;
    }, 0);
  }

  get missingDutyCount(): number {
    return this.flatDuties.filter(row => this.isDutyMissing(row.d)).length;
  }

  get isComplete(): boolean {
    return this.local.items.length > 0
      && this.local.items.every(i => (i.duties ?? []).length > 0)
      && this.missingHeaderCount === 0
      && this.missingItemCount === 0
      && this.missingDutyCount === 0;
  }

  confirming = false;

  close(): void {
    this.chat.closePetroleumEditor();
  }

  requestSave(): void {
    if (!this.isComplete) return;
    this.confirming = true;
  }

  cancelSave(): void {
    this.confirming = false;
  }

  save(): void {
    if (!this.isComplete) return;
    this.confirming = false;
    this.chat.savePetroleumEditor(this.local);
  }
}
