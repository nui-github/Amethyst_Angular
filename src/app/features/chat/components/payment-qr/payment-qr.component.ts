import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentQrData } from '@app/core/models/types';
import { ChatService } from '@app/core/services/chat.service';

@Component({
  selector: 'app-payment-qr',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="pqr-wrap">
      <p class="pqr-title">ชำระค่าธรรมเนียมใบอนุญาต</p>
      <p class="pqr-sub">{{ data.agency }} · ค่าธรรมเนียม <strong>{{ data.amount | number:'1.2-2' }} บาท</strong></p>

      <div class="pqr-qr-box">
        <!-- Simulated PromptPay QR -->
        <svg class="pqr-qr" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="120" height="120" fill="white" rx="8"/>
          <!-- finder patterns -->
          <rect x="8" y="8" width="30" height="30" rx="3" fill="#010136"/>
          <rect x="11" y="11" width="24" height="24" rx="2" fill="white"/>
          <rect x="14" y="14" width="18" height="18" rx="1" fill="#010136"/>
          <rect x="82" y="8" width="30" height="30" rx="3" fill="#010136"/>
          <rect x="85" y="11" width="24" height="24" rx="2" fill="white"/>
          <rect x="88" y="14" width="18" height="18" rx="1" fill="#010136"/>
          <rect x="8" y="82" width="30" height="30" rx="3" fill="#010136"/>
          <rect x="11" y="85" width="24" height="24" rx="2" fill="white"/>
          <rect x="14" y="88" width="18" height="18" rx="1" fill="#010136"/>
          <!-- data dots pattern -->
          <rect x="46" y="8" width="6" height="6" fill="#010136"/>
          <rect x="54" y="8" width="4" height="4" fill="#010136"/>
          <rect x="62" y="8" width="6" height="6" fill="#010136"/>
          <rect x="70" y="8" width="4" height="4" fill="#010136"/>
          <rect x="46" y="16" width="4" height="4" fill="#010136"/>
          <rect x="58" y="16" width="6" height="6" fill="#010136"/>
          <rect x="68" y="14" width="4" height="8" fill="#010136"/>
          <rect x="46" y="24" width="6" height="4" fill="#010136"/>
          <rect x="54" y="22" width="4" height="6" fill="#010136"/>
          <rect x="62" y="24" width="4" height="4" fill="#010136"/>
          <rect x="46" y="46" width="28" height="4" fill="#010136"/>
          <rect x="78" y="46" width="4" height="4" fill="#010136"/>
          <rect x="84" y="46" width="6" height="4" fill="#010136"/>
          <rect x="92" y="46" width="4" height="6" fill="#010136"/>
          <rect x="100" y="46" width="12" height="4" fill="#010136"/>
          <rect x="46" y="52" width="4" height="6" fill="#010136"/>
          <rect x="54" y="54" width="6" height="4" fill="#010136"/>
          <rect x="78" y="54" width="8" height="4" fill="#010136"/>
          <rect x="90" y="52" width="4" height="8" fill="#010136"/>
          <rect x="100" y="54" width="6" height="4" fill="#010136"/>
          <rect x="46" y="62" width="10" height="4" fill="#010136"/>
          <rect x="60" y="60" width="4" height="8" fill="#010136"/>
          <rect x="68" y="62" width="6" height="4" fill="#010136"/>
          <rect x="78" y="62" width="4" height="4" fill="#010136"/>
          <rect x="86" y="60" width="6" height="8" fill="#010136"/>
          <rect x="96" y="62" width="16" height="4" fill="#010136"/>
          <rect x="46" y="70" width="6" height="4" fill="#010136"/>
          <rect x="56" y="70" width="4" height="4" fill="#010136"/>
          <rect x="64" y="68" width="4" height="8" fill="#010136"/>
          <rect x="72" y="70" width="8" height="4" fill="#010136"/>
          <rect x="84" y="70" width="4" height="4" fill="#010136"/>
          <rect x="92" y="68" width="4" height="8" fill="#010136"/>
          <rect x="100" y="70" width="12" height="4" fill="#010136"/>
          <rect x="46" y="78" width="16" height="4" fill="#010136"/>
          <rect x="66" y="76" width="6" height="8" fill="#010136"/>
          <rect x="76" y="78" width="4" height="4" fill="#010136"/>
          <rect x="84" y="76" width="8" height="8" fill="#010136"/>
          <rect x="96" y="78" width="4" height="4" fill="#010136"/>
          <rect x="46" y="86" width="4" height="8" fill="#010136"/>
          <rect x="54" y="86" width="8" height="4" fill="#010136"/>
          <rect x="66" y="86" width="4" height="8" fill="#010136"/>
          <rect x="76" y="86" width="10" height="4" fill="#010136"/>
          <rect x="54" y="92" width="6" height="6" fill="#010136"/>
          <rect x="64" y="92" width="4" height="6" fill="#010136"/>
          <rect x="72" y="92" width="4" height="6" fill="#010136"/>
          <rect x="80" y="92" width="8" height="6" fill="#010136"/>
          <rect x="96" y="90" width="4" height="8" fill="#010136"/>
          <rect x="104" y="86" width="8" height="8" fill="#010136"/>
          <!-- PromptPay logo area -->
          <rect x="50" y="28" width="20" height="16" rx="3" fill="#010136"/>
          <text x="60" y="39" text-anchor="middle" fill="white" font-size="7" font-family="Arial" font-weight="bold">PAY</text>
        </svg>
        <p class="pqr-ref">Ref: {{ data.refNo }}</p>
      </div>

      <p class="pqr-expire">QR หมดอายุ: {{ data.expiresAt }}</p>

      <button class="pqr-btn" (click)="onPaid()">
        ชำระเงินแล้ว
      </button>
    </div>
  `,
  styles: [`
    .pqr-wrap {
      display: flex; flex-direction: column; align-items: center; gap: 10px;
      padding: 4px 0 2px;
    }
    .pqr-title {
      font-size: 14px; font-weight: 700; color: var(--bizx-navy); margin: 0;
    }
    .pqr-sub {
      font-size: 12px; color: #6B7280; margin: 0;
      strong { color: var(--bizx-navy); }
    }
    .pqr-qr-box {
      display: flex; flex-direction: column; align-items: center; gap: 6px;
      padding: 12px; border-radius: 12px;
      border: 1.5px solid #E8E8E8; background: #FAFAFA;
    }
    .pqr-qr { width: 140px; height: 140px; display: block; }
    .pqr-ref {
      font-size: 10px; color: #9CA3AF; margin: 0; letter-spacing: 0.5px;
    }
    .pqr-expire {
      font-size: 11px; color: #EF4444; margin: 0;
    }
    .pqr-btn {
      margin-top: 2px;
      padding: 8px 20px; border-radius: 8px; border: none;
      background: var(--bizx-blue); color: #fff;
      font-size: 13px; font-weight: 700; font-family: inherit;
      cursor: pointer; transition: opacity 0.15s;
      &:hover { opacity: 0.88; }
    }
  `],
})
export class PaymentQrComponent {
  @Input() data!: PaymentQrData;
  readonly chat = inject(ChatService);

  onPaid(): void {
    this.chat.onQrPaid(this.data);
  }
}
