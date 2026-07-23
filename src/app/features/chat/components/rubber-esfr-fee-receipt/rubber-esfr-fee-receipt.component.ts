import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ReceiptText, Download } from 'lucide-angular';
import { RubberEsfrFeeReceiptData } from '@app/core/models/types';

@Component({
  selector: 'app-rubber-esfr-fee-receipt',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="efr-wrap">
      <div class="efr-hd">
        <span class="efr-hd__icon">
          <lucide-icon [img]="ReceiptText" [size]="17" />
        </span>
        <div class="efr-hd__text">
          <p class="efr-title">ได้รับใบรับค่าธรรมเนียม</p>
          <span class="efr-badge">{{ data.agency }}</span>
        </div>
      </div>

      <div class="efr-ref">
        <span>Reference Number</span>
        <span>{{ data.referenceNumber }}</span>
      </div>

      <div class="efr-fee">
        <span>ค่าธรรมเนียม (Cess)</span>
        <span>฿{{ data.feeAmount | number:'1.2-2' }}</span>
      </div>

      <div class="info-card efr-card">
        <div class="info-card__head">ข้อมูลตอบกลับคำขอใบอนุญาต</div>
        <div class="info-card__body">
          <div class="info-card__row"><span>License Number</span><span>{{ data.licenseNumber }}</span></div>
          <div class="info-card__row"><span>Issue Date</span><span>{{ data.issueDate }}</span></div>
          <div class="info-card__row"><span>Issue Authority</span><span>{{ data.issueAuthority }}</span></div>
          <div class="info-card__row efr-row--wrap"><span>Message</span><span>{{ data.message }}</span></div>
          <div class="info-card__row"><span>EffectiveDate</span><span>{{ data.effectiveDate }}</span></div>
          <div class="info-card__row"><span>ExpireDate</span><span>{{ data.expireDate }}</span></div>
        </div>
      </div>

      <div class="efr-ft">
        <button class="efr-dl" (click)="download()" type="button">
          <lucide-icon [img]="Download" [size]="13" />
          ดาวน์โหลดใบรับค่าธรรมเนียม
        </button>
      </div>
    </div>
  `,
  styles: [`
    .efr-wrap {
      display: flex; flex-direction: column; gap: 12px; padding: 6px 2px 2px;
    }
    .efr-hd {
      display: flex; align-items: flex-start; gap: 10px;
    }
    .efr-hd__icon {
      flex-shrink: 0;
      width: 32px; height: 32px; border-radius: 9px;
      display: flex; align-items: center; justify-content: center;
      background: rgba(13, 143, 97, 0.1); color: #0D8F61;
    }
    .efr-hd__text {
      display: flex; flex-direction: column; gap: 5px; min-width: 0;
    }
    .efr-title {
      font-size: 14px; font-weight: 700; color: var(--bizx-navy); margin: 0; line-height: 1.4;
    }
    .efr-badge {
      align-self: flex-start;
      font-size: 10.5px; font-weight: 700; color: #0D8F61;
      background: rgba(13, 143, 97, 0.1);
      padding: 2px 9px; border-radius: 20px;
    }
    .efr-ref {
      display: flex; align-items: center; justify-content: space-between;
      background: #FAFAFA; border: 1px solid #EEF0F6; border-radius: 10px;
      padding: 9px 12px;
      font-size: 12.5px;

      span:first-child { color: #6B7280; font-weight: 600; }
      span:last-child { color: var(--bizx-navy); font-weight: 700; }
    }
    .efr-fee {
      display: flex; align-items: center; justify-content: space-between;
      background: rgba(249, 115, 22, 0.07); border: 1px solid rgba(249, 115, 22, 0.2);
      border-radius: 10px;
      padding: 9px 12px;
      font-size: 12.5px;

      span:first-child { color: #C2410C; font-weight: 600; }
      span:last-child { color: #C2410C; font-weight: 700; }
    }
    .efr-card {
      margin-top: 0;
    }
    .efr-row--wrap {
      flex-direction: column; align-items: flex-start; gap: 3px;

      span:last-child { text-align: left; font-weight: 500; color: var(--bizx-navy); }
    }
    .efr-ft {
      display: flex; justify-content: flex-end;
    }
    .efr-dl {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 16px; border-radius: 8px;
      border: 1.5px solid var(--bizx-blue); background: #fff;
      font-size: 12px; font-weight: 700; color: var(--bizx-blue); font-family: inherit;
      cursor: pointer; transition: background 0.15s;

      &:hover { background: rgba(4, 99, 239, 0.06); }
    }
  `],
})
export class RubberEsfrFeeReceiptComponent {
  @Input({ required: true }) data!: RubberEsfrFeeReceiptData;
  @Input() interactive = true;

  readonly ReceiptText = ReceiptText;
  readonly Download = Download;

  download(): void {
    if (this.data.receiptUrl) window.open(this.data.receiptUrl, '_blank', 'noopener');
  }
}
