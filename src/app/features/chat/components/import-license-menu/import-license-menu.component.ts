import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, FileText, ScrollText, ChevronRight } from 'lucide-angular';
import { ChatService } from '@app/core/services/chat.service';
import { Direction } from '@app/core/models/types';

/**
 * 2-card menu shown after the welcome card, when an SPN ref is not found, or (export path)
 * right after choosing "เอกสารส่งออกสินค้า" — same component either way, `data.direction` just
 * swaps the "ใบขนสินค้า"/"ใบขนส่งออก" card copy; both cards call the same ChatService methods,
 * which read `chat.direction()` themselves to behave correctly for either side.
 */
@Component({
  selector: 'app-import-license-menu',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <p class="menu-q">เลือกวิธีเริ่มต้นขอใบอนุญาตครับ</p>

    <button class="doc-card" (click)="chat.chooseCustomsDocs()">
      <span class="doc-card__icon doc-card__icon--blue">
        <lucide-icon [img]="icFile" [size]="18" />
      </span>
      <span class="doc-card__body">
        <span class="doc-card__title">{{ isExport ? 'ใบขนส่งออก' : 'ใบขนสินค้า' }}</span>
        <span class="doc-card__sub">อัปโหลดใบขนฯ + เอกสารประกอบ — AI OCR ดึงข้อมูลทั้งหมด</span>
      </span>
      <lucide-icon [img]="icChevron" [size]="16" class="doc-card__chev" />
    </button>

    <button class="doc-card" (click)="chat.chooseInvoiceFirst()">
      <span class="doc-card__icon doc-card__icon--teal">
        <lucide-icon [img]="icInvoice" [size]="18" />
      </span>
      <span class="doc-card__body">
        <span class="doc-card__title">ใบ Invoice</span>
        <span class="doc-card__sub">เริ่มจาก Invoice — AI วิเคราะห์แล้วแจ้งว่าขาดข้อมูลอะไรเพิ่ม</span>
      </span>
      <lucide-icon [img]="icChevron" [size]="16" class="doc-card__chev" />
    </button>
  `,
  styleUrl: './import-license-menu.component.scss',
})
export class ImportLicenseMenuComponent {
  @Input() data?: { direction?: Direction };

  readonly chat = inject(ChatService);
  readonly icFile    = FileText;
  readonly icInvoice = ScrollText;
  readonly icChevron = ChevronRight;

  get isExport(): boolean { return this.data?.direction === 'export'; }
}
