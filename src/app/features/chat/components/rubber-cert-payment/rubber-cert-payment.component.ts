import { ChangeDetectionStrategy, Component, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RubberCertPaymentData } from '@app/core/models/types';
import { ChatService } from '@app/core/services/chat.service';

@Component({
  selector: 'app-rubber-cert-payment',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="rcp-wrap">
      <p class="rcp-title">หนังสือรับรองคุณภาพยาง (e-QC) — ยางผสม</p>
      <p class="rcp-sub">{{ data.agency }} · ต้องขอหนังสือรับรองและชำระค่าธรรมเนียมก่อนส่งออกรายการดังนี้</p>

      <ul class="rcp-items">
        @for (name of data.itemNames; track name) {
          <li>{{ name }}</li>
        }
      </ul>

      <p class="rcp-fee">ค่าธรรมเนียมใบรับรอง <strong>{{ data.amount | number:'1.2-2' }} บาท</strong></p>

      @if (!confirming()) {
        <p class="rcp-account-label">ชำระผ่านบัญชีที่ผูกไว้ (ตัดบัญชีอัตโนมัติ)</p>
        <div class="rcp-accounts">
          @for (acc of data.accounts; track acc.id) {
            <label class="rcp-account" [class.rcp-account--selected]="selectedAccountId() === acc.id">
              <input type="radio" name="rcp-account" [value]="acc.id"
                [checked]="selectedAccountId() === acc.id"
                (change)="selectedAccountId.set(acc.id)" />
              <span class="rcp-account__bank">{{ acc.bankName }}</span>
              <span class="rcp-account__no">{{ acc.accountNoMasked }}</span>
              @if (acc.isDefault) { <span class="rcp-account__default">บัญชีหลัก</span> }
            </label>
          }
        </div>
        <button class="rcp-btn" [disabled]="!selectedAccountId()" (click)="confirming.set(true)">
          ชำระเงิน
        </button>
      } @else {
        <div class="rcp-confirm">
          <p class="rcp-confirm__text">
            ยืนยันชำระ {{ data.amount | number:'1.2-2' }} บาท ผ่านบัญชี {{ selectedAccountLabel() }}?
          </p>
          <div class="rcp-confirm__actions">
            <button class="rcp-confirm__cancel" (click)="confirming.set(false)">ยกเลิก</button>
            <button class="rcp-confirm__ok" (click)="onPay()">ยืนยัน</button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .rcp-wrap {
      display: flex; flex-direction: column; gap: 10px; padding: 4px 0 2px;
    }
    .rcp-title {
      font-size: 14px; font-weight: 700; color: var(--bizx-navy); margin: 0;
    }
    .rcp-sub {
      font-size: 12px; color: #6B7280; margin: 0;
    }
    .rcp-items {
      margin: 0; padding-left: 18px; font-size: 12.5px; color: var(--bizx-navy);
      li { margin: 2px 0; }
    }
    .rcp-fee {
      font-size: 12px; color: #6B7280; margin: 0;
      strong { color: var(--bizx-navy); }
    }
    .rcp-account-label {
      font-size: 11px; font-weight: 600; color: #6B7280; margin: 2px 0 0;
    }
    .rcp-accounts {
      display: flex; flex-direction: column; gap: 6px;
    }
    .rcp-account {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 10px; border-radius: 8px; cursor: pointer;
      border: 1.5px solid #E5E7EB; background: #FAFAFA;
      transition: border-color 0.15s, background 0.15s;
      &:hover { border-color: var(--bizx-blue); }
    }
    .rcp-account--selected {
      border-color: var(--bizx-blue); background: #EFF6FF;
    }
    .rcp-account__bank {
      font-size: 12.5px; font-weight: 600; color: var(--bizx-navy);
    }
    .rcp-account__no {
      font-size: 11.5px; color: #6B7280;
    }
    .rcp-account__default {
      margin-left: auto; font-size: 9.5px; font-weight: 700; color: #0D8F61;
      background: rgba(13,143,97,0.1); padding: 2px 7px; border-radius: 20px;
    }
    .rcp-btn {
      align-self: flex-start; margin-top: 2px;
      padding: 8px 20px; border-radius: 8px; border: none;
      background: var(--bizx-blue); color: #fff;
      font-size: 13px; font-weight: 700; font-family: inherit;
      cursor: pointer; transition: opacity 0.15s;
      &:hover:not(:disabled) { opacity: 0.88; }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }
    .rcp-confirm {
      display: flex; flex-direction: column; gap: 8px;
      padding: 10px 12px; border-radius: 8px;
      background: #FFFBEB; border: 1px solid rgba(180,83,9,0.25);
    }
    .rcp-confirm__text {
      font-size: 12.5px; color: var(--bizx-navy); margin: 0;
    }
    .rcp-confirm__actions {
      display: flex; gap: 8px;
    }
    .rcp-confirm__cancel {
      padding: 6px 14px; border-radius: 8px; border: 1px solid #D1D5DB;
      background: #fff; color: #374151;
      font-size: 12.5px; font-weight: 600; font-family: inherit; cursor: pointer;
    }
    .rcp-confirm__ok {
      padding: 6px 14px; border-radius: 8px; border: none;
      background: var(--bizx-blue); color: #fff;
      font-size: 12.5px; font-weight: 700; font-family: inherit; cursor: pointer;
      &:hover { opacity: 0.88; }
    }
  `],
})
export class RubberCertPaymentComponent {
  @Input() data!: RubberCertPaymentData;

  readonly chat = inject(ChatService);
  readonly confirming = signal(false);
  readonly selectedAccountId = signal<string>('');

  ngOnInit(): void {
    this.selectedAccountId.set(this.data.accounts.find(a => a.isDefault)?.id ?? this.data.accounts[0]?.id ?? '');
  }

  selectedAccountLabel(): string {
    const acc = this.data.accounts.find(a => a.id === this.selectedAccountId());
    return acc ? `${acc.bankName} ${acc.accountNoMasked}` : '';
  }

  onPay(): void {
    this.chat.onRubberCertPaid(this.data, this.selectedAccountId());
    this.confirming.set(false);
  }
}
