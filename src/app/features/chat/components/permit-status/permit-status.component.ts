import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Printer, Download } from 'lucide-angular';
import { ChatService } from '@app/core/services/chat.service';

export interface PermitItem {
  refNo: string;
  invoiceRef: string;
  agency: string;
  licenseType: string;
  submittedAt: string;
  status: 'not_applied' | 'pending' | 'approved' | 'rejected';
  licenseNo?: string;
}

@Component({
  selector: 'app-permit-status',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [CommonModule, LucideAngularModule],
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
          <div class="ps-item" [class.ps-item--approved]="item.status === 'approved'" [class.ps-item--rejected]="item.status === 'rejected'" [class.ps-item--not-applied]="item.status === 'not_applied'">

            <div class="ps-item__top">
              <span class="ps-agency">{{ item.agency }}</span>
              <span class="ps-ref">{{ item.invoiceRef }}</span>
              <span class="ps-type">{{ item.licenseType }}</span>
              <span class="ps-status-badge"
                [class.ps-status-badge--approved]="item.status === 'approved'"
                [class.ps-status-badge--pending]="item.status === 'pending'"
                [class.ps-status-badge--not-applied]="item.status === 'not_applied'"
                [class.ps-status-badge--rejected]="item.status === 'rejected'">
                @if (item.status === 'approved') {
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                  อนุมัติแล้ว
                } @else if (item.status === 'pending') {
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  รออนุมัติ
                } @else if (item.status === 'not_applied') {
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                  ยังไม่ได้ขอ
                } @else {
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                  ไม่อนุมัติ
                }
              </span>
            </div>

            @if (item.status !== 'not_applied') {
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
              </div>
              @if (item.status === 'approved') {
                <div class="ps-item__actions">
                  <button class="ps-action-btn ps-action-btn--outline" (click)="printLicense(item)">
                    <lucide-icon [img]="Printer" [size]="12" /> พิมพ์ใบอนุญาต
                  </button>
                  <button class="ps-action-btn ps-action-btn--primary" (click)="downloadLicense(item)">
                    <lucide-icon [img]="Download" [size]="12" /> ดาวน์โหลดใบอนุญาต
                  </button>
                </div>
              }
            } @else {
              <div class="ps-item__details ps-item__details--not-applied">
                <span class="ps-detail-value" style="color:#9CA3AF;font-size:11px">ยังไม่ได้ยื่นขอสำหรับกรมนี้</span>
              </div>
            }

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
  readonly refreshing  = signal(false);
  readonly lastUpdated = signal(new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }));
  readonly Printer  = Printer;
  readonly Download = Download;

  printLicense(item: PermitItem): void {
    window.open(`/print?ref=${item.refNo}`, '_blank');
  }

  downloadLicense(item: PermitItem): void {
    const blob = new Blob([`ใบอนุญาต ${item.licenseNo}`], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${item.licenseNo}.pdf`; a.click();
    URL.revokeObjectURL(url);
  }

  private readonly approvedRefs = signal<Set<string>>(new Set());

  readonly permits = computed<PermitItem[]>(() => {
    const all       = this.chat.allPermitAgencies();
    const submitted = this.chat.submittedPermits();
    const approved  = this.approvedRefs();
    if (!all.length) return [];
    return all.map(agency => {
      const sub = submitted.find(s => s.agency === agency);
      if (!sub) return { agency, refNo: '—', invoiceRef: '—', licenseType: '—', submittedAt: '—', status: 'not_applied' } as PermitItem;
      const status = approved.has(sub.refNo) ? 'approved' : 'pending';
      const licenseNo = status === 'approved' ? `LIC-${sub.refNo.replace(/\D/g, '')}` : undefined;
      return { agency, refNo: sub.refNo, invoiceRef: sub.invoiceRef, licenseType: sub.licenseType, submittedAt: sub.submittedAt, status, licenseNo } as PermitItem;
    });
  });

  refresh(): void {
    if (this.refreshing()) return;
    this.refreshing.set(true);
    this.cdr.detectChanges();
    setTimeout(() => {
      const nextPending = this.permits().find(p => p.status === 'pending');
      if (nextPending) {
        this.approvedRefs.update(set => new Set(set).add(nextPending.refNo));
      }
      this.lastUpdated.set(new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }));
      this.refreshing.set(false);
      this.cdr.detectChanges();
    }, 1200);
  }
}
