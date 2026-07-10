import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '@app/core/services/chat.service';
import { CustomsDeclarationData, CustomsDeclarationItem } from '@app/core/models/types';
import {
  CUSTOMS_DECLARATION_HEADER_SECTIONS,
  CUSTOMS_DECLARATION_ITEM_REQUIRED_FIELDS,
  CustomsDeclRow,
} from '@app/shared/utils/customs-declaration-sections';

interface ItemCol { label: string; key: string; unitKey?: string; required?: boolean; }

/**
 * Full-screen "กรอกข้อมูลเพิ่มเติม" panel — near-fullscreen overlay (opened from ocr-results,
 * mounted globally by ChatPageComponent so it isn't constrained by the chat bubble's width).
 * Shows the complete DocumentControl header + every GoodsShipment item as an editable table,
 * matching the real LPI submission JSON schema. Some fields arrive pre-filled from OCR, the
 * rest is left for the user to type in; "บันทึก" stays disabled until every field marked
 * required (CustomsDeclRow.required / CUSTOMS_DECLARATION_ITEM_REQUIRED_FIELDS) is filled.
 */
@Component({
  selector: 'app-customs-declaration-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [CommonModule, FormsModule],
  templateUrl: './customs-declaration-editor.component.html',
  styleUrl: './customs-declaration-editor.component.scss',
})
export class CustomsDeclarationEditorComponent {
  readonly chat = inject(ChatService);

  readonly declSections = CUSTOMS_DECLARATION_HEADER_SECTIONS;
  readonly itemRequiredFields = CUSTOMS_DECLARATION_ITEM_REQUIRED_FIELDS;

  readonly itemCols: ItemCol[] = [
    { label: 'ชื่อสินค้า (TH)', key: 'nameTh', required: true },
    { label: 'ชื่อสินค้า (EN)', key: 'nameEn', required: true },
    { label: 'พิกัดศุลกากร', key: 'tariffCode', required: true },
    { label: 'ปริมาณ', key: 'quantity', unitKey: 'quantityUnit', required: true },
    { label: 'น้ำหนักสุทธิ', key: 'netWeight', unitKey: 'netWeightUnit' },
    { label: 'จำนวนหีบห่อ', key: 'packageAmount', unitKey: 'packageUnit' },
    { label: 'ประเทศกำเนิด', key: 'originCountry', required: true },
    { label: 'ประเทศที่ซื้อ', key: 'purchaseCountry' },
    { label: 'มูลค่า (ตปท.)', key: 'invoiceAmountForeign', unitKey: 'currencyCode' },
    { label: 'มูลค่า (บาท)', key: 'invoiceAmountBaht' },
    { label: 'เลขที่ Invoice', key: 'invoiceNo' },
    { label: 'ผู้ผลิต', key: 'manufacture' },
  ];

  local: CustomsDeclarationData;

  constructor() {
    const existing = this.chat.formData().customsDeclaration;
    this.local = existing ? structuredClone(existing) : { items: [] };
  }

  // ── Header fields ────────────────────────────────────────────────────────────
  headerValue(key: string): string {
    return ((this.local as unknown as Record<string, string>)[key] ?? '').toString();
  }

  onHeaderInput(key: string, event: Event): void {
    (this.local as unknown as Record<string, string>)[key] = (event.target as HTMLInputElement).value;
  }

  isHeaderMissing(row: CustomsDeclRow): boolean {
    return !!row.required && !this.headerValue(row.key).trim();
  }

  // ── Item fields ──────────────────────────────────────────────────────────────
  itemValue(item: CustomsDeclarationItem, key: string): string {
    return ((item as unknown as Record<string, string>)[key] ?? '').toString();
  }

  onItemInput(item: CustomsDeclarationItem, key: string, event: Event): void {
    (item as unknown as Record<string, string>)[key] = (event.target as HTMLInputElement).value;
  }

  isItemFieldMissing(item: CustomsDeclarationItem, key: string): boolean {
    return this.itemRequiredFields.includes(key) && !this.itemValue(item, key).trim();
  }

  // ── Completion / save ────────────────────────────────────────────────────────
  get missingHeaderCount(): number {
    return this.declSections.flatMap(s => s.rows).filter(r => this.isHeaderMissing(r)).length;
  }

  get missingItemCount(): number {
    return this.local.items.reduce(
      (sum, item) => sum + this.itemRequiredFields.filter(k => this.isItemFieldMissing(item, k)).length,
      0,
    );
  }

  get isComplete(): boolean {
    return this.local.items.length > 0 && this.missingHeaderCount === 0 && this.missingItemCount === 0;
  }

  close(): void {
    this.chat.closeDeclarationEditor();
  }

  save(): void {
    if (!this.isComplete) return;
    this.chat.saveDeclarationEditor(this.local);
  }
}
