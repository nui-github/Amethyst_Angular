import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, CheckCircle } from 'lucide-angular';
import { OcrResultsData } from '@app/core/models/types';

@Component({
  selector: 'app-ocr-results',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="ocr-results">
      <p class="ocr-results__title">
        <lucide-icon [img]="CheckCircle" [size]="15" color="#0D8F61" />
        {{ isManual ? 'บันทึกข้อมูลเรียบร้อยแล้วครับ' : 'OCR อ่านข้อมูลได้แล้วครับ' }}
      </p>
      <div class="info-card" style="margin-top:0">
        <div class="info-card__head">{{ isManual ? 'ข้อมูลที่กรอก' : 'ข้อมูลที่ได้จากเอกสาร' }}</div>
        <div class="info-card__body">
          @for (row of rows; track row.label) {
            @if (row.value) {
              <div class="info-card__row">
                <span>{{ row.label }}</span>
                <span [style.color]="row.accent ? 'var(--bizx-blue)' : 'var(--bizx-navy)'"
                  [style.fontWeight]="row.accent ? '700' : '600'">{{ row.value }}</span>
              </div>
            }
          }
        </div>
      </div>
    </div>
  `,
  styles: ['.ocr-results__title{display:flex;align-items:center;gap:6px;font-size:13px;font-weight:700;color:#0D8F61;margin:0 0 10px}'],
})
export class OcrResultsComponent {
  @Input({ required: true }) data!: Record<string, unknown>;
  readonly CheckCircle = CheckCircle;

  get isManual(): boolean { return !!(this.data as Partial<OcrResultsData>).isManual; }

  get rows() {
    const d = this.data as Partial<OcrResultsData>;
    return [
      { label: 'Invoice No.',   value: d.invoiceNo,   accent: true  },
      { label: 'Invoice Date',  value: d.invoiceDate, accent: false },
      { label: 'ปริมาณ',        value: d.quantity ? d.quantity + ' กิโลกรัม' : '', accent: true },
      { label: 'ผู้นำเข้า',     value: d.importer,   accent: false },
      { label: 'ท่าเรือ',       value: d.port,        accent: false },
      { label: 'HS Code',       value: d.hsCode,      accent: true  },
      { label: 'ประเทศต้นทาง', value: d.countryOrigin, accent: false },
      { label: 'Lot No.',       value: d.lotNo,       accent: false },
      { label: 'U No.',         value: d.uNo,         accent: false },
    ];
  }
}
