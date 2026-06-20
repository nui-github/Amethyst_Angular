import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HsAnalysisData } from '@app/core/models/types';

@Component({
  selector: 'app-hs-analysis',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './hs-analysis.component.html',
  styleUrl: './hs-analysis.component.scss',
})
export class HsAnalysisComponent {
  @Input({ required: true }) data!: HsAnalysisData;

  get d(): HsAnalysisData { return this.data; }

  get confidenceColor(): string {
    return this.d.confidence >= 90 ? '#0D8F61' : this.d.confidence >= 75 ? '#B45309' : '#EF4444';
  }

  get confidenceBg(): string {
    return this.d.confidence >= 90
      ? 'rgba(13,143,97,0.1)'
      : this.d.confidence >= 75
      ? 'rgba(180,83,9,0.1)'
      : 'rgba(239,68,68,0.1)';
  }

  get directionLabel(): string {
    return { import: 'ขาเข้า', export: 'ขาออก', both: 'ขาเข้า/ออก' }[this.d.direction];
  }
}
