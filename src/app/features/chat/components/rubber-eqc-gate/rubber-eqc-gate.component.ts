import { ChangeDetectionStrategy, Component, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, FileText, Leaf, PencilLine, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-angular';
import { RubberEqcGateData } from '@app/core/models/types';
import { ChatService } from '@app/core/services/chat.service';

@Component({
  selector: 'app-rubber-eqc-gate',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="reg-wrap">
      <div class="reg-hd">
        <span class="reg-hd__icon">
          <lucide-icon [img]="FileText" [size]="17" />
        </span>
        <div class="reg-hd__text">
          <p class="reg-title">แบบคำขอใบรับรองคุณภาพยาง (e-QC) / ใบรายงานคุณภาพยาง</p>
          <span class="reg-badge">{{ data.agency }}</span>
        </div>
      </div>

      <p class="reg-sub">กรุณากรอกแบบคำขอสำหรับรายการยางผสมดังนี้ ก่อนดำเนินการต่อ</p>

      <ul class="reg-items">
        @for (name of data.itemNames; track name) {
          <li>
            <lucide-icon [img]="Leaf" [size]="12" />
            <span>{{ name }}</span>
          </li>
        }
      </ul>

      @if (!proceeded()) {
        <div class="reg-hint" [class.reg-hint--done]="data.completed">
          <lucide-icon [img]="data.completed ? CheckCircle2 : AlertCircle" [size]="14" />
          <span>
            {{ data.completed
              ? 'บันทึกแบบคำขอแล้ว — ยังสามารถกลับไปแก้ไขข้อมูลเพิ่มเติมได้'
              : 'กรุณากรอกแบบคำขอให้ครบก่อนดำเนินการต่อ' }}
          </span>
        </div>
        <div class="reg-actions">
          <button class="reg-btn reg-btn--outline" (click)="openEditor()" type="button">
            <lucide-icon [img]="PencilLine" [size]="14" />
            กรอกข้อมูล
          </button>
          @if (data.completed) {
            <button class="reg-btn reg-btn--solid" (click)="proceed()" type="button">
              ดำเนินการต่อ
              <lucide-icon [img]="ArrowRight" [size]="14" />
            </button>
          }
        </div>
      } @else {
        <div class="reg-done">
          <lucide-icon [img]="CheckCircle2" [size]="15" />
          ดำเนินการต่อแล้ว
        </div>
      }
    </div>
  `,
  styles: [`
    .reg-wrap {
      display: flex; flex-direction: column; gap: 12px; padding: 6px 2px 2px;
    }
    .reg-hd {
      display: flex; align-items: flex-start; gap: 10px;
    }
    .reg-hd__icon {
      flex-shrink: 0;
      width: 32px; height: 32px; border-radius: 9px;
      display: flex; align-items: center; justify-content: center;
      background: rgba(4, 99, 239, 0.1); color: var(--bizx-blue);
    }
    .reg-hd__text {
      display: flex; flex-direction: column; gap: 5px; min-width: 0;
    }
    .reg-title {
      font-size: 14px; font-weight: 700; color: var(--bizx-navy); margin: 0; line-height: 1.4;
    }
    .reg-badge {
      align-self: flex-start;
      font-size: 10.5px; font-weight: 700; color: #0D8F61;
      background: rgba(13, 143, 97, 0.1);
      padding: 2px 9px; border-radius: 20px;
    }
    .reg-sub {
      font-size: 12px; color: #6B7280; margin: 0;
    }
    .reg-items {
      margin: 0; padding: 0; list-style: none;
      display: flex; flex-direction: column; gap: 5px;

      li {
        display: flex; align-items: center; gap: 7px;
        font-size: 12.5px; font-weight: 600; color: var(--bizx-navy);
        background: #FAFAFA; border: 1px solid #EEF0F6; border-radius: 8px;
        padding: 7px 10px;
      }

      lucide-icon { flex-shrink: 0; color: #0D8F61; }
    }
    .reg-hint {
      display: flex; align-items: flex-start; gap: 7px;
      background: rgba(180, 83, 9, 0.07);
      border: 1px solid rgba(180, 83, 9, 0.2);
      border-radius: 10px;
      padding: 9px 11px;
      font-size: 12px; line-height: 1.5; color: #B45309;

      lucide-icon { flex-shrink: 0; margin-top: 1px; }
    }
    .reg-hint--done {
      background: rgba(4, 99, 239, 0.06);
      border-color: rgba(4, 99, 239, 0.18);
      color: var(--bizx-navy);

      lucide-icon { color: var(--bizx-blue); }
    }
    .reg-actions {
      display: flex; gap: 8px;
    }
    .reg-btn {
      display: flex; align-items: center; justify-content: center; gap: 6px;
      padding: 8px 18px; border-radius: 8px; border: none;
      font-size: 13px; font-weight: 700; font-family: inherit;
      cursor: pointer; transition: opacity 0.15s, background 0.15s;
    }
    .reg-btn--solid {
      background: var(--bizx-blue); color: #fff;
      &:hover { background: #034DBA; }
    }
    .reg-btn--outline {
      background: #fff; color: var(--bizx-navy);
      border: 1.5px solid #E5E7EB;
      &:hover { border-color: var(--bizx-blue); color: var(--bizx-blue); }
    }
    .reg-done {
      display: flex; align-items: center; gap: 6px;
      font-size: 12.5px; font-weight: 700; color: #0D8F61; margin: 0;
    }
  `],
})
export class RubberEqcGateComponent {
  @Input() msgId = '';
  @Input({ required: true }) data!: RubberEqcGateData;

  readonly chat = inject(ChatService);
  readonly proceeded = signal(false);

  readonly FileText = FileText;
  readonly Leaf = Leaf;
  readonly PencilLine = PencilLine;
  readonly ArrowRight = ArrowRight;
  readonly CheckCircle2 = CheckCircle2;
  readonly AlertCircle = AlertCircle;

  openEditor(): void {
    this.chat.openRubberEqcEditor(this.msgId);
  }

  proceed(): void {
    if (this.proceeded()) return;
    this.proceeded.set(true);
    this.chat.onRubberEqcGateProceed();
  }
}
