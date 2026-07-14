import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { LucideAngularModule, FileText, ScrollText, Award, ShieldCheck, Upload, X } from 'lucide-angular';
import { ChatService } from '@app/core/services/chat.service';

interface Slot {
  key: string;
  label: string;
  icon: unknown;
  color: string;
  file: File | null;
}

@Component({
  selector: 'app-full-upload',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NzButtonModule, LucideAngularModule],
  templateUrl: './full-upload.component.html',
  styleUrl: './full-upload.component.scss',
})
export class FullUploadComponent {
  readonly chat = inject(ChatService);
  readonly cdr  = inject(ChangeDetectorRef);
  readonly Upload = Upload;
  readonly X      = X;

  // Re-upload fallback used for both directions (e.g. "แก้ไขเอกสารเพิ่มเติม" after form-preview on
  // the invoice-first path) — labels swap "ใบขนสินค้า"/"ใบอนุญาตผู้นำเข้า" for the export side, same
  // as single-upload's `direction` input.
  slots = signal<Slot[]>([
    { key: 'invoice',  label: 'ใบ Invoice',                     icon: ScrollText,  color: '#0463EF', file: null },
    { key: 'customs',  label: this.chat.direction() === 'export' ? 'ใบขนส่งออก' : 'ใบขนสินค้า', icon: FileText, color: '#0D8F61', file: null },
    { key: 'coa',      label: 'Certificate of Analysis (CoA)',   icon: Award,       color: '#7C3AED', file: null },
    { key: 'ulicense', label: this.chat.direction() === 'export' ? 'ใบอนุญาตผู้ส่งออก' : 'ใบอนุญาตผู้นำเข้า', icon: ShieldCheck, color: '#B45309', file: null },
  ]);

  readonly hasAny = () => this.slots().some(s => s.file !== null);
  readonly started = signal(false);

  onFileChange(key: string, event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.slots.update(slots => slots.map(s => s.key === key ? { ...s, file } : s));
    this.cdr.markForCheck();
  }

  clearSlot(key: string): void {
    this.slots.update(slots => slots.map(s => s.key === key ? { ...s, file: null } : s));
  }

  startOCR(): void {
    if (this.started()) return;
    this.started.set(true);
    const files = this.slots().filter(s => s.file).map(s => s.file!);
    this.chat.startOCR(files);
  }
}
