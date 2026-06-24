import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { ChatService } from '@app/core/services/chat.service';
import { AgencyDoc, getAgencyDocs } from '@mock/agency-docs.mock';

interface DocSlot {
  doc: AgencyDoc;
  file: File | null;
  dragging: boolean;
}

@Component({
  selector: 'app-agency-upload',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NzButtonModule],
  template: `
    <div class="au-wrap">
      <div class="au-header">
        <p class="au-title">เอกสารที่ต้องอัปโหลด</p>
        <p class="au-sub">AI วิเคราะห์ว่าต้องใช้เอกสารเหล่านี้สำหรับการขออนุญาตจาก <strong>{{ agency }}</strong></p>
      </div>

      <div class="au-slots">
        @for (slot of slots; track slot.doc.key) {
          <div class="au-slot" [class.au-slot--filled]="!!slot.file" [class.au-slot--drag]="slot.dragging"
            (dragover)="onDragOver($event, slot)" (dragleave)="slot.dragging = false; cdr.detectChanges()"
            (drop)="onDrop($event, slot)">
            <div class="au-slot__head">
              <span class="au-slot__label">{{ slot.doc.label }}</span>
              @if (slot.doc.required) {
                <span class="au-required">จำเป็น</span>
              } @else {
                <span class="au-optional">ไม่บังคับ</span>
              }
            </div>
            <p class="au-slot__hint">{{ slot.doc.hint }}</p>

            @if (!slot.file) {
              <label class="au-drop" [for]="'au_' + slot.doc.key">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0463EF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <span>คลิกหรือลากไฟล์</span>
                <input [id]="'au_' + slot.doc.key" type="file" accept=".pdf,.jpg,.jpeg,.png"
                  style="display:none" (change)="onFileChange($event, slot)" />
              </label>
            } @else {
              <div class="au-file-row">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0D8F61" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <span class="au-file-name">{{ slot.file.name }}</span>
                <span class="au-file-size">{{ formatSize(slot.file.size) }}</span>
                <button class="au-clear" (click)="clearSlot(slot)">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </button>
              </div>
            }
          </div>
        }
      </div>

      <button nz-button nzType="primary" nzBlock class="au-btn"
        [disabled]="!hasRequiredFiles() || submitted()"
        (click)="startOCR()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        {{ submitted() ? 'กำลังประมวลผล...' : 'เริ่ม OCR และตรวจสอบเอกสาร' }}
      </button>
    </div>
  `,
  styleUrl: './agency-upload.component.scss',
})
export class AgencyUploadComponent {
  @Input() set agency(val: string) {
    this._agency = val;
    this.slots = getAgencyDocs(val).map(doc => ({ doc, file: null, dragging: false }));
    this.cdr.detectChanges();
  }
  get agency(): string { return this._agency; }
  private _agency = 'อย.';

  readonly chat      = inject(ChatService);
  readonly cdr       = inject(ChangeDetectorRef);
  readonly submitted = signal(false);

  slots: DocSlot[] = getAgencyDocs('อย.').map(doc => ({ doc, file: null, dragging: false }));

  onFileChange(event: Event, slot: DocSlot): void {
    const f = (event.target as HTMLInputElement).files?.[0] ?? null;
    slot.file = f;
    this.cdr.detectChanges();
  }

  onDragOver(event: DragEvent, slot: DocSlot): void {
    event.preventDefault();
    slot.dragging = true;
    this.cdr.detectChanges();
  }

  onDrop(event: DragEvent, slot: DocSlot): void {
    event.preventDefault();
    slot.dragging = false;
    const f = event.dataTransfer?.files?.[0] ?? null;
    if (f) { slot.file = f; this.cdr.detectChanges(); }
  }

  clearSlot(slot: DocSlot): void {
    slot.file = null;
    this.cdr.detectChanges();
  }

  hasRequiredFiles(): boolean {
    return this.slots.filter(s => s.doc.required).every(s => !!s.file);
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  startOCR(): void {
    if (!this.hasRequiredFiles() || this.submitted()) return;
    this.submitted.set(true);
    this.cdr.detectChanges();
    const files = this.slots.filter(s => !!s.file).map(s => s.file!);
    this.chat.startOCR(files);
  }
}
