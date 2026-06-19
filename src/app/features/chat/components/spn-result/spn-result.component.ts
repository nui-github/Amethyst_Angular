import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpnResultData } from '@app/core/models/types';

@Component({
  selector: 'app-spn-result',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="info-card">
      <div class="info-card__head">ข้อมูลใบขน #{{ data['ref'] }}</div>
      <div class="info-card__body">
        @for (row of rows; track row.label) {
          <div class="info-card__row">
            <span>{{ row.label }}</span>
            <span [style.color]="row.accent ? 'var(--bizx-blue)' : 'var(--bizx-navy)'">{{ row.value }}</span>
          </div>
        }
      </div>
    </div>
  `,
})
export class SpnResultComponent {
  @Input({ required: true }) data!: Record<string, unknown>;

  get rows() {
    return [
      { label: 'ผู้นำเข้า',      value: this.data['importer'],        accent: true },
      { label: 'ท่าเรือ',         value: this.data['port'],            accent: false },
      { label: 'วันที่ยื่น',      value: this.data['declarationDate'], accent: false },
      { label: 'HS Code',         value: this.data['hsCode'],          accent: false },
      { label: 'ประเทศต้นทาง',   value: this.data['countryOrigin'],   accent: false },
      { label: 'ประเภทใบอนุญาต', value: this.data['licenseType'],     accent: true },
    ];
  }
}
