import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

const STAGE_DEFS = [
  { label: 'อ่านเอกสาร',       desc: 'สแกนและแปลงไฟล์' },
  { label: 'วิเคราะห์ข้อมูล',  desc: 'ดึงข้อมูลสำคัญจากเอกสาร' },
  { label: 'ตรวจสอบ HS Code',  desc: 'จำแนกพิกัดศุลกากร' },
  { label: 'ร่างคำขอ',         desc: 'สร้างร่างใบอนุญาตอัตโนมัติ' },
];

// Inline SVG paths for each stage (avoids lucide import issues)
const STAGE_ICONS = [
  // File text
  `<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>`,
  // Scan / search
  `<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="3"/>`,
  // Tag
  `<path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/>`,
  // File check
  `<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="m9 15 2 2 4-4"/>`,
];

@Component({
  selector: 'app-ocr-progress',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './ocr-progress.component.html',
  styleUrl: './ocr-progress.component.scss',
})
export class OcrProgressComponent {
  @Input() progress = 0;
  @Input() stages: string[] = [];

  readonly stageDefs = STAGE_DEFS;
  readonly stageIcons = STAGE_ICONS;

  isDone(i: number): boolean    { return i < this.stages.length; }
  isActive(i: number): boolean  { return i === this.stages.length && i < this.stageDefs.length; }
  isPending(i: number): boolean { return i > this.stages.length; }
}
