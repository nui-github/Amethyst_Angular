import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { LucideAngularModule, AlertTriangle, Clock, CheckCircle2, Search } from 'lucide-angular';
import { Router } from '@angular/router';
import { QueueService, STATUS_META, AGENCY_SHORT } from '@app/core/services/queue.service';
import { ChatService } from '@app/core/services/chat.service';
import { SidebarComponent } from '../../chat/components/sidebar/sidebar.component';
import { ShipmentStatus } from '@app/core/models/types';

export { STATUS_META, AGENCY_SHORT };


type TabValue = 'all' | 'needs_you' | 'await_customer' | 'submitted';

@Component({
  selector: 'app-queue-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, NzInputModule, NzButtonModule, NzTagModule, LucideAngularModule, SidebarComponent],
  templateUrl: './queue-page.component.html',
  styleUrl:    './queue-page.component.scss',
})
export class QueuePageComponent {
  readonly q      = inject(QueueService);
  readonly chat   = inject(ChatService);
  readonly router = inject(Router);

  // Icons
  readonly icWarn   = AlertTriangle;
  readonly icClock  = Clock;
  readonly icCheck  = CheckCircle2;
  readonly icSearch = Search;

  // State
  collapsed   = signal(false);
  searchTerm  = signal('');
  activeTab   = signal<TabValue>('all');

  readonly today = new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });

  readonly tabs = [
    { label: 'ทั้งหมด',          value: 'all'           as TabValue },
    { label: 'ต้องคุณดำเนินการ', value: 'needs_you'     as TabValue },
    { label: 'รอลูกค้า',         value: 'await_customer' as TabValue },
    { label: 'ยื่นแล้ว',         value: 'submitted'     as TabValue },
  ];

  readonly statCards = [
    { key: 'needs_you'      as ShipmentStatus, label: 'รอคุณยืนยัน',    dot: '#F59E0B', iconBg: '#FFFBEB', sub: 'ต้องกำกับและยืนยันร่าง' },
    { key: 'await_customer' as ShipmentStatus, label: 'รอลูกค้า',       dot: '#7C3AED', iconBg: '#F5F3FF', sub: 'ส่งอีเมลแล้ว รอตอบกลับ' },
    { key: 'submitted'      as ShipmentStatus, label: 'ยื่นกรมแล้ว',    dot: '#10B981', iconBg: '#ECFDF5', sub: 'อยู่ระหว่างกรมพิจารณา' },
  ];

  // Derived
  readonly filteredQueue = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const tab  = this.activeTab();
    return this.q.queue().filter(s => {
      const matchTab = tab === 'all' || s.statusKey === tab;
      const matchTerm = !term ||
        s.customsNo.toLowerCase().includes(term) ||
        s.goods.toLowerCase().includes(term) ||
        (s.customer ?? '').toLowerCase().includes(term) ||
        (s.chatName ?? '').toLowerCase().includes(term);
      return matchTab && matchTerm;
    });
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

  agencyShort(key: string): string {
    return (AGENCY_SHORT as Record<string, string>)[key] ?? '—';
  }

  confColor(conf: number): string {
    return conf >= 90 ? '#059669' : conf >= 75 ? '#B45309' : '#EF4444';
  }

  confLabel(conf: number): string {
    return conf >= 90 ? 'สูง' : conf >= 75 ? 'ปานกลาง' : 'ต่ำ — ควรตรวจ';
  }

  toggleSidebar(): void { this.collapsed.update(v => !v); }
  setTabFilter(key: ShipmentStatus): void {
    const tv = key as unknown as TabValue;
    this.activeTab.set(this.activeTab() === tv ? 'all' : tv);
  }

  selectRow(id: string): void {
    const ship = this.q.get(id);
    if (!ship) return;
    this.chat.loadQueueSession(ship);
    this.router.navigate(['/']);
  }
}
