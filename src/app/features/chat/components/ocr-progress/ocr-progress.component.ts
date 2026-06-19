import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Check, FileText, Ship, FlaskConical, BadgeCheck } from 'lucide-angular';

const STAGE_ICONS = [FileText, Ship, FlaskConical, BadgeCheck];
const STAGE_LABELS = ['อ่านเอกสาร', 'วิเคราะห์ข้อมูล', 'ตรวจสอบ HS Code', 'ร่างคำขอ'];

@Component({
  selector: 'app-ocr-progress',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="ocr-wrap">
      <p class="ocr-title">กำลัง OCR และวิเคราะห์เอกสาร...</p>

      <!-- Stage rows -->
      <div class="ocr-stages">
        @for (label of allLabels; track label; let i = $index) {
          <div class="stage-row" [class.stage-row--done]="isDone(i)" [class.stage-row--active]="isActive(i)">
            <span class="stage-icon">
              @if (isDone(i)) {
                <lucide-icon [img]="Check" [size]="13" color="#0D8F61" />
              } @else {
                <lucide-icon [img]="stageIcons[i]" [size]="13" [color]="isActive(i) ? '#0463EF' : '#CCCCCC'" />
              }
            </span>
            <span class="stage-label">{{ label }}</span>
            @if (isActive(i)) {
              <span class="stage-dots">
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
              </span>
            }
          </div>
        }
      </div>

      <!-- Progress bar -->
      <div class="ocr-bar-track">
        <div class="ocr-fill" [style.width.%]="progress"></div>
      </div>
      <p class="ocr-pct">{{ progress }}%</p>
    </div>
  `,
  styleUrl: './ocr-progress.component.scss',
})
export class OcrProgressComponent {
  @Input() progress = 0;
  @Input() stages: string[] = [];

  readonly allLabels = STAGE_LABELS;
  readonly stageIcons = STAGE_ICONS;
  readonly Check = Check;

  isDone(i: number): boolean { return i < this.stages.length; }
  isActive(i: number): boolean { return i === this.stages.length && i < this.allLabels.length; }
}
