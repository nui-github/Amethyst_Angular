import { Injectable, signal } from '@angular/core';
import { Direction } from '@app/core/models/types';
import { MOCK_OCR_RESULT, OcrResult } from '@mock/ocr.mock';
import { MOCK_INVOICE_OCR_RESULT, MOCK_INVOICE_OCR_RESULTS, InvoiceOcrResult } from '@mock/invoice-ocr.mock';
import { MOCK_EXPORT_OCR_RESULT, ExportOcrResult } from '@mock/export-ocr.mock';
import { MOCK_EXPORT_INVOICE_OCR_RESULT, MOCK_EXPORT_INVOICE_OCR_RESULTS, ExportInvoiceOcrResult } from '@mock/export-invoice-ocr.mock';
import { MOCK_PETROLEUM_DUTY_OCR_RESULT } from '@mock/petroleum-duty.mock';

const OCR_STAGES = ['อ่านเอกสาร', 'วิเคราะห์ข้อมูล', 'ตรวจสอบ HS Code', 'ร่างคำขอ'];

// Demo/QA hook: name the uploaded file with this substring (case-insensitive) to simulate a
// file that bundles more than one commercial invoice — e.g. "Combined_Invoice_MULTI.pdf".
// Mirrors the KNOWN_REFS-style trigger convention used elsewhere (spn.mock.ts).
const MULTI_INVOICE_TRIGGER = 'multi';

// Demo/QA hook, same convention as MULTI_INVOICE_TRIGGER above: name the uploaded ใบขนขาเข้า file
// with this substring (case-insensitive) — e.g. "ใบขน_PETROLEUM.xml" — to simulate a petroleum
// duty-exemption ("ขอออกของไปก่อน") declaration instead of an ordinary customs-only upload.
const PETROLEUM_DUTY_TRIGGER = 'petroleum';

export interface MultiInvoiceDetection {
  multiInvoice: true;
  invoices: (InvoiceOcrResult | ExportInvoiceOcrResult)[];
}

export interface PetroleumDutyDetection {
  petroleumDutyExemption: true;
  data: typeof MOCK_PETROLEUM_DUTY_OCR_RESULT;
}

@Injectable({ providedIn: 'root' })
export class OcrService {
  readonly progress    = signal(0);
  readonly stages      = signal<string[]>([]);
  readonly isOCRing    = signal(false);

  reset(): void {
    this.progress.set(0);
    this.stages.set([]);
    this.isOCRing.set(false);
  }

  async startOCR(
    _files?: unknown[],
    variant: 'default' | 'invoice' = 'default',
    direction: Direction = 'import',
  ): Promise<OcrResult | InvoiceOcrResult | MultiInvoiceDetection | ExportOcrResult | ExportInvoiceOcrResult | PetroleumDutyDetection> {
    this.reset();
    this.isOCRing.set(true);

    for (let i = 0; i < OCR_STAGES.length; i++) {
      await this.delay(700);
      this.progress.set(Math.round(((i + 1) / OCR_STAGES.length) * 100));
      this.stages.update(s => [...s, OCR_STAGES[i]]);
    }

    this.isOCRing.set(false);

    if (direction === 'export') {
      if (variant === 'invoice') {
        const files = (_files ?? []) as { name?: string }[];
        const isMulti = files.some(f => (f?.name ?? '').toLowerCase().includes(MULTI_INVOICE_TRIGGER));
        if (isMulti) return { multiInvoice: true, invoices: MOCK_EXPORT_INVOICE_OCR_RESULTS };
        return MOCK_EXPORT_INVOICE_OCR_RESULT;
      }
      return MOCK_EXPORT_OCR_RESULT;
    }

    if (variant === 'invoice') {
      const files = (_files ?? []) as { name?: string }[];
      const isMulti = files.some(f => (f?.name ?? '').toLowerCase().includes(MULTI_INVOICE_TRIGGER));
      if (isMulti) return { multiInvoice: true, invoices: MOCK_INVOICE_OCR_RESULTS };
      return MOCK_INVOICE_OCR_RESULT;
    }

    // Customs-only single-upload (import direction) only — see PETROLEUM_DUTY_TRIGGER above.
    const files = (_files ?? []) as { name?: string }[];
    const isPetroleumDuty = files.some(f => (f?.name ?? '').toLowerCase().includes(PETROLEUM_DUTY_TRIGGER));
    if (isPetroleumDuty) return { petroleumDutyExemption: true, data: MOCK_PETROLEUM_DUTY_OCR_RESULT };
    return MOCK_OCR_RESULT;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
  }
}
