import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatService } from '@app/core/services/chat.service';
import { PetroleumDutyDeclarationData, PetroleumEquipmentItem } from '@app/core/models/types';
import { PETROLEUM_DECL_SECTIONS } from '../petroleum-ocr-results/petroleum-ocr-results.component';

interface ItemCol { label: string; key: string; width: number; unitKey?: string; unitWidth?: number; required?: boolean; }

/**
 * Full-screen "กรอกข้อมูลเพิ่มเติม" panel for the petroleum duty-exemption ("ขอออกของไปก่อน") path —
 * mounted globally by ChatPageComponent (own signals, see ChatService.petroleumEditorOpen/
 * petroleumEditorMsgId), same overlay/table conventions as CustomsDeclarationEditorComponent but a
 * fully separate component/schema (see PetroleumDutyDeclarationData for why).
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

  readonly itemCols: ItemCol[] = [
    { label: 'ชื่อรายการ (TH)', key: 'nameTh', width: 200, required: true },
    { label: 'ชื่อรายการ (EN)', key: 'nameEn', width: 200, required: true },
    { label: 'พิกัดศุลกากร', key: 'tariffCode', width: 100, required: true },
    { label: 'จำนวน', key: 'quantity', width: 70, unitKey: 'quantityUnit', unitWidth: 70, required: true },
    { label: 'ประเทศแหล่งกำเนิด', key: 'originCountry', width: 90, required: true },
    { label: 'มูลค่า (บาท)', key: 'invoiceAmountBaht', width: 110, required: true },
  ];

  local: PetroleumDutyDeclarationData;

  constructor() {
    const existing = this.chat.formData().petroleumDeclaration;
    this.local = existing ? structuredClone(existing) : { items: [] };
  }

  headerValue(key: string): string {
    return ((this.local as unknown as Record<string, string>)[key] ?? '').toString();
  }

  onHeaderInput(key: string, event: Event): void {
    (this.local as unknown as Record<string, string>)[key] = (event.target as HTMLInputElement).value;
  }

  isHeaderMissing(row: { key: string; required?: boolean }): boolean {
    return !!row.required && !this.headerValue(row.key).trim();
  }

  itemValue(item: PetroleumEquipmentItem, key: string): string {
    return ((item as unknown as Record<string, string>)[key] ?? '').toString();
  }

  onItemInput(item: PetroleumEquipmentItem, key: string, event: Event): void {
    (item as unknown as Record<string, string>)[key] = (event.target as HTMLInputElement).value;
  }

  isItemFieldMissing(item: PetroleumEquipmentItem, key: string): boolean {
    return this.itemCols.some(c => c.key === key && c.required) && !this.itemValue(item, key).trim();
  }

  get missingHeaderCount(): number {
    return this.declSections.flatMap(s => s.rows).filter(r => this.isHeaderMissing(r)).length;
  }

  get missingItemCount(): number {
    return this.local.items.reduce(
      (sum, item) => sum + this.itemCols.filter(c => c.required && this.isItemFieldMissing(item, c.key)).length,
      0,
    );
  }

  get isComplete(): boolean {
    return this.local.items.length > 0 && this.missingHeaderCount === 0 && this.missingItemCount === 0;
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
