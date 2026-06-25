import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { LucideAngularModule, AlertTriangle, Mail, Clock, CheckCircle2, Ban, Search, ChevronLeft } from 'lucide-angular';
import { QueueService, STATUS_META, AGENCY_SHORT } from '@app/core/services/queue.service';
import { ChatAreaComponent } from '../../chat/components/chat-area/chat-area.component';
import { Shipment, ShipmentStatus, ChatMessage } from '@app/core/models/types';
import { generateId, getTime } from '@app/shared/utils/helpers';

export { STATUS_META, AGENCY_SHORT };

const STAGE_LABELS = ['','ตรวจรับใบขน','วิเคราะห์ HS','จัดประเภท','ร่างใบอนุญาต','ตรวจ flag','ยืนยันร่าง','แจ้งลูกค้า','ยื่นกรม'];

type TabValue = 'all' | 'needs_you' | 'await_customer' | 'submitted';

@Component({
  selector: 'app-queue-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, NzInputModule, NzButtonModule, NzTagModule, LucideAngularModule, ChatAreaComponent],
  templateUrl: './queue-page.component.html',
  styleUrl:    './queue-page.component.scss',
})
export class QueuePageComponent {
  readonly q = inject(QueueService);

  // Icons
  readonly icWarn  = AlertTriangle;
  readonly icMail  = Mail;
  readonly icClock = Clock;
  readonly icCheck = CheckCircle2;
  readonly icBan   = Ban;
  readonly icSearch = Search;
  readonly icBack  = ChevronLeft;

  // State
  searchTerm   = signal('');
  statusFilter = signal<ShipmentStatus | 'all'>('all');
  activeTab    = signal<TabValue>('all');
  stageLabels  = STAGE_LABELS;

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

  agencyShort(key: string): string {
    return (AGENCY_SHORT as Record<string, string>)[key] ?? '—';
  }

  confColor(conf: number): string {
    return conf >= 90 ? '#059669' : conf >= 75 ? '#B45309' : '#EF4444';
  }

  confLabel(conf: number): string {
    return conf >= 90 ? 'สูง' : conf >= 75 ? 'ปานกลาง' : 'ต่ำ — ควรตรวจ';
  }

  isDone(step: number, stage: number)   { return step < stage; }
  isActive(step: number, stage: number) { return step === stage; }

  selectRow(id: string): void { this.q.open(id); }
  closeDetail(): void         { this.q.open(''); }

  confirm(): void {
    const ship = this.openShipment();
    if (!ship) return;
    const bot: ChatMessage = { id: generateId(), role: 'bot', type: 'text',
      content: `ยืนยันแล้ว ✓ ร่างอีเมลถึง ${ship.email.toName} พร้อมส่ง`, time: getTime() };
    this.q.update(ship.id, { messages: [...(ship.messages ?? []), bot], statusKey: 'email_outbox', stage: 6 });
  }

  sendEmail(): void {
    const ship = this.openShipment();
    if (!ship) return;
    const bot: ChatMessage = { id: generateId(), role: 'bot', type: 'text',
      content: `ส่งอีเมลถึง ${ship.email.toName} (${ship.email.to}) เรียบร้อยแล้ว — รอลูกค้ายืนยัน`, time: getTime() };
    this.q.update(ship.id, { messages: [...(ship.messages ?? []), bot], statusKey: 'await_customer', stage: 7 });
  }

  customerConfirmed(): void {
    const ship = this.openShipment();
    if (!ship) return;
    const bot: ChatMessage = { id: generateId(), role: 'bot', type: 'text',
      content: 'ลูกค้ายืนยันเอกสารแล้ว ✓ — กดยื่นกรมเมื่อพร้อม', time: getTime() };
    this.q.update(ship.id, { messages: [...(ship.messages ?? []), bot] });
  }

  submit(): void {
    const ship = this.openShipment();
    if (!ship) return;
    const bot: ChatMessage = { id: generateId(), role: 'bot', type: 'text',
      content: `ยื่นเอกสารถึงกรมเรียบร้อยแล้ว ✓\n\nแบบฟอร์ม: ${ship.formCode} — ${ship.customsNo}`, time: getTime() };
    this.q.update(ship.id, { messages: [...(ship.messages ?? []), bot], statusKey: 'submitted', stage: 8 });
  }
}
