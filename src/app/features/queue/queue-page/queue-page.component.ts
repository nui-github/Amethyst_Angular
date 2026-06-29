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
import { ChatMessage, Shipment, ShipmentStatus } from '@app/core/models/types';

export { STATUS_META, AGENCY_SHORT };

type TabValue = 'all' | 'needs_you' | 'no_permit' | 'submitted';

const STAGE_LABELS = ['','ตรวจรับใบขน','วิเคราะห์ HS','จัดประเภท','แนบเอกสาร','ตรวจ flag','ยืนยันร่าง','ยื่นกรม'];

@Component({
  selector: 'app-queue-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, NzInputModule, NzButtonModule, NzTagModule, NzTableModule, NzToolTipModule, NzBadgeModule, LucideAngularModule, SidebarComponent],
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

  collapsed   = signal(false);
  searchTerm  = signal('');
  activeTab   = signal<TabValue>('all');
  pageSize  = signal(10);
  pageIndex = signal(1);

  readonly today = new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });

  readonly tabs = [
    { label: 'ทั้งหมด',          value: 'all'       as TabValue },
    { label: 'รอดำเนินการ',      value: 'needs_you' as TabValue },
    { label: 'ไม่ต้องขอ',        value: 'no_permit' as TabValue },
    { label: 'ยื่นแล้ว',         value: 'submitted' as TabValue },
  ];

  readonly statCards = [
    { key: 'needs_you' as ShipmentStatus, label: 'รอดำเนินการ',       dot: '#F59E0B', iconBg: '#FFFBEB' },
    { key: 'no_permit' as ShipmentStatus, label: 'ไม่ต้องขอใบอนุญาต', dot: '#9CA3AF', iconBg: '#F3F4F6' },
    { key: 'submitted' as ShipmentStatus, label: 'ยื่นกรมแล้ว',       dot: '#10B981', iconBg: '#ECFDF5' },
  ];

  readonly filteredQueue = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const tab  = this.activeTab();
    return this.q.queue().filter(s => {
      const matchTab  = tab === 'all' || s.statusKey === tab;
      const matchTerm = !term ||
        s.customsNo.toLowerCase().includes(term) ||
        s.goods.toLowerCase().includes(term) ||
        (s.customer ?? '').toLowerCase().includes(term);
      return matchTab && matchTerm;
    });
  });

  readonly openShipment = computed<Shipment | null>(() => {
    const id = this.q.openId();
    return id ? (this.q.get(id) ?? null) : null;
  });

  tabCount(tab: TabValue): number {
    if (tab === 'all') return this.q.queue().length;
    return this.q.queue().filter(s => s.statusKey === tab).length;
  }

  countByStatus(key: ShipmentStatus): number {
    return this.q.queue().filter(s => s.statusKey === key).length;
  }

  statusMeta(key: string) {
    return STATUS_META[key as ShipmentStatus] ?? { label: key, bg: '#F3F4F6', text: '#6B7280', dot: '#999' };
  }

  agencyShort(key: string): string { return (AGENCY_SHORT as Record<string, string>)[key] ?? '—'; }
  agencyFull(key: string): string  { return (AGENCY_LABEL as Record<string, string>)[key] ?? '—'; }

  confColor(conf: number): string {
    return conf >= 90 ? '#059669' : conf >= 75 ? '#B45309' : '#EF4444';
  }
  confLabel(conf: number): string {
    return conf >= 90 ? 'สูง' : conf >= 75 ? 'ปานกลาง' : 'ต่ำ — ควรตรวจ';
  }

  isDone(step: number, stage: number)   { return step < stage; }
  isActive(step: number, stage: number) { return step === stage; }

  visibleSteps(): { label: string; idx: number }[] {
    return STAGE_LABELS.slice(1).map((label, i) => ({ label, idx: i + 1 }));
  }

  isDone2(stepIdx: number, stage: number) { return stepIdx < stage; }
  isActive2(stepIdx: number, stage: number) { return stepIdx === stage; }

  unresolvedFlags(ship: Shipment) { return ship.flags.filter(f => !f.resolved); }
  resolvedFlags(ship: Shipment)   { return ship.flags.filter(f => f.resolved); }

  canProceed(ship: Shipment): boolean {
    return ship.statusKey !== 'submitted' && ship.statusKey !== 'no_permit';
  }

  toggleSidebar(): void { this.collapsed.update(v => !v); }

  setTabFilter(key: ShipmentStatus): void {
    const tv = key as unknown as TabValue;
    this.activeTab.set(this.activeTab() === tv ? 'all' : tv);
  }

  selectRow(id: string): void {
    this.q.open(id);
  }

  closeDetail(): void {
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
}
