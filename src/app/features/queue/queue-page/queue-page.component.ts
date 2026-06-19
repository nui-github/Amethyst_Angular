import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { LucideAngularModule, AlertTriangle, Mail, Clock, CheckCircle2, Ban, Search, RotateCcw, Send, ChevronLeft } from 'lucide-angular';
import { QueueService, STATUS_META, AGENCY_SHORT } from '@app/core/services/queue.service';
import { ChatAreaComponent } from '../../chat/components/chat-area/chat-area.component';
import { Shipment, ShipmentStatus, ChatMessage } from '@app/core/models/types';
import { generateId, getTime } from '@app/shared/utils/helpers';

export { STATUS_META, AGENCY_SHORT };

const STAGE_LABELS = ['','ตรวจรับใบขน','วิเคราะห์ HS','จัดประเภท','ร่างใบอนุญาต','ตรวจ flag','ยืนยันร่าง','แจ้งลูกค้า','ยื่นกรม'];

@Component({
  selector: 'app-queue-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, NzInputModule, NzButtonModule, NzTagModule, LucideAngularModule, ChatAreaComponent],
  templateUrl: './queue-page.component.html',
  styleUrl:    './queue-page.component.scss',
})
export class QueuePageComponent {
  readonly q      = inject(QueueService);
  readonly router = inject(Router);

  // Icons
  readonly icWarn    = AlertTriangle;
  readonly icMail    = Mail;
  readonly icClock   = Clock;
  readonly icCheck   = CheckCircle2;
  readonly icBan     = Ban;
  readonly icSearch  = Search;
  readonly icBack    = ChevronLeft;
  readonly icReset   = RotateCcw;
  readonly icSend    = Send;

  // State
  searchTerm   = signal('');
  statusFilter = signal<ShipmentStatus | 'all'>('all');
  stageLabels  = STAGE_LABELS;

  // Derived
  readonly filteredQueue = computed(() => {
    const term   = this.searchTerm().toLowerCase();
    const filter = this.statusFilter();
    return this.q.queue().filter(s => {
      const matchStatus = filter === 'all' || s.statusKey === filter;
      const matchTerm   = !term ||
        (s.chatName ?? s.customsNo).toLowerCase().includes(term) ||
        s.goods.toLowerCase().includes(term) ||
        (s.hthmRef ?? '').toLowerCase().includes(term);
      return matchStatus && matchTerm;
    });
  });

  readonly openShipment = computed<Shipment | null>(() => {
    const id = this.q.openId();
    return id ? (this.q.get(id) ?? null) : null;
  });

  // Stat counts
  countByStatus(key: ShipmentStatus): number {
    return this.q.queue().filter(s => s.statusKey === key).length;
  }

  statusMeta(key: string) {
    return STATUS_META[key as ShipmentStatus] ?? { label: key, bg: '#F3F4F6', text: '#6B7280', dot: '#999' };
  }

  agencyShort(key: string): string {
    return (AGENCY_SHORT as Record<string, string>)[key] ?? '—';
  }

  isDone(step: number, stage: number)   { return step < stage; }
  isActive(step: number, stage: number) { return step === stage; }

  // Actions
  selectRow(id: string): void { this.q.open(id); }

  pushMsg(text: string, patch?: Partial<Shipment>): void {
    const ship = this.openShipment();
    if (!ship) return;
    const msg: ChatMessage = { id: generateId(), role: 'user', type: 'text', content: text, time: getTime() };
    const botMsg: ChatMessage = { id: generateId(), role: 'bot', type: 'text', content: '', time: getTime() };
    const updated = [...(ship.messages ?? []), msg, botMsg];
    this.q.update(ship.id, { messages: updated, ...patch });
  }

  confirm(): void {
    const ship = this.openShipment();
    if (!ship) return;
    const bot: ChatMessage = { id: generateId(), role: 'bot', type: 'text',
      content: `ยืนยันแล้ว ✓ ร่างอีเมลถึง ${ship.email.toName} พร้อมส่ง`, time: getTime() };
    const updated = [...(ship.messages ?? []), bot];
    this.q.update(ship.id, { messages: updated, statusKey: 'email_outbox', stage: 6 });
  }

  sendEmail(): void {
    const ship = this.openShipment();
    if (!ship) return;
    const bot: ChatMessage = { id: generateId(), role: 'bot', type: 'text',
      content: `ส่งอีเมลถึง ${ship.email.toName} (${ship.email.to}) เรียบร้อยแล้ว — รอลูกค้ายืนยัน`, time: getTime() };
    const updated = [...(ship.messages ?? []), bot];
    this.q.update(ship.id, { messages: updated, statusKey: 'await_customer', stage: 7 });
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

  readonly statCards = [
    { key: "needs_you"      as ShipmentStatus, label: "รอคุณยืนยัน",       dot: "#F59E0B" },
    { key: "email_outbox"   as ShipmentStatus, label: "ร่างอีเมลรอส่ง",    dot: "#3B82F6" },
    { key: "await_customer" as ShipmentStatus, label: "รอลูกค้ายืนยัน",    dot: "#7C3AED" },
    { key: "submitted"      as ShipmentStatus, label: "ยื่นแล้ว",            dot: "#10B981" },
  ];

  back(): void { this.router.navigate(['/']); }
}

// Stat card config appended here — also add to class body above
