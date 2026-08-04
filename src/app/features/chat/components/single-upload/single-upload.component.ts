import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { ChatService } from '@app/core/services/chat.service';

@Component({
  selector: 'app-single-upload',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NzButtonModule],
  templateUrl: './single-upload.component.html',
  styleUrl: './single-upload.component.scss',
})
export class SingleUploadComponent {
  @Input() mode: 'customs' | 'invoice' | 'agency-docs' = 'customs';
  @Input() direction: 'import' | 'export' = 'import';

  readonly chat = inject(ChatService);
  readonly cdr  = inject(ChangeDetectorRef);

  // Unique per instance — more than one single-upload card can be mounted at once in chat
  // history (e.g. the original customs upload plus a later forced re-upload for เชื้อเพลิง's
  // XML gate), and a duplicate DOM id makes the label's implicit `for` target the FIRST
  // matching input instead of this instance's own, so clicking a later box's dropzone silently
  // opens (or does nothing to) the wrong one.
  private static nextId = 0;
  readonly fileInputId = `su_file_${SingleUploadComponent.nextId++}`;

  file     = signal<File | null>(null);
  dragging = signal(false);

  onFileChange(event: Event): void {
    const f = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.file.set(f);
    this.cdr.markForCheck();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    const f = event.dataTransfer?.files?.[0] ?? null;
    if (f) { this.file.set(f); this.cdr.markForCheck(); }
  }

  onDragOver(event: DragEvent): void { event.preventDefault(); this.dragging.set(true); }
  onDragLeave(): void { this.dragging.set(false); }
  clear(): void { this.file.set(null); }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  readonly started = signal(false);

  startOCR(): void {
    const f = this.file();
    if (f && !this.started()) {
      this.started.set(true);
      this.chat.startOCR([f]);
    }
  }
}
