import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, CheckCircle, Search, Clock } from 'lucide-angular';
import { StatusCardData } from '@app/core/models/types';
import { ChatService } from '@app/core/services/chat.service';

@Component({
  selector: 'app-status-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="status-card">
      @if (d.isPending) {
        <p class="status-card__title status-card__title--pending">
          <lucide-icon [img]="Clock" [size]="16" color="#F59E0B" />
          ส่งข้อมูลไปยังกรมแล้ว — รอชำระค่าธรรมเนียม
        </p>
      } @else {
        <p class="status-card__title">
          <lucide-icon [img]="CheckCircle" [size]="16" color="#0D8F61" />
          ส่งข้อมูลสำเร็จแล้วครับ!
        </p>
      }
      <div class="info-card" style="margin-top:0"
        [style.border-color]="d.isPending ? 'rgba(245,158,11,0.3)' : 'rgba(22,234,158,0.3)'">
        <div class="info-card__head"
          [style.background]="d.isPending ? 'rgba(245,158,11,0.08)' : 'rgba(22,234,158,0.08)'"
          [style.color]="d.isPending ? '#B45309' : '#0D8F61'"
          [style.border-color]="d.isPending ? 'rgba(245,158,11,0.3)' : 'rgba(22,234,158,0.3)'">
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
            @if (d.isPending) {
              <span class="badge-amber">
                <lucide-icon [img]="Clock" [size]="11" /> รอชำระค่าธรรมเนียม
              </span>
            } @else {
              <span class="badge-blue">
                <lucide-icon [img]="Search" [size]="11" /> รอการอนุมัติ
              </span>
            }
          </div>
          @if (!d.isPending) {
            <div class="info-card__row">
              <span>คาดว่าอนุมัติ</span>
              <span style="font-weight:600;color:var(--bizx-navy)">3-5 วันทำการ</span>
            </div>
          }
          @if (feeAmountText) {
            <div class="info-card__row">
              <span>ค่าธรรมเนียม</span>
              <span style="font-weight:600;color:var(--bizx-navy)">{{ feeAmountText }}</span>
            </div>
          }
        </div>
      </div>
      @if (!d.isPending) {
        <div class="status-card__chips">
          <button class="quick-chip" (click)="chat.checkStatus(d.agency)">
            <lucide-icon [img]="Search" [size]="12" /> ตรวจสอบสถานะ
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .status-card__title { display:flex;align-items:center;gap:6px;font-size:13px;font-weight:700;color:#0D8F61;margin:0 0 10px }
    .status-card__title--pending { color:#B45309 }
    .status-card__chips { display:flex;flex-wrap:wrap;gap:6px;margin-top:10px }
    .badge-blue { display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:20px;background:rgba(4,99,239,0.1);color:#0463EF;font-size:11px;font-weight:600 }
    .badge-amber { display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:20px;background:rgba(245,158,11,0.12);color:#B45309;font-size:11px;font-weight:600 }
  `],
})
export class StatusCardComponent {
  @Input({ required: true }) data!: Record<string, unknown>;
  readonly chat = inject(ChatService);
  readonly CheckCircle = CheckCircle;
  readonly Search = Search;
  readonly Clock = Clock;
  get d(): StatusCardData { return this.data as unknown as StatusCardData; }
  get feeAmountText(): string { return this.d.feeNote?.match(/฿[\d,]+/)?.[0] ?? ''; }
}
