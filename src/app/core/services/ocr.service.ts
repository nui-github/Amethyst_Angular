import { Injectable, signal } from '@angular/core';
import { MOCK_OCR_RESULT, OcrResult } from '@mock/ocr.mock';

const OCR_STAGES = ['อ่านเอกสาร', 'วิเคราะห์ข้อมูล', 'ตรวจสอบ HS Code', 'ร่างคำขอ'];

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

  async startOCR(_files?: unknown[]): Promise<OcrResult> {
    this.reset();
    this.isOCRing.set(true);

    for (let i = 0; i < OCR_STAGES.length; i++) {
      await this.delay(700);
      this.progress.set(Math.round(((i + 1) / OCR_STAGES.length) * 100));
      this.stages.update(s => [...s, OCR_STAGES[i]]);
    }

    this.isOCRing.set(false);
    return MOCK_OCR_RESULT;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
  }
}
