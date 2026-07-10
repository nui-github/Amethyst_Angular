import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '@app/core/services/chat.service';
import { CustomsDeclarationData, CustomsDeclarationItem, CustomsDeclarationProduction, CustomsDeclarationAuthority } from '@app/core/models/types';
import {
  CUSTOMS_DECLARATION_HEADER_SECTIONS,
  CUSTOMS_DECLARATION_ITEM_REQUIRED_FIELDS,
  CustomsDeclRow,
} from '@app/shared/utils/customs-declaration-sections';

interface ItemCol { label: string; key: string; width: number; unitKey?: string; unitWidth?: number; required?: boolean; }
interface FlatProductionRow { item: CustomsDeclarationItem; index: number; p: CustomsDeclarationProduction; }
interface FlatAuthorityRow { item: CustomsDeclarationItem; index: number; a: CustomsDeclarationAuthority; }

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

  // Widths are sized to what each field actually holds — short numeric/code fields get just
  // enough room, free-text fields (names, manufacturer) get more — so every item renders as one
  // clean row instead of value/unit pairs wrapping onto a second line.
  readonly itemCols: ItemCol[] = [
    { label: 'ชื่อสินค้า (TH)', key: 'nameTh', width: 170, required: true },
    { label: 'ชื่อสินค้า (EN)', key: 'nameEn', width: 190, required: true },
    { label: 'พิกัดศุลกากร', key: 'tariffCode', width: 100, required: true },
    { label: 'ปริมาณ', key: 'quantity', width: 60, unitKey: 'quantityUnit', unitWidth: 52, required: true },
    { label: 'น้ำหนักสุทธิ', key: 'netWeight', width: 70, unitKey: 'netWeightUnit', unitWidth: 52 },
    { label: 'จำนวนหีบห่อ', key: 'packageAmount', width: 55, unitKey: 'packageUnit', unitWidth: 52 },
    { label: 'ประเทศกำเนิด', key: 'originCountry', width: 100, required: true },
    { label: 'ประเทศที่ซื้อ', key: 'purchaseCountry', width: 100 },
    { label: 'มูลค่า (ตปท.)', key: 'invoiceAmountForeign', width: 85, unitKey: 'currencyCode', unitWidth: 55 },
    { label: 'มูลค่า (บาท)', key: 'invoiceAmountBaht', width: 90 },
    { label: 'เลขที่ Invoice', key: 'invoiceNo', width: 110 },
    { label: 'ผู้ผลิต', key: 'manufacture', width: 220 },
  ];

  readonly agencyOptions = ['อย.', 'กษ.', 'ปส.'];

  local: CustomsDeclarationData;
  addProductionItemNumber: number | null = null;
  addAuthorityItemNumber: number | null = null;

  constructor() {
    const existing = this.chat.formData().customsDeclaration;
    this.local = existing ? structuredClone(existing) : { items: [] };
    this.addProductionItemNumber = this.local.items[0]?.itemNumber ?? null;
    this.addAuthorityItemNumber = this.local.items[0]?.itemNumber ?? null;
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

  // ── Production / lot data (from COA) ──────────────────────────────────────────
  // Measurement + Meas. Unit are the only fields no OCR pass captures — the rest (lot no.,
  // mfg/exp date, qty) comes straight from the COA document's OCR read.
  get flatProductions(): FlatProductionRow[] {
    return this.local.items.flatMap(item =>
      (item.productions ?? []).map((p, index) => ({ item, index, p })),
    );
  }

  productionValue(p: CustomsDeclarationProduction, key: keyof CustomsDeclarationProduction): string {
    return (p[key] ?? '').toString();
  }

  onProductionInput(p: CustomsDeclarationProduction, key: keyof CustomsDeclarationProduction, event: Event): void {
    p[key] = (event.target as HTMLInputElement).value;
  }

  isProductionMissing(p: CustomsDeclarationProduction, key: keyof CustomsDeclarationProduction): boolean {
    return !this.productionValue(p, key).trim();
  }

  addProduction(item: CustomsDeclarationItem): void {
    item.productions = [...(item.productions ?? []), {}];
  }

  addProductionForSelected(): void {
    const item = this.local.items.find(i => i.itemNumber === this.addProductionItemNumber);
    if (item) this.addProduction(item);
  }

  removeProduction(row: FlatProductionRow): void {
    row.item.productions = (row.item.productions ?? []).filter((_, i) => i !== row.index);
  }

  // ── Authority / license data (from เลข U) ─────────────────────────────────────
  get flatAuthorities(): FlatAuthorityRow[] {
    return this.local.items.flatMap(item =>
      (item.authorities ?? []).map((a, index) => ({ item, index, a })),
    );
  }

  authorityValue(a: CustomsDeclarationAuthority, key: keyof CustomsDeclarationAuthority): string {
    return (a[key] ?? '').toString();
  }

  onAuthorityInput(a: CustomsDeclarationAuthority, key: keyof CustomsDeclarationAuthority, event: Event): void {
    a[key] = (event.target as HTMLInputElement | HTMLSelectElement).value;
  }

  addAuthority(item: CustomsDeclarationItem): void {
    item.authorities = [...(item.authorities ?? []), {}];
  }

  addAuthorityForSelected(): void {
    const item = this.local.items.find(i => i.itemNumber === this.addAuthorityItemNumber);
    if (item) this.addAuthority(item);
  }

  removeAuthority(row: FlatAuthorityRow): void {
    row.item.authorities = (row.item.authorities ?? []).filter((_, i) => i !== row.index);
  }

  itemLabel(item: CustomsDeclarationItem): string {
    return item.nameTh || item.nameEn || `รายการที่ ${item.itemNumber}`;
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

  get missingProductionCount(): number {
    return this.flatProductions.reduce(
      (sum, row) => sum + (this.isProductionMissing(row.p, 'measurement') ? 1 : 0) + (this.isProductionMissing(row.p, 'measurementUnit') ? 1 : 0),
      0,
    );
  }

  get isComplete(): boolean {
    return this.local.items.length > 0
      && this.missingHeaderCount === 0
      && this.missingItemCount === 0
      && this.missingProductionCount === 0;
  }

  close(): void {
    this.chat.closeDeclarationEditor();
  }

  save(): void {
    if (!this.isComplete) return;
    this.chat.saveDeclarationEditor(this.local);
  }
}
