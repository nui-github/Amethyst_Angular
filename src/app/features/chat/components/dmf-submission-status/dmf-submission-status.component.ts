import { ChangeDetectionStrategy, Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Loader2, CheckCircle2, FileCheck2, Send, ChevronDown, ChevronUp } from 'lucide-angular';
import { DmfSubmissionStatusData } from '@app/core/models/types';

@Component({
  selector: 'app-dmf-submission-status',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="dss-wrap">
      <div class="dss-hd" [class.dss-hd--dmf]="data.status === 'dmf-accept'" [class.dss-hd--license]="data.status === 'license-accept'">
        <span class="dss-hd__icon">
          <lucide-icon [img]="statusIcon()" [size]="16" [class.dss-spin]="data.status === 'waiting-response'" />
        </span>
        <div class="dss-hd__text">
          <p class="dss-title">{{ statusTitle() }}</p>
          <span class="dss-ref">Ref. {{ data.referenceNumber }}</span>
        </div>
        <span class="dss-badge">{{ statusLabel() }}</span>
      </div>

      @if (data.status === 'waiting-response') {
        <div class="dss-hint">
          <lucide-icon [img]="Send" [size]="14" />
          <span>ยื่นข้อมูลผ่านระบบคอมพิวเตอร์ไปยังกรมเชื้อเพลิงธรรมชาติ กระทรวงพลังงาน (DMF) เรียบร้อยแล้ว กำลังรอผลตอบกลับจากกรมครับ...</span>
        </div>
      }

      @if (data.status !== 'waiting-response') {
        <div class="info-card dss-card">
          <div class="info-card__head">ข้อมูลใบขน</div>
          <div class="info-card__body">
            <div class="info-card__row"><span>DECL No.</span><span>{{ data.declNo }}</span></div>
            <div class="info-card__row"><span>วันที่</span><span>{{ data.declDate }}</span></div>
            <div class="info-card__row"><span>ชื่อบริษัท</span><span>{{ data.companyNameEn }}</span></div>
            <div class="info-card__row"><span>ชื่อบริษัท (ไทย)</span><span>{{ data.companyNameTh }}</span></div>
            <div class="info-card__row"><span>เลขประจำตัวผู้เสียภาษี</span><span>{{ data.taxNumber }}</span></div>
            <div class="info-card__row"><span>สาขา</span><span>{{ data.branch }}</span></div>
            <div class="info-card__row dss-row--wrap"><span>ที่อยู่</span><span>{{ data.address }}</span></div>
          </div>
        </div>

        <div class="dss-table-wrap">
          <table class="dss-table">
            <thead>
              <tr>
                @if (data.status === 'license-accept') { <th class="dss-th--tick"></th> }
                <th>ITEM NO</th><th>INV NO</th><th>INV ITEM</th><th>TARIFF</th><th>STAT</th>
                <th>EN DESC</th><th>TH DESC</th><th>PK</th><th>NW</th><th>QTY</th>
                <th>INV AMOUNT</th><th>CIF Foreign</th><th>CIF Baht</th>
              </tr>
            </thead>
            <tbody>
              @for (item of data.items; track item.itemNo) {
                <tr>
                  @if (data.status === 'license-accept') {
                    <td class="dss-td--tick">
                      @if (item.dutyExempt) { <lucide-icon [img]="CheckCircle2" [size]="15" class="dss-tick" /> }
                    </td>
                  }
                  <td>{{ item.itemNo }}</td><td>{{ item.invNo }}</td><td>{{ item.invItem }}</td>
                  <td>{{ item.tariff }}</td><td>{{ item.stat }}</td>
                  <td class="dss-td--desc">{{ item.enDesc }}</td><td class="dss-td--desc">{{ item.thDesc }}</td>
                  <td>{{ item.pk }}</td><td>{{ item.nw }}</td><td>{{ item.qty }}</td>
                  <td>{{ item.invAmount }}</td><td>{{ item.cifForeign }}</td><td>{{ item.cifBaht }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        @if (data.status === 'license-accept') {
          <div class="dss-exempt-note">
            <lucide-icon [img]="CheckCircle2" [size]="14" />
            <span>รายการที่มีเครื่องหมาย ✓ ได้รับยกเว้นอากรตามมาตรา 70 พ.ร.บ.ปิโตรเลียม พ.ศ. 2514 แล้วครับ</span>
          </div>

          <button class="dss-detail-toggle" type="button" (click)="detailOpen.set(!detailOpen())">
            <lucide-icon [img]="FileCheck2" [size]="14" />
            ดูรายละเอียดใบอนุญาต
            <lucide-icon [img]="detailOpen() ? ChevronUp : ChevronDown" [size]="14" class="dss-chev" />
          </button>

          @if (detailOpen() && data.license) {
            <div class="info-card dss-card dss-card--license">
              <div class="info-card__head">
                License No. {{ data.license.licenseNo }} · Issue Date {{ data.license.issueDate }}
              </div>
              <div class="info-card__body">
                <div class="info-card__row"><span>Request No.</span><span>{{ data.license.requestNo }}</span></div>
                <div class="info-card__row dss-row--wrap"><span>License Name</span><span>{{ data.license.licenseName }}</span></div>
                <div class="info-card__row"><span>License Issue Authority</span><span>{{ data.license.licenseIssueAuthority }}</span></div>
                <div class="info-card__row"><span>License Authority Name</span><span>{{ data.license.licenseAuthorityName }}</span></div>
                <div class="info-card__row"><span>License Type</span><span>{{ data.license.licenseType }}</span></div>
                <div class="info-card__row"><span>License IssueDate</span><span>{{ data.license.licenseIssueDate }}</span></div>
                <div class="info-card__row"><span>Effective Date</span><span>{{ data.license.effectiveDate }}</span></div>
                <div class="info-card__row"><span>Expire Date</span><span>{{ data.license.expireDate }}</span></div>
              </div>
            </div>
          }
        }
      }
    </div>
  `,
  styles: [`
    .dss-wrap { display: flex; flex-direction: column; gap: 12px; padding: 6px 2px 2px; }

    .dss-hd {
      display: flex; align-items: center; gap: 10px;
      background: rgba(180, 83, 9, 0.07); border: 1px solid rgba(180, 83, 9, 0.2);
      border-radius: 12px; padding: 10px 12px;
      transition: background 0.2s, border-color 0.2s;
    }
    .dss-hd--dmf { background: rgba(13, 143, 97, 0.07); border-color: rgba(13, 143, 97, 0.2); }
    .dss-hd--license { background: rgba(124, 58, 237, 0.07); border-color: rgba(124, 58, 237, 0.22); }

    .dss-hd__icon {
      flex-shrink: 0; width: 30px; height: 30px; border-radius: 9px;
      display: flex; align-items: center; justify-content: center;
      background: rgba(180, 83, 9, 0.12); color: #B45309;
    }
    .dss-hd--dmf .dss-hd__icon { background: rgba(13, 143, 97, 0.12); color: #0D8F61; }
    .dss-hd--license .dss-hd__icon { background: rgba(124, 58, 237, 0.14); color: #7C3AED; }

    .dss-spin { animation: dss-spin 1s linear infinite; }
    @keyframes dss-spin { to { transform: rotate(360deg); } }

    .dss-hd__text { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1; }
    .dss-title { font-size: 13.5px; font-weight: 700; color: var(--bizx-navy); margin: 0; line-height: 1.4; }
    .dss-ref { font-size: 11px; color: var(--bizx-n600); }

    .dss-badge {
      flex-shrink: 0; font-size: 10.5px; font-weight: 800; letter-spacing: 0.4px;
      color: #B45309; background: rgba(180, 83, 9, 0.12);
      padding: 4px 10px; border-radius: 20px;
    }
    .dss-hd--dmf .dss-badge { color: #0D8F61; background: rgba(13, 143, 97, 0.12); }
    .dss-hd--license .dss-badge { color: #7C3AED; background: rgba(124, 58, 237, 0.14); }

    .dss-hint {
      display: flex; align-items: flex-start; gap: 7px;
      background: rgba(180, 83, 9, 0.06); border: 1px solid rgba(180, 83, 9, 0.18);
      border-radius: 10px; padding: 9px 11px; font-size: 12px; line-height: 1.55; color: #B45309;

      lucide-icon { flex-shrink: 0; margin-top: 1px; }
    }

    .dss-card { margin-top: 0; }
    .dss-row--wrap {
      flex-direction: column; align-items: flex-start; gap: 3px;
      span:last-child { text-align: left; font-weight: 500; color: var(--bizx-navy); }
    }
    .dss-card--license .info-card__head { color: #7C3AED; background: rgba(124, 58, 237, 0.08); }

    .dss-table-wrap {
      overflow-x: auto; border: 1px solid #EAECF4; border-radius: 12px;
    }
    .dss-table {
      width: 100%; border-collapse: collapse; font-size: 11.5px; white-space: nowrap;

      th, td { padding: 8px 10px; text-align: left; border-bottom: 1px solid #F3F4F6; }
      th {
        background: #F7F8FD; font-weight: 700; color: var(--bizx-navy);
        font-size: 10.5px; letter-spacing: 0.2px;
      }
      tbody tr:last-child td { border-bottom: none; }
      td { color: var(--bizx-n600); }
    }
    .dss-td--desc { white-space: normal; min-width: 140px; color: var(--bizx-navy); font-weight: 500; }
    .dss-th--tick, .dss-td--tick { width: 34px; text-align: center !important; }
    .dss-tick { color: #0D8F61; }

    .dss-exempt-note {
      display: flex; align-items: flex-start; gap: 7px;
      background: rgba(13, 143, 97, 0.06); border: 1px solid rgba(13, 143, 97, 0.2);
      border-radius: 10px; padding: 9px 11px; font-size: 12px; line-height: 1.5; color: var(--bizx-navy);

      lucide-icon { flex-shrink: 0; margin-top: 1px; color: #0D8F61; }
    }

    .dss-detail-toggle {
      align-self: flex-start;
      display: flex; align-items: center; gap: 6px;
      padding: 8px 14px; border-radius: 8px;
      border: 1.5px solid #7C3AED; background: #fff;
      font-size: 12.5px; font-weight: 700; color: #7C3AED; font-family: inherit;
      cursor: pointer; transition: background 0.15s;

      &:hover { background: rgba(124, 58, 237, 0.06); }
    }
    .dss-chev { margin-left: 2px; }
  `],
})
export class DmfSubmissionStatusComponent {
  @Input({ required: true }) data!: DmfSubmissionStatusData;

  readonly detailOpen = signal(false);

  readonly Loader2 = Loader2;
  readonly CheckCircle2 = CheckCircle2;
  readonly FileCheck2 = FileCheck2;
  readonly Send = Send;
  readonly ChevronDown = ChevronDown;
  readonly ChevronUp = ChevronUp;

  // Plain methods, not computed() — `data` is a mutable @Input, not a signal, so a computed()
  // here would memoize on first read and never re-run when updateLastMessageData() swaps in a
  // new object; OnPush change detection re-evaluates these on every @Input change instead.
  statusIcon() {
    switch (this.data.status) {
      case 'waiting-response': return this.Loader2;
      case 'dmf-accept': return this.CheckCircle2;
      case 'license-accept': return this.FileCheck2;
    }
  }

  statusLabel(): string {
    switch (this.data.status) {
      case 'waiting-response': return 'WAITING RESPONSE';
      case 'dmf-accept': return 'DMF ACCEPT';
      case 'license-accept': return 'LICENSE ACCEPT';
    }
  }

  statusTitle(): string {
    switch (this.data.status) {
      case 'waiting-response': return 'กำลังยื่นข้อมูลไปยังกรมเชื้อเพลิงธรรมชาติ...';
      case 'dmf-accept': return 'กรมเชื้อเพลิงธรรมชาติรับข้อมูลแล้ว';
      case 'license-accept': return 'อนุมัติใบอนุญาตแล้ว';
    }
  }
}
