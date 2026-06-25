import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatService } from '@app/core/services/chat.service';

export interface PermitItem {
  refNo: string;         // RG-2568-XXXXX
  invoiceRef: string;    // INV-XXXX or HTHM ref
  agency: string;        // อย. / กษ.
  licenseType: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  licenseNo?: string;    // returned by agency when approved
  requiresPayment: boolean;
  paymentStatus?: 'paid' | 'unpaid';
}

// Mock permit list — in production, fetch from API
const MOCK_PERMITS: PermitItem[] = [
  {
    refNo: 'RG-2568-59008',
    invoiceRef: 'INV-2024-8834',
    agency: 'อย.',
    licenseType: 'RGoods',
    submittedAt: '25/06/2568',
    status: 'approved',
    licenseNo: 'อย.0002/2568-001',
    requiresPayment: false, // อย. ไม่มีค่าธรรมเนียมการขออนุญาต
  },
  {
    refNo: 'RG-2568-68099',
    invoiceRef: 'INV-2024-8834',
    agency: 'กษ.',
    licenseType: 'ใบรับรองสุขอนามัยพืช',
    submittedAt: '25/06/2568',
    status: 'pending',     // ยังไม่ชำระ → ยังไม่อนุมัติ
    requiresPayment: true,
    paymentStatus: 'unpaid',
  },
];

@Component({
  selector: 'app-permit-status',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [CommonModule],
  template: `
    <div class="ps-wrap">
      <div class="ps-header">
        <div class="ps-header__left">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0463EF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <p class="ps-title">สถานะใบอนุญาตที่ยื่นขอ</p>
        </div>
        <button class="ps-refresh-btn" [class.ps-refresh-btn--loading]="refreshing()" (click)="refresh()">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [class.spin]="refreshing()"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
          {{ refreshing() ? 'กำลังอัปเดต...' : 'อัปเดตสถานะ' }}
        </button>
      </div>

      <div class="ps-list">
        @for (item of permits(); track item.refNo) {
          <div class="ps-item" [class.ps-item--approved]="item.status === 'approved'" [class.ps-item--rejected]="item.status === 'rejected'">

            <div class="ps-item__top">
              <span class="ps-agency">{{ item.agency }}</span>
              <span class="ps-ref">{{ item.invoiceRef }}</span>
              <span class="ps-type">{{ item.licenseType }}</span>
              <span class="ps-status-badge"
                [class.ps-status-badge--approved]="item.status === 'approved'"
                [class.ps-status-badge--pending]="item.status === 'pending'"
                [class.ps-status-badge--rejected]="item.status === 'rejected'">
                @if (item.status === 'approved') {
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                  อนุมัติแล้ว
                } @else if (item.status === 'pending') {
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  รออนุมัติ
                } @else {
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                  ไม่อนุมัติ
                }
              </span>
            </div>

            <div class="ps-item__details">
              <span class="ps-detail-row">
                <span class="ps-detail-label">เลขที่ยื่นขอ</span>
                <span class="ps-detail-value">{{ item.refNo }}</span>
              </span>
              <span class="ps-detail-row">
                <span class="ps-detail-label">วันที่ยื่น</span>
                <span class="ps-detail-value">{{ item.submittedAt }}</span>
              </span>
              @if (item.licenseNo) {
                <span class="ps-detail-row ps-detail-row--highlight">
                  <span class="ps-detail-label">เลขใบอนุญาต</span>
                  <span class="ps-detail-value ps-license-no">{{ item.licenseNo }}</span>
                </span>
              }
              @if (item.requiresPayment) {
                <span class="ps-detail-row">
                  <span class="ps-detail-label">ค่าธรรมเนียม</span>
                  <span class="ps-payment-badge"
                    [class.ps-payment-badge--paid]="item.paymentStatus === 'paid'"
                    [class.ps-payment-badge--unpaid]="item.paymentStatus === 'unpaid'">
                    @if (item.paymentStatus === 'paid') {
                      ✓ ชำระแล้ว
                    } @else {
                      ⚠ ยังไม่ชำระ
                    }
                  </span>
                </span>
              }
            </div>

          </div>
        }
      </div>

      <p class="ps-updated">อัปเดตล่าสุด: {{ lastUpdated() }}</p>
    </div>
  `,
  styleUrl: './permit-status.component.scss',
})
export class PermitStatusComponent {
  readonly chat      = inject(ChatService);
  readonly cdr       = inject(ChangeDetectorRef);
  readonly refreshing = signal(false);
  readonly permits    = signal<PermitItem[]>(MOCK_PERMITS);
  readonly lastUpdated = signal(new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }));

  refresh(): void {
    if (this.refreshing()) return;
    this.refreshing.set(true);
    this.cdr.detectChanges();
    setTimeout(() => {
      this.lastUpdated.set(new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }));
      this.refreshing.set(false);
      this.cdr.detectChanges();
    }, 1200);
  }
}
