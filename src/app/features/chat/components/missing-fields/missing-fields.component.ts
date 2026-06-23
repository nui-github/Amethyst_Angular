import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component,
  Input, OnInit, inject, signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { LucideAngularModule, AlertCircle, Upload, CheckCircle } from 'lucide-angular';
import { ChatService } from '@app/core/services/chat.service';
import { LicenseFormData, MissingField, MissingFieldsData } from '@app/core/models/types';

export type { MissingField, MissingFieldsData };

@Component({
  selector: 'app-missing-fields',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, NzInputModule, NzButtonModule, LucideAngularModule],
  templateUrl: './missing-fields.component.html',
  styleUrl: './missing-fields.component.scss',
})
export class MissingFieldsComponent implements OnInit {
  @Input({ required: true }) data!: MissingFieldsData;

  readonly chat    = inject(ChatService);
  readonly cdr     = inject(ChangeDetectorRef);
  readonly IconAlert  = AlertCircle;
  readonly IconUpload = Upload;
  readonly IconCheck  = CheckCircle;

  values: Record<string, string> = {};
  uploadFile = signal<File | null>(null);
  dragging   = signal(false);
  submitted  = signal(false);

  ngOnInit(): void {
    // Pre-fill from existing data
    for (const f of this.data.missingFields) {
      this.values[f.key] = (this.data.existingData as Record<string, string>)[f.key] ?? '';
    }
  }

  get canSubmit(): boolean {
    return this.data.missingFields.every(f => this.values[f.key]?.trim());
  }

  onFileChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.uploadFile.set(file);
    this.cdr.markForCheck();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    const file = event.dataTransfer?.files?.[0] ?? null;
    if (file) { this.uploadFile.set(file); this.cdr.markForCheck(); }
  }

  clearFile(): void { this.uploadFile.set(null); }

  formatSize(bytes: number): string {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  submitWithUpload(): void {
    if (this.submitted()) return;
    this.submitted.set(true);
    const extra: LicenseFormData = {};
    for (const f of this.data.missingFields) {
      if (this.values[f.key]?.trim()) {
        (extra as Record<string, string>)[f.key] = this.values[f.key].trim();
      }
    }
    const file = this.uploadFile();
    this.chat.onMissingFieldsSubmit(extra, file ?? undefined, this.data.round);
  }
}
