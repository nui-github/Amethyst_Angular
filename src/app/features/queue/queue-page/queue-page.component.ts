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
import { Shipment, ShipmentStatus } from '@app/core/models/types';

export { STATUS_META, AGENCY_SHORT };

type TabValue = 'all' | 'needs_you' | 'await_customer' | 'submitted';

const STAGE_LABELS = ['','ตรวจรับใบขน','วิเคราะห์ HS','จัดประเภท','ร่างใบอนุญาต','ตรวจ flag','ยืนยันร่าง','แจ้งลูกค้า','ยื่นกรม'];

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
    { label: 'ทั้งหมด',          value: 'all'            as TabValue },
    { label: 'ต้องคุณดำเนินการ', value: 'needs_you'      as TabValue },
    { label: 'รอลูกค้า',         value: 'await_customer' as TabValue },
    { label: 'ยื่นแล้ว',         value: 'submitted'      as TabValue },
  ];

  readonly statCards = [
    { key: 'needs_you'      as ShipmentStatus, label: 'รอคุณยืนยัน',  dot: '#F59E0B', iconBg: '#FFFBEB' },
    { key: 'await_customer' as ShipmentStatus, label: 'รอลูกค้า',     dot: '#7C3AED', iconBg: '#F5F3FF' },
    { key: 'submitted'      as ShipmentStatus, label: 'ยื่นกรมแล้ว',  dot: '#10B981', iconBg: '#ECFDF5' },
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

  visibleSteps(ship: Shipment): { label: string; idx: number }[] {
    const hasEmail = !!(ship.email?.to);
    return STAGE_LABELS.slice(1).reduce<{ label: string; idx: number }[]>((acc, label, i) => {
      const n = i + 1;
      if (n === 7 && !hasEmail) return acc;
      acc.push({ label, idx: n });
      return acc;
    }, []);
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

  proceedToChat(ship: Shipment): void {
    this.chat.loadQueueSession(ship);
    this.router.navigate(['/']);
  }
}
