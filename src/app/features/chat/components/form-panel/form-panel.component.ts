import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { LucideAngularModule, Eye } from 'lucide-angular';
import { ChatService } from '@app/core/services/chat.service';

interface FormField {
  key: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  type?: 'text' | 'date';
}

const FIELDS: FormField[] = [
  { key: 'invoiceNo',     label: 'Invoice No.',           type: 'text' },
  { key: 'invoiceDate',   label: 'Invoice Date',          type: 'text' },
  { key: 'importer',      label: 'ผู้นำเข้า',              type: 'text' },
  { key: 'port',          label: 'ท่าเรือ',                type: 'text' },
  { key: 'hsCode',        label: 'HS Code',               type: 'text' },
  { key: 'countryOrigin', label: 'ประเทศต้นทาง',          type: 'text' },
  { key: 'quantity',      label: 'ปริมาณ (กิโลกรัม)',     type: 'text' },
  { key: 'lotNo',         label: 'Lot No.',               type: 'text' },
  { key: 'uNo',           label: 'U No.',                 type: 'text' },
  { key: 'importDate',    label: 'วันที่นำเข้า *',        type: 'text', required: true, placeholder: 'DD/MM/YYYY' },
  { key: 'drugRegNo',     label: 'เลขทะเบียนยา *',       type: 'text', required: true, placeholder: 'กรอกเลขทะเบียนยา' },
];

@Component({
  selector: 'app-form-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, NzInputModule, NzButtonModule, LucideAngularModule],
  templateUrl: './form-panel.component.html',
  styleUrl: './form-panel.component.scss',
})
export class FormPanelComponent {
  readonly chat   = inject(ChatService);
  readonly Eye    = Eye;
  readonly fields = FIELDS;

  readonly fd = computed(() => this.chat.formData());

  readonly canPreview = computed(() => {
    const fd = this.fd();
    return !!fd.importDate?.trim() && !!fd.drugRegNo?.trim();
  });

  getValue(key: string): string {
    return (this.fd() as Record<string, string | undefined>)[key] ?? '';
  }

  isFilled(key: string): boolean {
    return !!this.getValue(key).trim();
  }

  isRequired(key: string): boolean {
    return FIELDS.find(f => f.key === key)?.required ?? false;
  }

  onInput(key: string, value: string): void {
    this.chat.formData.update(fd => ({ ...fd, [key]: value }));
  }

  preview(): void {
    this.chat.onPreviewChoice('submit');
  }
}
