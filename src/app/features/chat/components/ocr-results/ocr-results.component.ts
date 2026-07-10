import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, CheckCircle } from 'lucide-angular';
import { OcrResultsData, OcrLineItem, CustomsDeclarationData, CustomsDeclarationItem } from '@app/core/models/types';
import { CUSTOMS_DECLARATION_HEADER_SECTIONS } from '@app/shared/utils/customs-declaration-sections';
import { CustomsItemDetailComponent } from '../customs-item-detail/customs-item-detail.component';
import { ChatService } from '@app/core/services/chat.service';

interface OcrRow { label: string; key: string; accent: boolean; checkNeeded?: boolean; conf?: number; }
interface OcrSection { title: string; color: string; rows: OcrRow[]; }

@Component({
  selector: 'app-ocr-results',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [CommonModule, LucideAngularModule, CustomsItemDetailComponent],
  templateUrl: './ocr-results.component.html',
  styleUrl: './ocr-results.component.scss',
})
export class OcrResultsComponent {
  @Input() msgId = '';

  @Input({ required: true }) set data(val: Record<string, unknown>) {
    this._data = val;
    this.local = { ...(val as Partial<OcrResultsData>) };
    if ((val as Partial<OcrResultsData>).autoProceeded) {
      this.proceeded.set(true);
    }
  }
  get data(): Record<string, unknown> { return this._data; }
  private _data!: Record<string, unknown>;

  local: Partial<OcrResultsData> = {};
  editingKey: string | null = null;
  detailItemNumber: number | null = null;
  readonly proceeded = signal(false);

  readonly CheckCircle = CheckCircle;
  readonly chat = inject(ChatService);
  readonly cdr  = inject(ChangeDetectorRef);
  readonly el   = inject(ElementRef);

  readonly declSections = CUSTOMS_DECLARATION_HEADER_SECTIONS;

  get isManual(): boolean { return !!(this._data as Partial<OcrResultsData>).isManual; }
  get declarationComplete(): boolean { return !!this.local.declarationComplete; }
  get declarationGateRequired(): boolean { return !!this.local.declarationGateRequired; }

  openEditor(): void { this.chat.openDeclarationEditor(this.msgId); }

  get lineItems(): OcrLineItem[] { return this.local.lineItems ?? []; }
  get declaration(): CustomsDeclarationData | undefined { return this.local.customsDeclaration; }
  get declItems(): CustomsDeclarationItem[] { return this.declaration?.items ?? []; }

  get detailItem(): CustomsDeclarationItem | undefined {
    return this.declItems.find(i => i.itemNumber === this.detailItemNumber);
  }

  readonly sections: OcrSection[] = [
    { title: 'ข้อมูลเอกสาร', color: '#0463EF', rows: [
      { label: 'Invoice No.',  key: 'invoiceNo',   accent: true  },
      { label: 'Invoice Date', key: 'invoiceDate', accent: false },
      { label: 'ปริมาณ',       key: '_qty',        accent: true, checkNeeded: true, conf: 72 },
    ]},
    { title: 'ผู้ประกอบการ', color: '#7C3AED', rows: [
      { label: 'ผู้นำเข้า',    key: 'importer',    accent: false },
      { label: 'ท่าเรือ',      key: 'port',        accent: false },
      { label: 'ประเทศต้นทาง', key: 'countryOrigin', accent: false },
    ]},
    { title: 'สินค้า', color: '#0D8F61', rows: [
      { label: 'HS Code', key: 'hsCode', accent: true  },
      { label: 'Lot No.', key: 'lotNo',  accent: false },
      { label: 'U No.',   key: 'uNo',    accent: false },
    ]},
  ];

  getValue(key: string): string {
    if (key === '_qty') return this.local.quantity ?? '';
    return (this.local as Record<string, string>)[key] ?? '';
  }

  display(key: string): string {
    const v = this.getValue(key);
    if (!v.trim()) return '—';
    if (key === '_qty') return v + ' ' + (this.local.qtyUnit ?? 'กิโลกรัม');
    return v;
  }
  hasValue(key: string): boolean { const v = this.getValue(key); return v.trim().length > 0; }

  // ── Declaration (structured) rows ────────────────────────────────────────────
  declValue(key: string): string {
    return ((this.declaration as unknown as Record<string, string>)?.[key] ?? '').toString();
  }
  declHasValue(key: string): boolean { return this.declValue(key).trim().length > 0; }
  declDisplay(key: string): string { return this.declValue(key) || '—'; }
  sectionHasAnyValue(section: OcrSection): boolean { return section.rows.some(r => this.declHasValue(r.key)); }

  startDeclEdit(key: string): void {
    if (this.proceeded()) return;
    this.editingKey = 'decl:' + key;
    this.cdr.detectChanges();
    setTimeout(() => {
      const input = this.el.nativeElement.querySelector(`[data-decl-key="${key}"]`) as HTMLInputElement;
      input?.focus(); input?.select();
    }, 20);
  }

  onDeclInput(key: string, event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    if (!this.local.customsDeclaration) return;
    this.local.customsDeclaration = { ...this.local.customsDeclaration, [key]: val };
    this.chat.formData.update(f => ({
      ...f,
      customsDeclaration: f.customsDeclaration ? { ...f.customsDeclaration, [key]: val } : f.customsDeclaration,
    }));
  }

  openItemDetail(itemNumber: number): void { this.detailItemNumber = itemNumber; }
  closeItemDetail(): void { this.detailItemNumber = null; }

  onItemDetailChange(updated: CustomsDeclarationItem): void {
    if (!this.local.customsDeclaration) return;
    const items = this.local.customsDeclaration.items.map(i => i.itemNumber === updated.itemNumber ? updated : i);
    this.local.customsDeclaration = { ...this.local.customsDeclaration, items };
    this.chat.formData.update(f => f.customsDeclaration ? {
      ...f,
      customsDeclaration: {
        ...f.customsDeclaration,
        items: f.customsDeclaration.items.map(i => i.itemNumber === updated.itemNumber ? updated : i),
      },
    } : f);
  }

  itemTitle(item: CustomsDeclarationItem): string {
    return item.nameTh || item.nameEn || `รายการที่ ${item.itemNumber}`;
  }

  // ── Legacy flat-field editing (kept for backward compat with historical mocks) ──
  startEdit(key: string): void {
    if (this.proceeded()) return;
    this.editingKey = key;
    this.cdr.detectChanges();
    setTimeout(() => {
      const input = this.el.nativeElement.querySelector(`[data-key="${key}"]`) as HTMLInputElement;
      input?.focus(); input?.select();
    }, 20);
  }

  onInput(key: string, event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    if (key === '_qty') {
      this.local.quantity = val;
      this.chat.formData.update(f => ({ ...f, quantity: val }));
    } else {
      (this.local as Record<string, string>)[key] = val;
      this.chat.formData.update(f => ({ ...f, [key]: val }));
    }
  }

  commitEdit(): void { this.editingKey = null; this.cdr.detectChanges(); }
  onKeydown(event: KeyboardEvent): void { if (event.key === 'Enter' || event.key === 'Escape') this.commitEdit(); }

  proceed(): void {
    if (this.proceeded()) return;
    this.proceeded.set(true);
    this.cdr.detectChanges();
    this.chat.onOcrResultsProceed();
  }
}
