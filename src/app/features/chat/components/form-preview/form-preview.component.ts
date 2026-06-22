import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LicenseFormData } from '@app/core/models/types';

interface PreviewSection {
  title: string;
  color: string;
  rows: { label: string; value: string; highlight?: boolean }[];
}

@Component({
  selector: 'app-form-preview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './form-preview.component.html',
  styleUrl: './form-preview.component.scss',
})
export class FormPreviewComponent {
  @Input({ required: true }) data!: LicenseFormData;

  get sections(): PreviewSection[] {
    const d = this.data;
    return [
      {
        title: 'ข้อมูลใบขนสินค้า',
        color: '#0463EF',
        rows: [
          { label: 'เลขที่อ้างอิง (Ref)',  value: d.ref            ?? '—' },
          { label: 'เลขที่ Invoice',         value: d.invoiceNo      ?? '—', highlight: true },
          { label: 'วันที่ Invoice',          value: d.invoiceDate    ?? '—' },
          { label: 'วันที่นำเข้า',            value: d.importDate     ?? '—' },
        ],
      },
      {
        title: 'ผู้ประกอบการ',
        color: '#7C3AED',
        rows: [
          { label: 'ผู้นำเข้า',              value: d.importer       ?? '—', highlight: true },
          { label: 'ผู้ผ่านพิธีการ',          value: d.declarant      ?? '—' },
          { label: 'ท่าเรือ/ด่าน',           value: d.port           ?? '—' },
          { label: 'ประเทศต้นกำเนิด',        value: d.countryOrigin  ?? '—' },
        ],
      },
      {
        title: 'ข้อมูลสินค้า',
        color: '#0D8F61',
        rows: [
          { label: 'รายละเอียดสินค้า',       value: d.goodsDesc      ?? '—' },
          { label: 'HS Code',                value: d.hsCode         ?? '—', highlight: true },
          { label: 'ปริมาณ / หน่วย',        value: d.quantity && d.unit ? `${d.quantity} ${d.unit}` : (d.quantity ?? '—') },
          { label: 'ประเภทใบอนุญาต',        value: d.licenseType    ?? '—', highlight: true },
        ],
      },
      {
        title: 'ข้อมูลทะเบียน',
        color: '#B45309',
        rows: [
          { label: 'เลขทะเบียน อย.',        value: d.drugRegNo      ?? '—' },
          { label: 'Lot No.',               value: d.lotNo          ?? '—' },
          { label: 'เลข U',                 value: d.uNo            ?? '—' },
        ],
      },
    ];
  }

  hasValue(v: string): boolean { return v !== '—' && v.trim() !== ''; }
}
