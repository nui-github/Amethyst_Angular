import { ChangeDetectionStrategy, Component, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentSlipData } from '@app/core/models/types';
import { ChatService } from '@app/core/services/chat.service';

@Component({
  selector: 'app-payment-slip',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="pslip-wrap">
      <p class="pslip-title">อัปโหลด Slip การชำระเงิน</p>
      <p class="pslip-sub">กรม{{ data.agency }} · {{ data.amount | number:'1.2-2' }} บาท · {{ data.refNo }}</p>

      @if (!uploaded()) {
        <label class="pslip-drop" [class.pslip-drop--active]="hovering()"
          (dragover)="$event.preventDefault(); hovering.set(true)"
          (dragleave)="hovering.set(false)"
          (drop)="onDrop($event)">
          <input type="file" accept="image/*,.pdf" (change)="onFile($event)" hidden />
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
            stroke-linecap="round" stroke-linejoin="round" style="color:#9CA3AF">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <p class="pslip-drop-label">คลิกหรือลากไฟล์ Slip มาวางที่นี่</p>
          <p class="pslip-drop-hint">รองรับ JPG, PNG, PDF</p>
        </label>
      } @else {
        <div class="pslip-preview">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0D8F61" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <path d="m9 11 3 3L22 4"/>
          </svg>
          <span class="pslip-filename">{{ fileName() }}</span>
        </div>
        <button class="pslip-btn" (click)="onConfirm()">ยืนยันการชำระเงิน</button>
      }
    </div>
  `,
  styles: [`
    .pslip-wrap {
      display: flex; flex-direction: column; gap: 10px; padding: 4px 0 2px;
    }
    .pslip-title {
      font-size: 14px; font-weight: 700; color: var(--bizx-navy); margin: 0;
    }
    .pslip-sub {
      font-size: 11px; color: #6B7280; margin: 0;
    }
    .pslip-drop {
      display: flex; flex-direction: column; align-items: center; gap: 6px;
      padding: 24px 16px; border-radius: 10px; cursor: pointer;
      border: 2px dashed #D1D5DB; background: #F9FAFB;
      transition: border-color 0.15s, background 0.15s;
      &:hover, &.pslip-drop--active { border-color: var(--bizx-blue); background: #EFF6FF; }
    }
    .pslip-drop-label {
      font-size: 12px; font-weight: 600; color: #374151; margin: 0;
    }
    .pslip-drop-hint {
      font-size: 10px; color: #9CA3AF; margin: 0;
    }
    .pslip-preview {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 12px; border-radius: 8px;
      background: rgba(13,143,97,0.07); border: 1px solid rgba(13,143,97,0.25);
    }
    .pslip-filename {
      font-size: 12px; font-weight: 600; color: #0D8F61;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .pslip-btn {
      padding: 8px 20px; border-radius: 8px; border: none;
      background: var(--bizx-blue); color: #fff;
      font-size: 13px; font-weight: 700; font-family: inherit;
      cursor: pointer; transition: opacity 0.15s; align-self: flex-start;
      &:hover { opacity: 0.88; }
    }
  `],
})
export class PaymentSlipComponent {
  @Input() data!: PaymentSlipData;

  readonly chat     = inject(ChatService);
  readonly uploaded = signal(false);
  readonly fileName = signal('');
  readonly hovering = signal(false);

  onFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) { this.fileName.set(file.name); this.uploaded.set(true); }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.hovering.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) { this.fileName.set(file.name); this.uploaded.set(true); }
  }

  onConfirm(): void {
    this.chat.onSlipUploaded(this.data);
  }
}
