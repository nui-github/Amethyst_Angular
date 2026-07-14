import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, FileCheck2, FileText, Download } from 'lucide-angular';
import { AgencyDocsReturnedData, AgencyReturnDoc } from '@app/core/models/types';

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
              <button class="adr-row__dl" (click)="download(doc)">
                <lucide-icon [img]="Download" [size]="12" /> ดาวน์โหลด
              </button>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .adr-title { display:flex;align-items:center;gap:6px;font-size:13px;font-weight:700;color:#0D8F61;margin:0 0 4px }
    .adr-row__label { display:flex;align-items:center;gap:7px;color:var(--bizx-navy) !important;font-weight:600 }
    .adr-row__dl {
      display:flex;align-items:center;gap:4px;
      border:none;background:none;padding:2px 4px;border-radius:6px;cursor:pointer;
      font-size:11px;font-weight:600;color:var(--bizx-blue);font-family:inherit;flex-shrink:0;
      &:hover { background:rgba(4,99,239,0.08); }
    }
  `],
})
export class AgencyDocsReturnedComponent {
  @Input({ required: true }) data!: AgencyDocsReturnedData;
  readonly FileCheck2 = FileCheck2;
  readonly FileText = FileText;
  readonly Download = Download;

  download(doc: AgencyReturnDoc): void {
    window.open(doc.url, '_blank', 'noopener');
  }
}
