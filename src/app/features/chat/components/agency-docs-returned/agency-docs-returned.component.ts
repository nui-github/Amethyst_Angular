import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, FileCheck2, FileText } from 'lucide-angular';
import { AgencyDocsReturnedData } from '@app/core/models/types';

@Component({
  selector: 'app-agency-docs-returned',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="adr-wrap">
      <p class="adr-title">
        <lucide-icon [img]="FileCheck2" [size]="16" color="#0D8F61" />
        {{ data.agency }}ส่งเอกสารกลับมาให้แล้วครับ
      </p>
      <div class="info-card" style="margin-top:0">
        <div class="info-card__head">เอกสารที่ได้รับ</div>
        <div class="info-card__body">
          @for (doc of data.docs; track doc.key) {
            <div class="info-card__row adr-row">
              <span class="adr-row__label">
                <lucide-icon [img]="FileText" [size]="13" color="#0463EF" />
                {{ doc.label }}
              </span>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .adr-title { display:flex;align-items:center;gap:6px;font-size:13px;font-weight:700;color:#0D8F61;margin:0 0 4px }
    .adr-row { justify-content:flex-start !important }
    .adr-row__label { display:flex;align-items:center;gap:7px;color:var(--bizx-navy) !important;font-weight:600 }
  `],
})
export class AgencyDocsReturnedComponent {
  @Input({ required: true }) data!: AgencyDocsReturnedData;
  readonly FileCheck2 = FileCheck2;
  readonly FileText = FileText;
}
