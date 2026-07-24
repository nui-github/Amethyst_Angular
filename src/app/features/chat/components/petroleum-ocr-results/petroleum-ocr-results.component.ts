import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, CheckCircle } from 'lucide-angular';
import { PetroleumDutyDeclarationData, PetroleumOcrResultsData } from '@app/core/models/types';
import { ChatService } from '@app/core/services/chat.service';

interface PetroSection { title: string; color: string; rows: { label: string; key: string; required?: boolean }[]; }

// ข้อมูลตามคำร้อง "ขอออกของไปก่อน" เพื่อยกเว้นอากรนำเข้าสำหรับกิจการปิโตรเลียม (มาตรา 70
// พ.ร.บ.ปิโตรเลียม พ.ศ. 2514) — โคลนจาก OcrResultsComponent แต่แยกเป็นสคีมาของตัวเอง เพราะ field
// เฉพาะทาง (รหัสสิทธิพิเศษ/เลขที่หนังสือรับรอง DMF/หนังสือค้ำประกัน) ไม่มีใน CustomsDeclarationData
export const PETROLEUM_DECL_SECTIONS: PetroSection[] = [
  { title: 'ข้อมูลใบขนขาเข้า', color: '#0463EF', rows: [
    { label: 'เลขที่ใบขน',      key: 'importDeclarationNo', required: true },
    { label: 'วันที่นำเข้า',     key: 'importDate' },
    { label: 'ด่านศุลกากรนำเข้า', key: 'customsHouseName' },
    { label: 'ประเภทใบขน',      key: 'declarationType' },
  ]},
  { title: 'ข้อมูลบริษัทผู้นำเข้า/ผู้รับสัมปทาน', color: '#7C3AED', rows: [
    { label: 'ชื่อบริษัท',                key: 'companyName', required: true },
    { label: 'เลขผู้เสียภาษี',             key: 'companyTaxNumber', required: true },
    { label: 'เลขที่สัมปทาน/แปลงสำรวจ',   key: 'concessionNumber' },
  ]},
  { title: 'ข้อมูลสิทธิยกเว้นอากร (มาตรา 70 พ.ร.บ.ปิโตรเลียม)', color: '#0D8F61', rows: [
    { label: 'เลขที่คำร้องขอออกของไปก่อน', key: 'earlyReleaseRequestNo', required: true },
    { label: 'รหัสสิทธิพิเศษ',             key: 'privilegeCode' },
    { label: 'เลขที่หนังสือรับรอง (DMF)',   key: 'dmfCertificateNo' },
    { label: 'เลขที่หนังสือค้ำประกัน',      key: 'guaranteeNumber', required: true },
    { label: 'วงเงินค้ำประกัน (บาท)',       key: 'guaranteeAmount', required: true },
  ]},
];

@Component({
  selector: 'app-petroleum-ocr-results',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './petroleum-ocr-results.component.html',
  styleUrl: './petroleum-ocr-results.component.scss',
})
export class PetroleumOcrResultsComponent {
  @Input() msgId = '';

  @Input({ required: true }) set data(val: Record<string, unknown>) {
    this.local = { ...(val as Partial<PetroleumOcrResultsData>) };
  }
  get data(): Record<string, unknown> { return this._data; }
  private _data!: Record<string, unknown>;

  local: Partial<PetroleumOcrResultsData> = {};
  editingKey: string | null = null;
  readonly proceeded = signal(false);

  readonly CheckCircle = CheckCircle;
  readonly chat = inject(ChatService);
  readonly cdr  = inject(ChangeDetectorRef);
  readonly el   = inject(ElementRef);

  readonly sections = PETROLEUM_DECL_SECTIONS;

  get declaration(): PetroleumDutyDeclarationData | undefined { return this.local.declaration; }
  get items() { return this.declaration?.items ?? []; }
  get declarationComplete(): boolean { return !!this.local.declarationComplete; }
  get declarationGateRequired(): boolean { return !!this.local.declarationGateRequired; }

  openEditor(): void { this.chat.openPetroleumEditor(this.msgId); }

  declValue(key: string): string {
    return ((this.declaration as unknown as Record<string, string>)?.[key] ?? '').toString();
  }
  declHasValue(key: string): boolean { return this.declValue(key).trim().length > 0; }
  declDisplay(key: string): string { return this.declValue(key) || '—'; }
  sectionHasAnyValue(section: PetroSection): boolean { return section.rows.some(r => this.declHasValue(r.key)); }

  startDeclEdit(key: string): void {
    if (this.proceeded() || !this.declaration) return;
    this.editingKey = key;
    this.cdr.detectChanges();
    setTimeout(() => {
      const input = this.el.nativeElement.querySelector(`[data-decl-key="${key}"]`) as HTMLInputElement;
      input?.focus(); input?.select();
    }, 20);
  }

  onDeclInput(key: string, event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    if (!this.local.declaration) return;
    this.local.declaration = { ...this.local.declaration, [key]: val };
  }

  commitEdit(): void { this.editingKey = null; this.cdr.detectChanges(); }
  onKeydown(event: KeyboardEvent): void { if (event.key === 'Enter' || event.key === 'Escape') this.commitEdit(); }

  proceed(): void {
    if (this.proceeded()) return;
    this.proceeded.set(true);
    this.cdr.detectChanges();
    this.chat.onPetroleumOcrProceed();
  }
}
