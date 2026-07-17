import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { LucideAngularModule, AlertTriangle, Clock, CheckCircle2, Search, ChevronLeft } from 'lucide-angular';
import { Router } from '@angular/router';
import { QueueService, STATUS_META, AGENCY_SHORT, AGENCY_LABEL } from '@app/core/services/queue.service';
import { ChatService } from '@app/core/services/chat.service';
import { SidebarComponent } from '../../chat/components/sidebar/sidebar.component';
import { PaymentQrComponent } from '../../chat/components/payment-qr/payment-qr.component';
import { ChatMessage, Shipment, ShipmentStatus, ShipmentItem, ITEM_MANUAL_DETAIL_FIELDS } from '@app/core/models/types';
import { getAgencyReturnDocs } from '@mock/agency-return-docs.mock';
import { getAgencyPayment } from '@mock/payment.mock';

export { STATUS_META, AGENCY_SHORT };

type TabValue = 'all' | 'needs_you' | 'submitted';

const STAGE_LABELS = ['','ตรวจรับใบขน','วิเคราะห์ HS','จัดประเภท','แนบเอกสาร','กรอกข้อมูล','ยืนยันร่าง','ยื่นกรม'];

@Component({
  selector: 'app-queue-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, NzInputModule, NzButtonModule, NzTagModule, NzTableModule, NzToolTipModule, NzBadgeModule, LucideAngularModule, SidebarComponent, PaymentQrComponent],
  templateUrl: './queue-page.component.html',
  styleUrl:    './queue-page.component.scss',
})
export class QueuePageComponent {
  readonly q      = inject(QueueService);
  readonly chat   = inject(ChatService);
  readonly router = inject(Router);

  readonly icWarn   = AlertTriangle;
  readonly icClock  = Clock;
  readonly icCheck  = CheckCircle2;
  readonly icSearch = Search;
  readonly icBack   = ChevronLeft;

  collapsed    = signal(false);
  searchTerm   = signal('');
  activeTab    = signal<TabValue>('all');
  permitFilter = signal<'all' | 'IMP' | 'EXP'>('all');
  pageSize  = signal(10);
  pageIndex = signal(1);

