import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, CheckCircle2, QrCode } from 'lucide-angular';
import { AgencyApprovalPendingData } from '@app/core/models/types';

@Component({
  selector: 'app-agency-approval-pending',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="aap-wrap">
      <p class="aap-title">
        <lucide-icon [img]="CheckCircle2" [size]="16" color="#0D8F61" />
        {{ data.agency }}ตรวจสอบและอนุมัติคำขอแล้วครับ
      </p>
      <div class="aap-hint">
        <lucide-icon [img]="QrCode" [size]="14" color="#0463EF" style="flex-shrink:0;margin-top:1px" />
        <span>กรมกำลังจัดเตรียม QR สำหรับชำระค่าธรรมเนียม — ไปที่หน้า<strong>คิวงาน</strong>เพื่อดู QR และดำเนินการชำระเงินต่อได้เลยครับ</span>
      </div>
    </div>
  `,
  styles: [`
    .aap-wrap { display: flex; flex-direction: column; gap: 8px; }
    .aap-title {
      display: flex; align-items: center; gap: 6px;
      font-size: 13px; font-weight: 700; color: #0D8F61; margin: 0;
    }
    .aap-hint {
      display: flex; align-items: flex-start; gap: 7px;
      background: rgba(4, 99, 239, 0.06);
      border: 1px solid rgba(4, 99, 239, 0.16);
      border-radius: 10px;
      padding: 9px 11px;
      font-size: 12px;
      line-height: 1.5;
      color: var(--bizx-navy);

      strong { color: var(--bizx-blue); font-weight: 700; }
    }
  `],
})
export class AgencyApprovalPendingComponent {
  @Input({ required: true }) data!: AgencyApprovalPendingData;
  readonly CheckCircle2 = CheckCircle2;
  readonly QrCode = QrCode;
}
