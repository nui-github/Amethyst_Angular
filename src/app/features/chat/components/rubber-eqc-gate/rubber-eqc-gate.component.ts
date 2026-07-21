import { ChangeDetectionStrategy, Component, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RubberEqcGateData } from '@app/core/models/types';
import { ChatService } from '@app/core/services/chat.service';

@Component({
  selector: 'app-rubber-eqc-gate',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="reg-wrap">
      <p class="reg-title">แบบคำขอใบรับรองคุณภาพยาง (e-QC) / ใบรายงานคุณภาพยาง</p>
      <p class="reg-sub">{{ data.agency }} · กรุณากรอกแบบคำขอสำหรับรายการยางผสมดังนี้ก่อนดำเนินการต่อ</p>

      <ul class="reg-items">
        @for (name of data.itemNames; track name) {
          <li>{{ name }}</li>
        }
      </ul>

      @if (!proceeded()) {
        <div class="reg-foot">
          <span class="reg-foot__hint">
            {{ data.completed ? 'ยังสามารถกลับไปแก้ไขข้อมูลเพิ่มเติมได้' : 'กรุณากรอกแบบคำขอให้ครบก่อนดำเนินการต่อ' }}
          </span>
          <div class="reg-foot__btns">
            <button class="reg-btn reg-btn--secondary" (click)="openEditor()">
              กรอกข้อมูล
            </button>
            @if (data.completed) {
              <button class="reg-btn" (click)="proceed()">
                ดำเนินการต่อ
              </button>
            }
          </div>
        </div>
      } @else {
        <p class="reg-done">✓ ดำเนินการต่อแล้ว</p>
      }
    </div>
  `,
  styles: [`
    .reg-wrap {
      display: flex; flex-direction: column; gap: 10px; padding: 4px 0 2px;
    }
    .reg-title {
      font-size: 14px; font-weight: 700; color: var(--bizx-navy); margin: 0;
    }
    .reg-sub {
      font-size: 12px; color: #6B7280; margin: 0;
    }
    .reg-items {
      margin: 0; padding-left: 18px; font-size: 12.5px; color: var(--bizx-navy);
      li { margin: 2px 0; }
    }
    .reg-foot {
      display: flex; flex-direction: column; gap: 8px; margin-top: 2px;
    }
    .reg-foot__hint {
      font-size: 11.5px; color: #B45309;
    }
    .reg-foot__btns {
      display: flex; gap: 8px;
    }
    .reg-btn {
      padding: 8px 20px; border-radius: 8px; border: none;
      background: var(--bizx-blue); color: #fff;
      font-size: 13px; font-weight: 700; font-family: inherit;
      cursor: pointer; transition: opacity 0.15s;
      &:hover { opacity: 0.88; }
    }
    .reg-btn--secondary {
      background: #F4F5F9; color: var(--bizx-navy);
    }
    .reg-done {
      font-size: 12.5px; font-weight: 600; color: #0D8F61; margin: 0;
    }
  `],
})
export class RubberEqcGateComponent {
  @Input() msgId = '';
  @Input({ required: true }) data!: RubberEqcGateData;

  readonly chat = inject(ChatService);
  readonly proceeded = signal(false);

  openEditor(): void {
    this.chat.openRubberEqcEditor(this.msgId);
  }

  proceed(): void {
    if (this.proceeded()) return;
    this.proceeded.set(true);
    this.chat.onRubberEqcGateProceed();
  }
}
