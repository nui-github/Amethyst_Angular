import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, CheckCircle } from 'lucide-angular';
import { OcrResultsData } from '@app/core/models/types';
import { ChatService } from '@app/core/services/chat.service';

interface OcrRow { label: string; key: string; accent: boolean; checkNeeded?: boolean; conf?: number; }
interface OcrSection { title: string; color: string; rows: OcrRow[]; }

@Component({
  selector: 'app-ocr-results',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="ocr-wrap">
      <div class="ocr-hdr">
        <div class="ocr-hdr__icon"><lucide-icon [img]="CheckCircle" [size]="14" color="#0D8F61" /></div>
        <div>
          <p class="ocr-hdr__title">{{ isManual ? 'บันทึกข้อมูลเรียบร้อยแล้วครับ' : 'OCR อ่านข้อมูลได้แล้วครับ' }}</p>
          <p class="ocr-hdr__sub">{{ proceeded() ? 'ยืนยันข้อมูลแล้ว' : 'ตรวจสอบและแก้ไขข้อมูลก่อนดำเนินการต่อ' }}</p>
        </div>
      </div>

      @for (section of sections; track section.title) {
        <div class="ocr-sec">
          <div class="ocr-sec__head" [style.border-left-color]="section.color">
            <span class="ocr-sec__title">{{ section.title }}</span>
          </div>
          <div class="ocr-tbl">
            @for (row of section.rows; track row.key) {
              @if (hasValue(row.key)) {
                <div class="ocr-row"
                  [class.ocr-row--editing]="editingKey === row.key"
                  [class.ocr-row--ro]="proceeded()"
                  [class.ocr-row--check]="row.checkNeeded && !proceeded()"
                  (click)="startEdit(row.key)">
                  <span class="ocr-row__lbl">
                    {{ row.label }}
                    @if (row.checkNeeded && !proceeded()) {
                      <span class="ocr-check-pill">AI {{ row.conf }}%</span>
                    }
                  </span>
                  <span class="ocr-row__val-wrap">
                    @if (editingKey === row.key) {
                      <input class="ocr-input" [attr.data-key]="row.key" [value]="getValue(row.key)"
                        (input)="onInput(row.key, $event)" (blur)="commitEdit()" (keydown)="onKeydown($event)" />
                    } @else {
                      <span class="ocr-row__val" [class.ocr-row__val--accent]="row.accent" [class.ocr-row__val--warn]="row.checkNeeded && !proceeded()">{{ display(row.key) }}</span>
                      @if (!proceeded()) {
                        <span class="ocr-edit-chip">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                        </span>
                      }
                    }
                  </span>
                </div>
              }
            }
          </div>
        </div>
      }

      @if (!proceeded()) {
        <div class="ocr-foot">
          <span class="ocr-foot__hint">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            กดที่ช่องเพื่อแก้ไขข้อมูล
          </span>
          <button class="ocr-btn" (click)="proceed()">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            ดำเนินการต่อ
          </button>
        </div>
      } @else {
        <div class="ocr-foot ocr-foot--done">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0D8F61" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          ยืนยันข้อมูลแล้ว
        </div>
      }
    </div>
  `,
  styles: [`
    .ocr-wrap{display:flex;flex-direction:column;gap:0;border:1.5px solid #E8EAF2;border-radius:14px;overflow:hidden;background:#fff}
    .ocr-hdr{display:flex;align-items:center;gap:10px;padding:12px 16px;background:#F8FFF9;border-bottom:1px solid #E8F5E9}
    .ocr-hdr__icon{width:28px;height:28px;border-radius:8px;background:rgba(13,143,97,.08);display:flex;align-items:center;justify-content:center;flex-shrink:0}
    .ocr-hdr__title{font-size:13px;font-weight:700;color:#010136;margin:0;line-height:1.3}
    .ocr-hdr__sub{font-size:11px;color:#9CA3AF;margin:1px 0 0}
    .ocr-sec{border-bottom:1px solid #F5F6FA}
    .ocr-sec:last-of-type{border-bottom:none}
    .ocr-sec__head{padding:8px 16px 4px;border-left:3px solid #E8EAF2;margin:0 0 0 16px}
    .ocr-sec__title{font-size:10px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:.6px}
    .ocr-tbl{display:flex;flex-direction:column;padding:0 16px 8px}
    .ocr-row{display:grid;grid-template-columns:130px 1fr;gap:8px;padding:4px 4px 4px 0;border-bottom:1px solid #F8F9FB;align-items:center;border-radius:6px;cursor:pointer;transition:background .12s}
    .ocr-row:last-child{border-bottom:none}
    .ocr-row:not(.ocr-row--ro):not(.ocr-row--editing):hover{background:#F5F8FF}
    .ocr-row:not(.ocr-row--ro):not(.ocr-row--editing):hover .ocr-edit-chip{opacity:1;color:#0463EF;background:#dbeafe}
    .ocr-row--editing{background:#F0F5FF;cursor:text}
    .ocr-row--ro{cursor:default}
    .ocr-row--check{background:#FFFDF5;border-left:2px solid #F59E0B;padding-left:6px;border-radius:0}
    .ocr-row--check:not(.ocr-row--ro):not(.ocr-row--editing):hover{background:#FEF9EC}
    .ocr-row__lbl{font-size:12px;color:#6B7280;font-weight:500;white-space:nowrap;padding-left:4px;display:flex;align-items:center;gap:6px}
    .ocr-check-pill{font-size:9.5px;font-weight:700;color:#92400E;background:#FEF3C7;padding:1px 6px;border-radius:99px;letter-spacing:.2px;flex-shrink:0}
    .ocr-row__val-wrap{display:flex;align-items:center;gap:6px;min-width:0}
    .ocr-row__val{font-size:12px;color:#010136;font-weight:500;flex:1}
    .ocr-row__val--accent{color:#0463EF;font-weight:700}
    .ocr-row__val--warn{color:#B45309;font-weight:700}
    .ocr-edit-chip{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:5px;background:#EEF2FF;color:#94A3B8;opacity:.7;flex-shrink:0;transition:all .12s}
    .ocr-input{flex:1;font-size:12px;font-family:inherit;font-weight:500;color:#010136;border:1.5px solid #0463EF;border-radius:6px;padding:2px 7px;outline:none;background:#fff;min-width:0;width:100%}
    .ocr-foot{display:flex;align-items:center;justify-content:flex-end;gap:8px;padding:10px 16px;border-top:1px solid #F0F1F8;background:#FAFBFF;font-size:12px}
    .ocr-foot__hint{font-size:11px;color:#B0B4C4;margin-right:auto;display:flex;align-items:center;gap:5px}
    .ocr-foot--done{color:#0D8F61;font-weight:600;justify-content:flex-start;gap:6px}
    .ocr-btn{display:inline-flex;align-items:center;gap:6px;padding:7px 16px;border-radius:8px;border:none;background:var(--bizx-blue);color:#fff;font-size:12px;font-weight:700;font-family:inherit;cursor:pointer;transition:opacity .15s}
    .ocr-btn:hover{opacity:.88}
  `],
})
export class OcrResultsComponent {
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
  readonly proceeded = signal(false);

  readonly CheckCircle = CheckCircle;
  readonly chat = inject(ChatService);
  readonly cdr  = inject(ChangeDetectorRef);
  readonly el   = inject(ElementRef);

  get isManual(): boolean { return !!(this._data as Partial<OcrResultsData>).isManual; }

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
    if (key === '_qty') return v + ' กิโลกรัม';
    return v;
  }
  hasValue(key: string): boolean { const v = this.getValue(key); return v.trim().length > 0; }

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