  readonly today = new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });

  readonly tabs = [
    { label: 'ทั้งหมด',          value: 'all'       as TabValue },
    { label: 'รอดำเนินการ',      value: 'needs_you' as TabValue },
    { label: 'ยื่นแล้ว',         value: 'submitted' as TabValue },
  ];

  readonly statCards = [
    { key: 'all'       as TabValue, label: 'ทั้งหมด',      dot: '#6366F1', iconBg: '#EEF2FF' },
    { key: 'needs_you' as TabValue, label: 'รอดำเนินการ', dot: '#F59E0B', iconBg: '#FFFBEB' },
    { key: 'submitted' as TabValue, label: 'ยื่นกรมแล้ว',  dot: '#10B981', iconBg: '#ECFDF5' },
  ];

  readonly filteredQueue = computed(() => {
    const term    = this.searchTerm().toLowerCase();
    const tab     = this.activeTab();
    const permit  = this.permitFilter();
    return this.q.queue()
      .filter(s => {
        const matchTab    = tab === 'all' || s.statusKey === tab;
        const matchPermit = permit === 'all' || s.type === permit;
        const matchTerm   = !term ||
          s.customsNo.toLowerCase().includes(term) ||
          s.goods.toLowerCase().includes(term) ||
          (s.customer ?? '').toLowerCase().includes(term);
        return matchTab && matchPermit && matchTerm;
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  });

  readonly openShipment = computed<Shipment | null>(() => {
    const id = this.q.openId();
    return id ? (this.q.get(id) ?? null) : null;
  });

  tabCount(tab: TabValue): number {
    if (tab === 'all') return this.q.queue().length;
    return this.q.queue().filter(s => s.statusKey === tab).length;
  }

  statusMeta(key: string) {
    return STATUS_META[key as ShipmentStatus] ?? { label: key, bg: '#F3F4F6', text: '#6B7280', dot: '#999' };
  }

  agencyShort(key: string): string { return (AGENCY_SHORT as Record<string, string>)[key] ?? '—'; }
  agencyFull(key: string): string  { return (AGENCY_LABEL as Record<string, string>)[key] ?? '—'; }

  /** ทิศทางใบอนุญาต — ขาเข้า/ขาออก, ตาม Shipment.type */
  permitDirectionLabel(type: 'IMP' | 'EXP'): string {
    return type === 'EXP' ? 'ขาออก' : 'ขาเข้า';
  }

  /** Which source document this shipment's LPI request was built from — a customs declaration
   *  (ใบขนสินค้า) if one was uploaded, otherwise the commercial invoice (ใบ Invoice). */
  isCustomsSource(ship: Shipment): boolean {
    return (ship.documents ?? []).some(d => d.category === 'customs');
  }
  sourceDocLabel(ship: Shipment): string {
    return this.isCustomsSource(ship) ? 'ใบขนสินค้า' : 'ใบ Invoice';
  }
  /** The invoice/customs reference number as uploaded, parsed out of the document's display name. */
  sourceDocNumber(ship: Shipment): string {
    const docs = ship.documents ?? [];
    const doc = docs.find(d => d.category === 'customs') ?? docs.find(d => d.category === 'invoice');
    if (!doc) return '—';
    return doc.name.replace(/^(Invoice|ใบขนสินค้าขาเข้า|ใบขนสินค้า)\s*/i, '').trim();
  }

  /** Relative "updated" time, derived from Shipment.createdAt (epoch ms). */
  relativeTime(ts: number): string {
    const diffMs = Date.now() - ts;
    const min = Math.floor(diffMs / 60_000);
    if (min < 1)  return 'เมื่อสักครู่';
    if (min < 60) return `${min} นาทีที่แล้ว`;
    const hr = Math.floor(min / 60);
    if (hr < 24)  return `${hr} ชม.ที่แล้ว`;
    const day = Math.floor(hr / 24);
    if (day < 7)  return `${day} วันที่แล้ว`;
    const wk = Math.floor(day / 7);
    if (wk < 5)   return `${wk} สัปดาห์ที่แล้ว`;
    return new Date(ts).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
  }

  confColor(conf: number): string {
    return conf >= 90 ? '#059669' : conf >= 75 ? '#B45309' : '#EF4444';
  }

  isDone(step: number, stage: number)   { return step < stage; }
  isActive(step: number, stage: number) { return step === stage; }

  /** Agencies whose Pink Form flow charges a fee after ยื่นกรม (see chat.service.ts QR_PAYMENT_AGENCIES) —
   *  their tracker gets an extra step for it. */
  private readonly PAYMENT_STEP_AGENCIES: Shipment['agency'][] = ['ddc'];

  visibleSteps(): { label: string; idx: number }[] {
    const base = STAGE_LABELS.slice(1).map((label, i) => ({ label, idx: i + 1 }));
    const ship = this.openShipment();
    if (ship && this.PAYMENT_STEP_AGENCIES.includes(ship.agency)) {
      base.push({ label: 'ชำระค่าธรรมเนียม', idx: base.length + 1 });
    }
    return base;
  }

  isDone2(stepIdx: number, stage: number) { return stepIdx < stage; }
  isActive2(stepIdx: number, stage: number) { return stepIdx === stage; }

  canProceed(ship: Shipment): boolean {
    return ship.statusKey !== 'submitted';
  }

  /** Still under the department's review — deptApproved hasn't been set yet. Normally only a
   *  brief window (chat's own 3s simulated-review delay) since ChatService.showAgencyApproval()
   *  sets deptApproved automatically; kept as its own check for whenever the user lands on this
   *  page mid-review, or resumes a session that stopped there. */
  isPendingApproval(ship: Shipment): boolean {
    return ship.statusKey === 'submitted'
      && this.PAYMENT_STEP_AGENCIES.includes(ship.agency)
      && !ship.deptApproved
      && !ship.paymentQr
      && !ship.returnedDocuments?.length;
  }

  /** Approved, but the department hasn't sent its QR yet — deptApproved is set, paymentQr isn't.
   *  This is the state most shipments actually sit in on this page, since chat's automatic
   *  approval step runs well before the user usually navigates here. */
  isAwaitingQr(ship: Shipment): boolean {
    return ship.statusKey === 'submitted'
      && this.PAYMENT_STEP_AGENCIES.includes(ship.agency)
      && !!ship.deptApproved
      && !ship.paymentQr
      && !ship.returnedDocuments?.length;
  }

  toggleSidebar(): void { this.collapsed.update(v => !v); }

  setTabFilter(key: TabValue): void {
    if (key === 'all') { this.activeTab.set('all'); return; }
    this.activeTab.set(this.activeTab() === key ? 'all' : key);
  }

  selectRow(id: string): void {
    this.detailItemId.set(null);
    this.itemListOpen.set(false);
    this.q.open(id);
  }

  closeDetail(): void {
    this.detailItemId.set(null);
    this.itemListOpen.set(false);
    this.q.open('');
  }

  openDoc(url: string): void {
    window.open(url, '_blank', 'noopener');
  }

  proceedToChat(ship: Shipment): void {
    this.chat.loadQueueSession(ship);
    this.router.navigate(['/']);
  }

  readonly openSubmissionResult = computed(() => {
    const ship = this.openShipment();
    if (!ship || ship.statusKey !== 'submitted') return null;
    const msgs = ship.messages ?? [];
    const msg = msgs.filter((m: ChatMessage) => m.type === 'status-card').pop();
    if (!msg) return null;
    const d = msg.data as { refNo?: string; submittedAt?: string; feeNote?: string };
    return { refNo: d.refNo ?? '—', submittedAt: d.submittedAt ?? '—', feeNote: d.feeNote };
  });

  // ── Item list + detail modal (read-only) ────────────────────────────────────
  readonly manualFields = ITEM_MANUAL_DETAIL_FIELDS;
  detailItemId = signal<string | null>(null);
  itemListOpen = signal(false);
  itemSearch   = signal('');
  itemPageSize = 20;
  itemPageIndex = signal(1);

  readonly shipmentItems = computed<ShipmentItem[]>(() => this.openShipment()?.items ?? []);

  readonly itemsTotalValue = computed(() =>
    this.shipmentItems().reduce((sum, i) => sum + (i.amount ?? 0), 0));

  readonly filteredItems = computed<ShipmentItem[]>(() => {
    const term = this.itemSearch().trim().toLowerCase();
    if (!term) return this.shipmentItems();
    return this.shipmentItems().filter(i =>
      i.name.toLowerCase().includes(term) || i.hsCode.toLowerCase().includes(term));
  });

  readonly itemPageCount = computed(() => Math.max(1, Math.ceil(this.filteredItems().length / this.itemPageSize)));

  readonly pagedItems = computed<ShipmentItem[]>(() => {
    const start = (this.itemPageIndex() - 1) * this.itemPageSize;
    return this.filteredItems().slice(start, start + this.itemPageSize);
  });

  readonly detailItem = computed<ShipmentItem | undefined>(() => {
    const id = this.detailItemId();
    if (!id) return undefined;
    return this.shipmentItems().find(i => i.id === id);
  });

  openItemList(): void {
    this.itemSearch.set('');
    this.itemPageIndex.set(1);
    this.itemListOpen.set(true);
  }
  closeItemList(): void { this.itemListOpen.set(false); }

  onItemSearch(term: string): void {
    this.itemSearch.set(term);
    this.itemPageIndex.set(1);
  }

  openItemDetail(id: string): void { this.detailItemId.set(id); }
  closeItemDetail(): void { this.detailItemId.set(null); }

  printLicense(ship: Shipment): void {
    window.open(`/print?ref=${ship.hthmRef ?? ship.id}`, '_blank');
  }

  downloadLicense(ship: Shipment): void {
    const result = this.openSubmissionResult();
    const filename = `license-${result?.refNo ?? ship.id}.pdf`;
    const blob = new Blob([`ใบอนุญาต ${result?.refNo}`], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  /** "ชำระเงินแล้ว" on the queue-side QR payment card (ChatService.setAgencyPaymentQr wrote
   *  paymentQr onto this shipment after department approval). Marks paid_pending immediately,
   *  then simulates the department confirming payment + sending back its documents. */
  payQr(ship: Shipment): void {
    const qr = ship.paymentQr;
    if (!qr || qr.status !== 'unpaid') return;
    const payTime = this.nowTime();
    this.q.update(ship.id, {
      paymentQr: { ...qr, status: 'paid_pending' },
      audit: [...ship.audit, { time: payTime, text: `ชำระค่าธรรมเนียม ฿${qr.amount.toLocaleString('th-TH')} ผ่าน QR แล้ว`, by: 'ผู้ใช้งาน' }],
    });

    setTimeout(() => {
      const current = this.q.get(ship.id);
      if (!current?.paymentQr) return;
      const doneTime = this.nowTime();
      this.q.update(ship.id, {
        paymentQr: { ...current.paymentQr, status: 'paid_confirmed' },
        returnedDocuments: getAgencyReturnDocs(current.paymentQr.agency).map((d, i) => ({
          id: `pd_${ship.id}_${i}`, name: d.label, fileType: 'pdf', category: 'other',
          url: d.url, uploadedAt: doneTime,
        })),
        audit: [...current.audit, { time: doneTime, text: `${current.paymentQr.agency}ตรวจสอบการชำระเงินสำเร็จ และส่งเอกสารกลับมาให้แล้ว`, by: current.paymentQr.agency }],
      });
    }, 2500);
  }

  private nowTime(): string {
    return new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  }

  /** "ตรวจสอบสถานะอัปเดต" on the amber รอการตรวจสอบและอนุมัติ card — mocks the department
   *  finishing its review (mirrors ChatService.markDeptApproved(), which normally runs
   *  automatically from chat well before the user reaches this page; this is the queue-page
   *  equivalent for the rare case the user lands here first). Only flags deptApproved — the QR
   *  is a separate, independently-timed event, see mockQrArrival() below. */
  approveDeptReview(ship: Shipment): void {
    const agency = this.agencyFull(ship.agency);
    this.q.update(ship.id, {
      deptApproved: true,
      audit: [...ship.audit, { time: this.nowTime(), text: `${agency}ตรวจสอบและอนุมัติคำขอแล้ว`, by: agency }],
    });
  }

  /** "ตรวจสอบสถานะอัปเดต" on the amber รออนุมัติ QR จากกรม card — mocks the department's QR
   *  actually arriving (the approval itself already happened, see approveDeptReview() /
   *  ChatService.markDeptApproved()). Writes paymentQr so the card swaps to the QR-payment view. */
  mockQrArrival(ship: Shipment): void {
    const agency = this.agencyFull(ship.agency);
    const payConfig = getAgencyPayment(agency);
    this.q.update(ship.id, {
      paymentQr: {
        agency, amount: payConfig.amount,
        refNo: `PAY-${Math.floor(Math.random() * 900000 + 100000)}`,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        status: 'unpaid',
      },
      audit: [...ship.audit, { time: this.nowTime(), text: `${agency}ส่ง QR ให้ท่านชำระค่าธรรมเนียมแล้ว`, by: agency }],
    });
  }
}
