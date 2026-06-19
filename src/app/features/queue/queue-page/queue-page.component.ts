import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { QueueService, STATUS_META } from '@app/core/services/queue.service';
import { ChatAreaComponent } from '../../chat/components/chat-area/chat-area.component';

/** TODO: implement full QueuePage — see ANGULAR.md */
@Component({
  selector: 'app-queue-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, ChatAreaComponent],
  styles: [`
    .page { display:flex; flex-direction:column; height:100vh; background:#F2F2F2; font-family:'IBM Plex Sans Thai',sans-serif; }
    .header { background:#fff; border-bottom:1px solid #E0E0E0; padding:12px 20px; display:flex; align-items:center; gap:12px; flex-shrink:0; }
    .back-btn { background:none; border:none; color:#0463EF; font-size:13px; cursor:pointer; padding:4px 8px; border-radius:6px; }
    .back-btn:hover { background:#EFF6FF; }
    .title { font-size:15px; font-weight:700; color:#010136; }
    .body { display:flex; flex:1; overflow:hidden; }
    .list { width:320px; flex-shrink:0; background:#fff; border-right:1px solid #E0E0E0; overflow-y:auto; padding:12px; display:flex; flex-direction:column; gap:6px; }
    .row { padding:12px 14px; border:1px solid #E0E0E0; border-radius:10px; cursor:pointer; transition:all .15s; }
    .row:hover { background:#F9FAFB; }
    .row--active { background:#EFF6FF; border-color:#0463EF; border-left:3px solid #0463EF; }
    .row__name { font-size:13px; font-weight:700; color:#010136; margin:0 0 2px; }
    .row__goods { font-size:11px; color:#666; margin:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .row__badge { display:inline-block; font-size:10px; font-weight:700; padding:1px 7px; border-radius:20px; margin-left:6px; }
    .new-badge { background:#EFF6FF; color:#0463EF; }
    .detail { flex:1; overflow:hidden; display:flex; flex-direction:column; }
    .detail-header { background:#fff; border-bottom:1px solid #E0E0E0; padding:12px 16px; flex-shrink:0; }
    .detail-title { font-size:13px; font-weight:700; color:#010136; margin:0 0 2px; }
    .detail-sub { font-size:11px; color:#999; margin:0; }
    .empty { flex:1; display:flex; align-items:center; justify-content:center; color:#999; font-size:13px; }
  `],
  template: `
    <div class="page">
      <div class="header">
        <button class="back-btn" (click)="router.navigate(['/'])">← กลับ</button>
        <span class="title">คิวงานขอใบอนุญาต</span>
        <span style="font-size:12px;color:#999;margin-left:auto">{{ queue.queue().length }} รายการ</span>
      </div>
      <div class="body">
        <div class="list">
          @for (s of queue.queue(); track s.id) {
            <div class="row" [class.row--active]="queue.openId() === s.id"
              (click)="queue.open(s.id)">
              <p class="row__name">
                {{ s.chatName ?? s.customsNo }}
                @if (s.isNew) { <span class="row__badge new-badge">ใหม่</span> }
              </p>
              <p class="row__goods">{{ s.goods }}</p>
              <p class="row__goods" style="margin-top:2px">
                <span class="row__badge"
                  [style.background]="statusMeta(s.statusKey).bg"
                  [style.color]="statusMeta(s.statusKey).text">
                  {{ statusMeta(s.statusKey).label }}
                </span>
              </p>
            </div>
          }
        </div>
        @if (openShipment()) {
          <div class="detail">
            <div class="detail-header">
              <p class="detail-title">{{ openShipment()!.chatName ?? openShipment()!.customsNo }}</p>
              <p class="detail-sub">{{ openShipment()!.goods }} · {{ openShipment()!.customer }}</p>
            </div>
            <app-chat-area [messages]="openShipment()!.messages ?? []" [readOnly]="true" />
          </div>
        } @else {
          <div class="empty">เลือกรายการเพื่อดูประวัติการสนทนา</div>
        }
      </div>
    </div>
  `,
})
export class QueuePageComponent {
  readonly queue  = inject(QueueService);
  readonly router = inject(Router);

  openShipment() {
    const id = this.queue.openId();
    return id ? this.queue.get(id) : null;
  }

  statusMeta(key: string) {
    return STATUS_META[key as keyof typeof STATUS_META] ?? { bg: '#F3F4F6', text: '#666', label: key };
  }
}
