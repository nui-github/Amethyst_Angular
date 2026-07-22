import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Send, BadgeCheck, Clock, CheckCircle2, ArrowRight, Loader2 } from 'lucide-angular';
import { RubberEsfrStatusData } from '@app/core/models/types';

@Component({
  selector: 'app-rubber-esfr-status',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="ess-wrap">
      <div class="ess-hd">
        <span class="ess-hd__icon" [class.ess-hd__icon--done]="isDone">
          <lucide-icon [img]="isDone ? BadgeCheck : Send" [size]="17" />
        </span>
        <div class="ess-hd__text">
          <p class="ess-title">
            {{ isDone ? 'ได้รับอนุมัติคำขอผ่านด่านศุลกากร (e-SFR) แล้ว' : 'ส่งคำขอผ่านด่านศุลกากรและชำระค่าธรรมเนียมส่งออกแล้ว' }}
          </p>
          <span class="ess-status" [class.ess-status--done]="isDone">
            {{ isDone ? 'LICENSE ACCEPT' : 'RUBBER ACCEPT' }}
          </span>
        </div>
      </div>

      <div class="ess-ref"><span>Reference Number</span><span>{{ data.referenceNumber }}</span></div>

      <div class="ess-status-strip" [class.ess-status-strip--ready]="isDone">
        <span class="ess-status-strip__label">
          <lucide-icon [img]="isDone ? CheckCircle2 : Loader2" [size]="13" [class.ess-spin]="!isDone" />
          สถานะ LICENSE ACCEPT
        </span>
        <span class="ess-status-strip__value">{{ isDone ? 'ผ่านด่านศุลกากรแล้ว' : 'รอผลการตรวจสอบ' }}</span>
      </div>

      @if (!isDone) {
        <div class="ess-hint">
          <lucide-icon [img]="Clock" [size]="14" />
          <span>กรมศุลกากรและการยางแห่งประเทศไทยกำลังตรวจสอบคำขอผ่านด่านศุลกากรของท่านครับ</span>
        </div>
      }

      @if (interactive) {
        <div class="ess-ft">
          <button class="ess-proceed" [disabled]="!isDone || submitting()" (click)="onProceed()" type="button">
            ดำเนินการต่อ
            <lucide-icon [img]="ArrowRight" [size]="13" />
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .ess-wrap {
      display: flex; flex-direction: column; gap: 12px; padding: 6px 2px 2px;
    }
    .ess-hd {
      display: flex; align-items: flex-start; gap: 10px;
    }
    .ess-hd__icon {
      flex-shrink: 0;
      width: 32px; height: 32px; border-radius: 9px;
      display: flex; align-items: center; justify-content: center;
      background: rgba(180, 83, 9, 0.1); color: #B45309;
    }
    .ess-hd__icon--done {
      background: rgba(13, 143, 97, 0.1); color: #0D8F61;
    }
    .ess-spin { animation: ess-spin 1s linear infinite; }
    @keyframes ess-spin { to { transform: rotate(360deg); } }
    .ess-hd__text {
      display: flex; flex-direction: column; gap: 5px; min-width: 0;
    }
    .ess-title {
      font-size: 14px; font-weight: 700; color: var(--bizx-navy); margin: 0; line-height: 1.4;
    }
    .ess-status {
      align-self: flex-start;
      font-size: 10.5px; font-weight: 700; color: #B45309;
      background: rgba(180, 83, 9, 0.1);
      padding: 2px 9px; border-radius: 20px;
      letter-spacing: 0.3px;
    }
    .ess-status--done {
      color: #0D8F61; background: rgba(13, 143, 97, 0.1);
    }
    .ess-ref {
      display: flex; justify-content: space-between; gap: 8px;
      font-size: 12px; background: #FAFAFA; border: 1px solid #EEF0F6;
      border-radius: 10px; padding: 9px 12px;

      span:first-child { color: #6B7280; }
      span:last-child { color: var(--bizx-navy); font-weight: 600; }
    }
    .ess-hint {
      display: flex; align-items: flex-start; gap: 7px;
      background: rgba(180, 83, 9, 0.07);
      border: 1px solid rgba(180, 83, 9, 0.2);
      border-radius: 10px;
      padding: 9px 11px;
      font-size: 12px; line-height: 1.5; color: #B45309;

      lucide-icon { flex-shrink: 0; margin-top: 1px; }
    }
    .ess-status-strip {
      display: flex; align-items: center; justify-content: space-between;
      background: #FAFAFA; border: 1px solid #EEF0F6; border-radius: 10px;
      padding: 9px 12px;
    }
    .ess-status-strip__label {
      display: flex; align-items: center; gap: 6px;
      font-size: 12.5px; font-weight: 700; color: #B45309;

      lucide-icon { color: #B45309; }
    }
    .ess-status-strip__value {
      font-size: 11.5px; font-weight: 600; color: #6B7280;
    }
    .ess-status-strip--ready {
      background: rgba(13, 143, 97, 0.06); border-color: rgba(13, 143, 97, 0.2);

      .ess-status-strip__label { color: #0D8F61; lucide-icon { color: #0D8F61; } }
      .ess-status-strip__value { color: #0D8F61; font-weight: 700; }
    }
    .ess-ft {
      display: flex; justify-content: flex-end;
    }
    .ess-proceed {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 18px; border-radius: 8px; border: none;
      background: var(--bizx-blue); color: #fff;
      font-size: 13px; font-weight: 700; font-family: inherit;
      cursor: pointer; transition: background 0.15s, opacity 0.15s;

      &:hover:not(:disabled) { background: #034DBA; }
      &:disabled { opacity: 0.4; cursor: not-allowed; }
    }
  `],
})
export class RubberEsfrStatusComponent {
  @Input({ required: true }) data!: RubberEsfrStatusData;
  @Input() interactive = true;
  @Output() proceed = new EventEmitter<void>();

  readonly submitting = signal(false);

  readonly Send = Send;
  readonly BadgeCheck = BadgeCheck;
  readonly Clock = Clock;
  readonly CheckCircle2 = CheckCircle2;
  readonly ArrowRight = ArrowRight;
  readonly Loader2 = Loader2;

  onProceed(): void {
    if (!this.isDone || this.submitting()) return;
    this.submitting.set(true);
    this.proceed.emit();
  }

  get isDone(): boolean {
    return this.data.status === 'license-accept';
  }
}
