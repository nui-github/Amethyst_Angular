import { ChangeDetectionStrategy, Component, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ClipboardList, Leaf, PencilLine, Send, CheckCircle2 } from 'lucide-angular';
import { RubberEsfrPreviewData } from '@app/core/models/types';
import { ChatService } from '@app/core/services/chat.service';

@Component({
  selector: 'app-rubber-esfr-preview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="epv-wrap">
      <div class="epv-hd">
        <span class="epv-hd__icon">
          <lucide-icon [img]="ClipboardList" [size]="17" />
        </span>
        <div class="epv-hd__text">
          <p class="epv-title">ตรวจสอบข้อมูลก่อนส่งคำขอ e-SFR</p>
          <span class="epv-badge">{{ data.agency }}</span>
        </div>
      </div>

      <div class="epv-grid">
        <div class="epv-row"><span>Reference Number</span><span>{{ req.referenceNumber }}</span></div>
        <div class="epv-row"><span>Trade License No</span><span>{{ req.tradeLicenseNo }}</span></div>
        <div class="epv-row"><span>Export License No</span><span>{{ req.exportLicenseNo }}</span></div>
        <div class="epv-row"><span>Invoice Number</span><span>{{ req.invoiceNumber }}</span></div>
        <div class="epv-row"><span>Invoice Date</span><span>{{ req.invoiceDate }}</span></div>
        <div class="epv-row"><span>Net Weight</span><span>{{ req.netWeight | number }} KGM</span></div>
        <div class="epv-row"><span>FOB Value Foreign</span><span>{{ req.fobValueForeign | number:'1.2-2' }} {{ req.currencyCode }}</span></div>
        <div class="epv-row"><span>Payment Amount</span><span>฿{{ req.paymentAmount | number:'1.2-2' }}</span></div>
        <div class="epv-row"><span>Total Amount RAOT</span><span>฿{{ req.totalAmountRaot | number:'1.2-2' }}</span></div>
      </div>

      <div class="epv-items">
        <p class="epv-items__title">รายการสินค้า ({{ req.items.length }})</p>
        @for (item of req.items; track item.invoiceItemNo) {
          <div class="epv-item">
            <lucide-icon [img]="Leaf" [size]="12" />
            <span class="epv-item__desc">{{ item.descriptionEn || item.descriptionTh }}</span>
            <span class="epv-item__meta">{{ item.tariffCode }} · {{ item.weight | number }} {{ item.weightUnitCode }}</span>
          </div>
        }
      </div>

      @if (!isDone) {
        <div class="epv-ft">
          <button class="epv-btn epv-btn--outline" (click)="onEdit()" type="button">
            <lucide-icon [img]="PencilLine" [size]="14" />
            แก้ไขข้อมูล
          </button>
          <button class="epv-btn epv-btn--solid" (click)="onSubmit()" type="button">
            ส่งคำขอใบอนุญาต
            <lucide-icon [img]="Send" [size]="14" />
          </button>
        </div>
      } @else {
        <div class="epv-done">
          <lucide-icon [img]="CheckCircle2" [size]="15" />
          ส่งคำขอแล้ว
        </div>
      }
    </div>
  `,
  styles: [`
    .epv-wrap {
      display: flex; flex-direction: column; gap: 12px; padding: 6px 2px 2px;
    }
    .epv-hd {
      display: flex; align-items: flex-start; gap: 10px;
    }
    .epv-hd__icon {
      flex-shrink: 0;
      width: 32px; height: 32px; border-radius: 9px;
      display: flex; align-items: center; justify-content: center;
      background: rgba(4, 99, 239, 0.1); color: var(--bizx-blue);
    }
    .epv-hd__text {
      display: flex; flex-direction: column; gap: 5px; min-width: 0;
    }
    .epv-title {
      font-size: 14px; font-weight: 700; color: var(--bizx-navy); margin: 0; line-height: 1.4;
    }
    .epv-badge {
      align-self: flex-start;
      font-size: 10.5px; font-weight: 700; color: #0D8F61;
      background: rgba(13, 143, 97, 0.1);
      padding: 2px 9px; border-radius: 20px;
    }
    .epv-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 6px 16px;
      background: #FAFAFA; border: 1px solid #EEF0F6; border-radius: 10px;
      padding: 10px 12px;
    }
    .epv-row {
      display: flex; justify-content: space-between; gap: 8px;
      font-size: 12px; line-height: 1.6;

      span:first-child { color: #6B7280; }
      span:last-child { color: var(--bizx-navy); font-weight: 600; text-align: right; }
    }
    .epv-items {
      display: flex; flex-direction: column; gap: 5px;
    }
    .epv-items__title {
      font-size: 12px; font-weight: 700; color: var(--bizx-navy); margin: 0;
    }
    .epv-item {
      display: flex; align-items: center; gap: 7px;
      font-size: 12px; color: var(--bizx-navy);
      background: #FAFAFA; border: 1px solid #EEF0F6; border-radius: 8px;
      padding: 7px 10px;

      lucide-icon { flex-shrink: 0; color: #0D8F61; }
    }
    .epv-item__desc {
      flex: 1; min-width: 0; font-weight: 600;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .epv-item__meta {
      flex-shrink: 0; font-size: 11px; color: #6B7280;
    }
    .epv-ft {
      display: flex; gap: 8px; justify-content: flex-end;
    }
    .epv-btn {
      display: flex; align-items: center; justify-content: center; gap: 6px;
      padding: 8px 18px; border-radius: 8px; border: none;
      font-size: 13px; font-weight: 700; font-family: inherit;
      cursor: pointer; transition: opacity 0.15s, background 0.15s;
    }
    .epv-btn--solid {
      background: var(--bizx-blue); color: #fff;
      &:hover { background: #034DBA; }
    }
    .epv-btn--outline {
      background: #fff; color: var(--bizx-navy);
      border: 1.5px solid #E5E7EB;
      &:hover { border-color: var(--bizx-blue); color: var(--bizx-blue); }
    }
    .epv-done {
      display: flex; align-items: center; gap: 6px;
      font-size: 12.5px; font-weight: 700; color: #0D8F61; margin: 0;
    }
  `],
})
export class RubberEsfrPreviewComponent {
  @Input() msgId = '';
  @Input({ required: true }) data!: RubberEsfrPreviewData;
  @Input() interactive = true;

  readonly chat = inject(ChatService);
  readonly submitted = signal(false);

  readonly ClipboardList = ClipboardList;
  readonly Leaf = Leaf;
  readonly PencilLine = PencilLine;
  readonly Send = Send;
  readonly CheckCircle2 = CheckCircle2;

  // Same reasoning as RubberEsfrGateComponent.isDone — `submitted` covers the instant in-session
  // click, `!interactive` covers this card re-rendering already-sealed (history scroll-back, queue
  // resume, reload) where `submitted` starts false but the footer must stay non-actionable.
  get isDone(): boolean {
    return this.submitted() || !this.interactive;
  }

  get req() {
    return this.data.request;
  }

  onEdit(): void {
    this.chat.openEsfrEditor(this.msgId);
  }

  onSubmit(): void {
    if (this.submitted()) return;
    this.submitted.set(true);
    this.chat.onEsfrPreviewSubmit(this.msgId);
  }
}
