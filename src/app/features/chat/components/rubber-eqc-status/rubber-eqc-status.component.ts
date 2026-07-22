import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Loader2, BadgeCheck, Clock, CheckCircle2, Download, ArrowRight, Send } from 'lucide-angular';
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
          <lucide-icon [img]="isDone ? BadgeCheck : Send" [size]="17" />
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
            กรุณาส่งชิ้นงานตัวอย่างให้เจ้าหน้าที่การยางแห่งประเทศไทยตรวจสอบครับ เจ้าหน้าที่จะใช้เวลาตรวจสอบ
            ประมาณ 3-7 วันทำการ และจะแจ้งผลกลับผ่านระบบทันทีที่ตรวจสอบเสร็จสิ้น
          </span>
        </div>

        <div class="res-status-strip" [class.res-status-strip--ready]="isReady">
          <span class="res-status-strip__label">
            <lucide-icon [img]="isReady ? CheckCircle2 : Loader2" [size]="13" [class.res-spin]="!isReady" />
            สถานะ LICENSE ACCEPT
          </span>
          <span class="res-status-strip__value">{{ isReady ? 'ตรวจสอบผ่านแล้ว' : 'รอผลตรวจสอบ' }}</span>
        </div>

        @if (interactive) {
          <div class="res-ft">
            <button class="res-proceed" [disabled]="!isReady || submitting()" (click)="onProceed()" type="button">
              ดำเนินการต่อ
              <lucide-icon [img]="ArrowRight" [size]="13" />
            </button>
          </div>
        }
      } @else {
        <div class="res-hint res-hint--done">
          <lucide-icon [img]="CheckCircle2" [size]="14" />
          <span>
            ตัดชำระค่าบริการ ฿{{ data.amount | number:'1.2-2' }} ผ่านบัญชี {{ data.paidAccountLabel }} เรียบร้อยแล้ว
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
            <div class="info-card res-card">
              <div class="info-card__head">ใบรับรองคุณภาพยาง (e-QC)</div>
              <div class="info-card__body">
                <div class="info-card__row"><span>Certificate No.</span><span>{{ data.certificateNo }}</span></div>
                <div class="info-card__row"><span>Issue Date</span><span>{{ data.issueDate }}</span></div>
                <div class="info-card__row"><span>Expire Date</span><span>{{ data.expireDate }}</span></div>
              </div>
            </div>
            <div class="info-card res-card">
              <div class="info-card__head">หน่วยงานผู้ออกใบอนุญาต</div>
              <div class="info-card__body">
                <div class="info-card__row"><span>เลขประจำตัวหน่วยงานผู้ออกใบอนุญาต</span><span>{{ data.issuerOrgId || '-' }}</span></div>
                <div class="info-card__row"><span>ชื่อหน่วยงานออกใบอนุญาต (ไทย)</span><span>{{ data.issuerNameTh }}</span></div>
                <div class="info-card__row"><span>ชื่อหน่วยงานออกใบอนุญาต (อังกฤษ)</span><span>{{ data.issuerNameEn }}</span></div>
                <div class="info-card__row res-row--wrap"><span>ที่อยู่</span><span>{{ data.issuerAddressTh }}</span></div>
                <div class="info-card__row res-row--wrap"><span>ที่อยู่ (ภาษาอังกฤษ)</span><span>{{ data.issuerAddressEn }}</span></div>
                <div class="info-card__row"><span>เจ้าหน้าที่ที่มีอำนาจลงนามใบอนุญาต</span><span>{{ data.issuerAuthorizerNameTh || '-' }}</span></div>
                <div class="info-card__row"><span>ตำแหน่งเจ้าหน้าที่ที่มีอำนาจลงนามใบอนุญาต</span><span>{{ data.issuerAuthorizerPositionTh || '-' }}</span></div>
                <div class="info-card__row"><span>Authority English Name</span><span>{{ data.issuerAuthorizerNameEn || '-' }}</span></div>
                <div class="info-card__row"><span>Position of Authority English</span><span>{{ data.issuerAuthorizerPositionEn || '-' }}</span></div>
              </div>
            </div>
          } @else if (activeTab() === 'lab') {
            <div class="info-card res-card">
              <div class="info-card__head">ห้องปฏิบัติการทดสอบ</div>
              <div class="info-card__body">
                <div class="info-card__row"><span>ชื่อห้องทดสอบ (อังกฤษ)</span><span>{{ data.labNameEn || '-' }}</span></div>
                <div class="info-card__row res-row--wrap"><span>ที่อยู่</span><span>{{ data.labAddressTh || '-' }}</span></div>
                <div class="info-card__row res-row--wrap"><span>ที่อยู่ (ภาษาอังกฤษ)</span><span>{{ data.labAddressEn || '-' }}</span></div>
                <div class="info-card__row"><span>วันที่ทดสอบ</span><span>{{ data.labTestStartDate || '-' }}</span></div>
                <div class="info-card__row"><span>วันที่สิ้นสุดทดสอบ</span><span>{{ data.labTestEndDate || '-' }}</span></div>
                <div class="info-card__row"><span>วันที่รับตัวอย่าง</span><span>{{ data.labSampleReceivedDate || '-' }}</span></div>
                <div class="info-card__row"><span>เจ้าหน้าที่ห้องปฏิบัติการ</span><span>{{ data.labStaffName || '-' }}</span></div>
                <div class="info-card__row"><span>ตำแหน่งเจ้าหน้าที่ห้องปฏิบัติการ</span><span>{{ data.labStaffPosition || 'N/A' }}</span></div>
                <div class="info-card__row"><span>เบอร์โทรศัพท์</span><span>{{ data.labPhone || '-' }}</span></div>
                <div class="info-card__row"><span>เบอร์แฟกซ์</span><span>{{ data.labFax || '-' }}</span></div>
              </div>
            </div>
          } @else {
            <p class="res-remark">{{ data.remark || '-' }}</p>
          }
        </div>

        <div class="res-ft">
          <button class="res-dl" (click)="download()" type="button">
            <lucide-icon [img]="Download" [size]="13" />
            ดาวน์โหลดหนังสือรับรองคุณภาพยาง (e-QC)
          </button>
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
      display: flex; flex-direction: column; gap: 10px;
    }
    .res-card {
      margin-top: 0;
    }
    .res-row--wrap {
      flex-direction: column; align-items: flex-start; gap: 3px;

      span:last-child { text-align: left; font-weight: 500; color: var(--bizx-navy); }
    }
    .res-remark {
      font-size: 12.5px; color: var(--bizx-navy); margin: 0;
    }
    .res-status-strip {
      display: flex; align-items: center; justify-content: space-between;
      background: #FAFAFA; border: 1px solid #EEF0F6; border-radius: 10px;
      padding: 9px 12px;
    }
    .res-status-strip__label {
      display: flex; align-items: center; gap: 6px;
      font-size: 12.5px; font-weight: 700; color: #B45309;

      lucide-icon { color: #B45309; }
    }
    .res-status-strip__value {
      font-size: 11.5px; font-weight: 600; color: #6B7280;
    }
    .res-status-strip--ready {
      background: rgba(13, 143, 97, 0.06); border-color: rgba(13, 143, 97, 0.2);

      .res-status-strip__label { color: #0D8F61; lucide-icon { color: #0D8F61; } }
      .res-status-strip__value { color: #0D8F61; font-weight: 700; }
    }
    .res-ft {
      display: flex; justify-content: flex-end;
    }
    .res-proceed {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 18px; border-radius: 8px; border: none;
      background: var(--bizx-blue); color: #fff;
      font-size: 13px; font-weight: 700; font-family: inherit;
      cursor: pointer; transition: background 0.15s, opacity 0.15s;

      &:hover:not(:disabled) { background: #034DBA; }
      &:disabled { opacity: 0.4; cursor: not-allowed; }
    }
    .res-dl {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 16px; border-radius: 8px;
      border: 1.5px solid var(--bizx-blue); background: #fff;
      font-size: 12px; font-weight: 700; color: var(--bizx-blue); font-family: inherit;
      cursor: pointer; transition: background 0.15s;

      &:hover { background: rgba(4, 99, 239, 0.06); }
    }
  `],
})
export class RubberEqcStatusComponent {
  @Input({ required: true }) data!: RubberEqcStatusData;
  @Input() interactive = true;
  @Output() proceed = new EventEmitter<void>();

  readonly activeTab = signal<Tab>('license');
  readonly submitting = signal(false);

  readonly Loader2 = Loader2;
  readonly BadgeCheck = BadgeCheck;
  readonly Clock = Clock;
  readonly CheckCircle2 = CheckCircle2;
  readonly Download = Download;
  readonly ArrowRight = ArrowRight;
  readonly Send = Send;

  download(): void {
    if (this.data.certUrl) window.open(this.data.certUrl, '_blank', 'noopener');
  }

  onProceed(): void {
    if (!this.isReady || this.submitting()) return;
    this.submitting.set(true);
    this.proceed.emit();
  }

  get isReady(): boolean {
    return this.data.status === 'rubber-accept-ready';
  }

  get isDone(): boolean {
    return this.data.status === 'license-accept';
  }
}
