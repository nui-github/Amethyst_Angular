import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, CheckCircle, Search, Plus, Printer } from 'lucide-angular';
import { StatusCardData } from '@app/core/models/types';
import { ChatService } from '@app/core/services/chat.service';

@Component({
  selector: 'app-status-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="status-card">
      <p class="status-card__title">
        <lucide-icon [img]="CheckCircle" [size]="16" color="#0D8F61" />
        ส่งข้อมูลสำเร็จแล้วครับ!
      </p>
      <div class="info-card" style="margin-top:0;border-color:rgba(22,234,158,0.3)">
        <div class="info-card__head" style="background:rgba(22,234,158,0.08);color:#0D8F61;border-color:rgba(22,234,158,0.3)">
          ผลการส่งข้อมูลเข้ากรม
        </div>
        <div class="info-card__body">
          <div class="info-card__row">
            <span>เลขอ้างอิง</span>
            <span style="font-weight:700;color:var(--bizx-blue)">{{ d.customsRef }}</span>
          </div>
          <div class="info-card__row">
            <span>เลขใบอนุญาต (ชั่วคราว)</span>
            <span style="font-weight:700;color:var(--bizx-blue)">{{ d.refNo }}</span>
          </div>
          <div class="info-card__row">
            <span>วันที่ส่ง</span>
            <span style="font-weight:600;color:var(--bizx-navy)">{{ d.submittedAt }}</span>
          </div>
          <div class="info-card__row">
            <span>สถานะ</span>
            <span class="badge-blue">
              <lucide-icon [img]="Search" [size]="11" /> รอการอนุมัติ
            </span>
          </div>
          <div class="info-card__row" style="border:none">
            <span>คาดว่าอนุมัติ</span>
            <span style="font-weight:600;color:var(--bizx-navy)">3-5 วันทำการ</span>
          </div>
        </div>
      </div>
      <p class="status-card__sub">ต้องการดำเนินการอื่นเพิ่มเติมไหมครับ?</p>
      <div class="status-card__chips">
        <button class="quick-chip" (click)="chat.send('ตรวจสอบสถานะใบอนุญาต')">
          <lucide-icon [img]="Search" [size]="12" /> ตรวจสอบสถานะ
        </button>

        <button class="quick-chip" (click)="chat.send('พิมพ์ใบอนุญาต')">
          <lucide-icon [img]="Printer" [size]="12" /> พิมพ์ใบอนุญาต
        </button>
      </div>
    </div>
  `,
  styles: [`
    .status-card__title { display:flex;align-items:center;gap:6px;font-size:13px;font-weight:700;color:#0D8F61;margin:0 0 10px }
    .status-card__sub { font-size:12px;color:var(--bizx-n600);margin:10px 0 6px }
    .status-card__chips { display:flex;flex-wrap:wrap;gap:6px }
    .badge-blue { display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:20px;background:rgba(4,99,239,0.1);color:#0463EF;font-size:11px;font-weight:600 }
  `],
})
export class StatusCardComponent {
  @Input({ required: true }) data!: Record<string, unknown>;
  readonly chat = inject(ChatService);
  readonly CheckCircle = CheckCircle;
  readonly Search = Search;
  readonly Plus = Plus;
  readonly Printer = Printer;
  get d(): StatusCardData { return this.data as unknown as StatusCardData; }
}
