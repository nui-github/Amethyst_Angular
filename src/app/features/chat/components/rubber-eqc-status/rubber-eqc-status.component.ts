import { ChangeDetectionStrategy, Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Loader2, BadgeCheck, Clock, CheckCircle2 } from 'lucide-angular';
import { RubberEqcStatusData } from '@app/core/models/types';

type Tab = 'license' | 'lab' | 'remark';

@Component({
  selector: 'app-rubber-eqc-status',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="res-wrap">
      <div class="res-hd">
        <span class="res-hd__icon" [class.res-hd__icon--done]="isDone">
          <lucide-icon [img]="isDone ? BadgeCheck : Loader2" [size]="17" [class.res-spin]="!isDone" />
        </span>
        <div class="res-hd__text">
          <p class="res-title">
            {{ isDone ? 'ได้รับหนังสือรับรองคุณภาพยาง (e-QC) แล้ว' : 'ส่งคำขอไปยังการยางแห่งประเทศไทยแล้ว' }}
          </p>
          <span class="res-status" [class.res-status--done]="isDone">
            {{ isDone ? 'LICENSE ACCEPT' : 'RUBBER ACCEPT' }}
          </span>
        </div>
      </div>

      @if (!isDone) {
        <div class="res-hint">
          <lucide-icon [img]="Clock" [size]="14" />
          <span>
            ได้รับ Accept จากการยางแห่งประเทศไทย และรอการตัดชำระค่าบริการ
            ฿{{ data.amount | number:'1.2-2' }} ผ่านบัญชี {{ data.paidAccountLabel }}
          </span>
        </div>
      } @else {
        <div class="res-hint res-hint--done">
          <lucide-icon [img]="CheckCircle2" [size]="14" />
          <span>
            ตัดชำระค่าบริการ ฿{{ data.amount | number:'1.2-2' }} ผ่านบัญชี {{ data.paidAccountLabel }}
            เรียบร้อยแล้ว — Certificate No. {{ data.certificateNo }}
          </span>
        </div>

        <div class="res-tabs">
          <button class="res-tab" [class.res-tab--active]="activeTab() === 'license'" (click)="activeTab.set('license')" type="button">
            รายละเอียดใบอนุญาต
          </button>
          <button class="res-tab" [class.res-tab--active]="activeTab() === 'lab'" (click)="activeTab.set('lab')" type="button">
            รายละเอียดห้องปฏิบัติการทดสอบ
          </button>
          <button class="res-tab" [class.res-tab--active]="activeTab() === 'remark'" (click)="activeTab.set('remark')" type="button">
            Remark
          </button>
        </div>

        <div class="res-panel">
          @if (activeTab() === 'license') {
            <div class="res-rows">
              <div class="res-row"><span>เลขประจำตัวหน่วยงานผู้ออกใบอนุญาต</span><strong>{{ data.issuerOrgId || '-' }}</strong></div>
              <div class="res-row"><span>ชื่อหน่วยงานออกใบอนุญาต (ไทย)</span><strong>{{ data.issuerNameTh }}</strong></div>
              <div class="res-row"><span>ชื่อหน่วยงานออกใบอนุญาต (อังกฤษ)</span><strong>{{ data.issuerNameEn }}</strong></div>
              <div class="res-row"><span>ที่อยู่</span><strong>{{ data.issuerAddressTh }}</strong></div>
              <div class="res-row"><span>ที่อยู่ (ภาษาอังกฤษ)</span><strong>{{ data.issuerAddressEn }}</strong></div>
              <div class="res-row"><span>Certificate No.</span><strong>{{ data.certificateNo }}</strong></div>
              <div class="res-row"><span>Issue Date</span><strong>{{ data.issueDate }}</strong></div>
              <div class="res-row"><span>Expire Date</span><strong>{{ data.expireDate }}</strong></div>
            </div>
          } @else if (activeTab() === 'lab') {
            <div class="res-rows">
              <div class="res-row"><span>รหัสห้องปฏิบัติการ (Lab Code)</span><strong>{{ data.labCode || '-' }}</strong></div>
            </div>
          } @else {
            <p class="res-remark">{{ data.remark || '-' }}</p>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .res-wrap {
      display: flex; flex-direction: column; gap: 12px; padding: 6px 2px 2px;
    }
    .res-hd {
      display: flex; align-items: flex-start; gap: 10px;
    }
    .res-hd__icon {
      flex-shrink: 0;
      width: 32px; height: 32px; border-radius: 9px;
      display: flex; align-items: center; justify-content: center;
      background: rgba(180, 83, 9, 0.1); color: #B45309;
    }
    .res-hd__icon--done {
      background: rgba(13, 143, 97, 0.1); color: #0D8F61;
    }
    .res-spin { animation: res-spin 1s linear infinite; }
    @keyframes res-spin { to { transform: rotate(360deg); } }
    .res-hd__text {
      display: flex; flex-direction: column; gap: 5px; min-width: 0;
    }
    .res-title {
      font-size: 14px; font-weight: 700; color: var(--bizx-navy); margin: 0; line-height: 1.4;
    }
    .res-status {
      align-self: flex-start;
      font-size: 10.5px; font-weight: 700; color: #B45309;
      background: rgba(180, 83, 9, 0.1);
      padding: 2px 9px; border-radius: 20px;
      letter-spacing: 0.3px;
    }
    .res-status--done {
      color: #0D8F61; background: rgba(13, 143, 97, 0.1);
    }
    .res-hint {
      display: flex; align-items: flex-start; gap: 7px;
      background: rgba(180, 83, 9, 0.07);
      border: 1px solid rgba(180, 83, 9, 0.2);
      border-radius: 10px;
      padding: 9px 11px;
      font-size: 12px; line-height: 1.5; color: #B45309;

      lucide-icon { flex-shrink: 0; margin-top: 1px; }
    }
    .res-hint--done {
      background: rgba(13, 143, 97, 0.07);
      border-color: rgba(13, 143, 97, 0.2);
      color: var(--bizx-navy);

      lucide-icon { color: #0D8F61; }
    }
    .res-tabs {
      display: flex; gap: 4px; border-bottom: 1px solid #EEF0F6;
    }
    .res-tab {
      padding: 7px 4px; border: none; background: transparent;
      font-size: 12px; font-weight: 600; color: #6B7280; font-family: inherit;
      cursor: pointer; border-bottom: 2px solid transparent;
      margin-right: 14px; transition: color 0.15s, border-color 0.15s;

      &:hover { color: var(--bizx-navy); }
    }
    .res-tab--active {
      color: var(--bizx-blue); border-bottom-color: var(--bizx-blue);
    }
    .res-panel {
      padding-top: 2px;
    }
    .res-rows {
      display: flex; flex-direction: column; gap: 7px;
    }
    .res-row {
      display: flex; justify-content: space-between; gap: 16px;
      font-size: 12.5px; padding: 5px 0; border-bottom: 1px dashed #EEF0F6;

      span { color: #6B7280; flex-shrink: 0; }
      strong { color: var(--bizx-navy); font-weight: 600; text-align: right; }
    }
    .res-remark {
      font-size: 12.5px; color: var(--bizx-navy); margin: 0;
    }
  `],
})
export class RubberEqcStatusComponent {
  @Input({ required: true }) data!: RubberEqcStatusData;

  readonly activeTab = signal<Tab>('license');

  readonly Loader2 = Loader2;
  readonly BadgeCheck = BadgeCheck;
  readonly Clock = Clock;
  readonly CheckCircle2 = CheckCircle2;

  get isDone(): boolean {
    return this.data.status === 'license-accept';
  }
}
