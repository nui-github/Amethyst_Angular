import { Injectable, computed, signal } from '@angular/core';
import {
  ChatMessage, ChatStep, LicenseFormData, MessageType,
  FlagCardData, FlagItem, ChoiceCardData, EmailDraftData,
  StatusCardData, OcrResultsData, SpnResultData, Shipment,
} from '@app/core/models/types';
import { OcrService } from './ocr.service';
import { QueueService } from './queue.service';
import { KNOWN_REFS, MOCK_FORM_DATA, MOCK_SPN_LIST } from '@mock/spn.mock';
import { environment } from '@env/environment';

let _idCounter = 0;
const genId = () => `msg_${Date.now()}_${_idCounter++}`;
const getTime = () => new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

const WELCOME: ChatMessage = {
  id: 'welcome', role: 'bot', type: 'welcome', time: '09:00',
};

@Injectable({ providedIn: 'root' })
export class ChatService {
  // ── State ──────────────────────────────────────────────────────────────────
  readonly messages        = signal<ChatMessage[]>([WELCOME]);
  readonly isTyping        = signal(false);
  readonly spnSession      = signal<{ companyName: string; url: string; username: string } | null>(null);
  readonly step            = signal<ChatStep>('idle');
  readonly isConnected     = signal(false);
  readonly pendingRef      = signal('');
  readonly formData        = signal<LicenseFormData>({});
  readonly submittedRefNo  = signal('');
  readonly spnEntries      = signal(MOCK_SPN_LIST);
  readonly sidebarActive   = signal<'chatbot' | 'queue'>('chatbot');
  readonly sidebarCollapsed = signal(false);

  readonly needsYouCount = computed(() => this.queue.needsYouCount());

  private flowStartIdx = 0;
  private flagGen = 0;
  private emailGen = 0;

  constructor(
    private readonly ocr: OcrService,
    private readonly queue: QueueService,
  ) {}

  // ── Navigation ─────────────────────────────────────────────────────────────
  setSidebarActive(page: 'chatbot' | 'queue'): void {
    this.sidebarActive.set(page);
  }

  goToQueue(id: string): void {
    this.queue.open(id);
    this.setSidebarActive('queue');
  }

  // ── Message helpers ────────────────────────────────────────────────────────
  private addMsg(role: ChatMessage['role'], type: MessageType,
    payload: Pick<ChatMessage, 'content' | 'data'> = {}): ChatMessage {
    const m: ChatMessage = { id: genId(), role, type, time: getTime(), ...payload };
    this.messages.update(ms => [...ms, m]);
    return m;
  }

  private bot(type: MessageType, data?: unknown, content?: string): void {
    this.addMsg('bot', type, { data, content });
  }

  private user(text: string): void {
    this.addMsg('user', 'text', { content: text });
  }

  private withTyping(fn: () => void, delay = 900): void {
    this.isTyping.set(true);
    setTimeout(() => { this.isTyping.set(false); fn(); }, delay);
  }

  private markFlowStart(): void {
    this.flowStartIdx = this.messages().length;
  }

  // ── Send message (main entry point) ───────────────────────────────────────
  send(text: string): void {
    if (!text.trim()) return;
    const lower = text.toLowerCase();
    this.user(text);

    const refMatch = text.match(/HTHM\d+/i);

    if (refMatch && (lower.includes('สร้าง') || lower.includes('rgoods'))) {
      const ref = refMatch[0].toUpperCase();
      if (!this.isConnected()) {
        this.pendingRef.set(ref);
        this.withTyping(() => this.showConnect(), 400);
      } else {
        this.withTyping(() => this.fetchSPN(ref), 400);
      }
    } else if ((lower.includes('สร้าง') && lower.includes('rgoods')) || lower === 'สร้าง rgoods') {
      if (!this.isConnected()) {
        this.withTyping(() => this.showConnect(), 400);
      } else {
        this.withTyping(() => this.showSPNList(), 400);
      }
    } else if (lower.includes('พิมพ์ใบอนุญาต')) {
      this.openPrintPage();
    } else if (lower.includes('อัปโหลด') || lower.includes('upload')) {
      this.withTyping(() => this.showFullUpload(), 500);
    } else if (refMatch && this.step() === 'idle') {
      if (!this.isConnected()) {
        this.pendingRef.set(refMatch[0].toUpperCase());
        this.withTyping(() => this.showConnect(), 400);
      } else {
        this.withTyping(() => this.fetchSPN(refMatch[0].toUpperCase()), 400);
      }
    } else {
      this.withTyping(() => this.bot('text', undefined,
        'ขอโทษครับ ไม่เข้าใจคำสั่ง — ลองพิมพ์ ref ใบขน (HTHM...) หรือพิมพ์ "สร้าง RGoods" ครับ'
      ), 700);
    }
  }

  // ── SPN new connect flow ───────────────────────────────────────────────────

  /** Show the multi-step SPN connect card (Company → URL → Login) */
  showSpnConnect(): void {
    this.bot('spn-connect');
  }

  /** Called by SpnConnectComponent after successful login */
  onSpnConnected(companyName: string, url: string, username: string): void {
    this.isConnected.set(true);
    this.spnSession.set({ companyName, url, username });
    // After success, fetch the SPN list
    this.withTyping(() => {
      this.bot('text', undefined, `เชื่อมต่อ ${companyName} สำเร็จแล้วครับ — กำลังดึงรายการใบขนสินค้า...`);
      setTimeout(() => this.showSPNList(), 800);
    }, 600);
  }

  // ── Legacy connect flow (kept for fallback) ────────────────────────────────
  private showConnect(): void {
    this.showSpnConnect();
  }

  onConnected(ref: string): void {
    this.isConnected.set(true);
    if (ref) {
      this.withTyping(() => this.fetchSPN(ref), 600);
    } else {
      this.withTyping(() => this.showSPNList(), 600);
    }
  }

  disconnect(): void {
    this.isConnected.set(false);
    this.spnSession.set(null);
    this.withTyping(() => this.bot('text', undefined, 'ตัดการเชื่อมต่อ ShippingNet เรียบร้อยแล้ว'), 300);
  }

  // ── SPN flow ───────────────────────────────────────────────────────────────
  showSPNList(): void {
    this.markFlowStart();
    this.bot('spn-list');
  }

  private async fetchSPN(ref: string): Promise<void> {
    this.markFlowStart();
    this.bot('text', undefined, `กำลังดึงข้อมูลจาก ShippingNet สำหรับ ${ref}...`);
    this.isTyping.set(true);

    await this.delay(environment.useMock ? 1200 : 0);
    this.isTyping.set(false);

    const found = KNOWN_REFS.includes(ref);
    if (!found) {
      this.spnNotFound(ref);
      return;
    }
    const data: LicenseFormData = { ...MOCK_FORM_DATA, ref };
    this.formData.set(data);
    this.step.set('upload');
    this.bot('spn-result', {
      ref, importer: data.importer, port: data.port,
      declarationDate: data.declarationDate, hsCode: data.hsCode,
      countryOrigin: data.countryOrigin, licenseType: data.licenseType,
    } satisfies SpnResultData);
  }

  private spnNotFound(ref: string): void {
    this.formData.update(f => ({ ...f, ref, licenseType: 'RGoods' }));
    this.step.set('not_found');
    this.bot('spn-not-found');
  }

  // ── Import license menu (entry from welcome card) ──────────────────────────
  openImportLicenseMenu(): void {
    this.user('ขอใบอนุญาตนำเข้า (อย.)');
    this.withTyping(() => this.bot('import-license-menu'), 500);
  }

  // ── Document choice flows ──────────────────────────────────────────────────

  /** ใบขนสินค้า: ask user whether to connect SPN or upload manually */
  chooseCustomsDocs(): void {
    this.user('ใบขนสินค้า');
    this.markFlowStart();
    this.withTyping(() => {
      this.bot('choice-card', {
        question: 'ต้องการดึงข้อมูลจาก ShippingNet หรืออัปโหลดเอกสารเองครับ?',
        options: [
          { label: 'ดึงข้อมูลจาก ShippingNet', value: 'spn',    description: 'ต้องมี account SPN — ระบบจะดึงข้อมูลใบขนให้อัตโนมัติ' },
          { label: 'อัปโหลดเอกสารเอง',          value: 'upload', description: 'AI OCR ดึงข้อมูลจากไฟล์ที่อัปโหลด ไม่ต้องมี SPN' },
        ],
      } satisfies import('@app/core/models/types').ChoiceCardData);
    }, 400);
  }

  /** Handle the SPN vs Upload choice from chooseCustomsDocs */
  onCustomsDocsChoice(value: string): void {
    if (value === 'spn') {
      this.user('ดึงข้อมูลจาก ShippingNet');
      this.withTyping(() => this.showSpnConnect(), 400);
    } else {
      this.user('อัปโหลดเอกสารเอง');
      this.withTyping(() => { this.step.set('invoice_upload'); this.bot('single-upload'); }, 400);
    }
  }

  chooseInvoiceFirst(): void {
    this.user('ใบ Invoice');
    this.markFlowStart();
    this.withTyping(() => { this.step.set('invoice_upload'); this.bot('full-upload'); }, 400);
  }

  chooseFullUpload(): void {
    this.user('เอกสารชุดสำหรับการขอใบอนุญาตนำเข้า');
    this.markFlowStart();
    this.step.set('full_upload');
    this.bot('full-upload');
  }

  private showFullUpload(): void {
    this.markFlowStart();
    this.step.set('full_upload');
    this.bot('full-upload');
  }

  // ── OCR flow ───────────────────────────────────────────────────────────────
  async startOCR(_files?: unknown[]): Promise<void> {
    this.step.set('ocr');
    this.bot('ocr-progress');
    const result = await this.ocr.startOCR(_files);
    this.formData.update(f => ({ ...f, ...result }));
    this.showOCRResults(result);
  }

  private showOCRResults(result: typeof import('@mock/ocr.mock').MOCK_OCR_RESULT): void {
    this.bot('ocr-results', {
      invoiceNo: result.invoiceNo, invoiceDate: result.invoiceDate,
      quantity: result.quantity, importer: result.importer, port: result.port,
      hsCode: result.hsCode, countryOrigin: result.countryOrigin,
      lotNo: result.lotNo, uNo: result.uNo,
    } satisfies OcrResultsData);
    this.withTyping(() => this.showFlags(), 800);
  }

  // ── Flag confirm flow ──────────────────────────────────────────────────────
  private showFlags(): void {
    this.step.set('form');
    const gen = ++this.flagGen;
    const flags: FlagItem[] = [
      {
        id: `fg${gen}_qty`, title: 'ปริมาณไม่ตรงกัน',
        detail: 'Invoice: 250 กก. / Packing List: 248.5 กก. — กรุณาระบุปริมาณที่ถูกต้อง',
        conf: 72, inputType: 'qty',
        qtyOptions: ['250 กิโลกรัม', '248.5 กิโลกรัม', 'อื่นๆ'],
        confirmedValue: null, isConfirmed: false,
      },
      {
        id: `fg${gen}_gmp`, title: 'เลขใบรับรอง GMP อ่านไม่ชัด',
        detail: '3 ตัวท้ายไม่ชัดเจน — กรุณากรอกเลข GMP ที่ถูกต้อง',
        conf: 65, inputType: 'text',
        confirmedValue: null, isConfirmed: false,
      },
    ];
    this.bot('flag-card', { flags, gen } satisfies FlagCardData);
  }

  confirmFlag(msgId: string, flagId: string, value: string): void {
    this.messages.update(ms => ms.map(m => {
      if (m.id !== msgId || m.type !== 'flag-card') return m;
      const data = m.data as FlagCardData;
      return {
        ...m,
        data: {
          ...data,
          flags: data.flags.map(f =>
            f.id === flagId ? { ...f, confirmedValue: value, isConfirmed: true } : f
          ),
        },
      };
    }));
  }

  onAllFlagsConfirmed(): void {
    this.user('ยืนยันข้อมูลทั้งหมดแล้ว');
    this.withTyping(() => this.showProceedChoice(), 700);
  }

  private showProceedChoice(): void {
    this.bot('choice-card', {
      question: 'ต้องการดำเนินการอะไรต่อไปครับ?',
      options: [
        { label: 'ต้องการส่งอีเมล', value: 'email', description: 'ส่งร่างเอกสารให้ลูกค้าตรวจสอบก่อน' },
        { label: 'ตรวจสอบข้อมูลก่อนส่งกรม', value: 'preview', description: 'ดูพรีวิวร่างใบอนุญาตและยืนยัน' },
      ],
    } satisfies ChoiceCardData);
  }

  onProceedChoice(value: string): void {
    this.user(value === 'email' ? 'ต้องการส่งอีเมล' : 'ตรวจสอบข้อมูลก่อนส่งกรม');
    if (value === 'email') {
      this.withTyping(() => this.showEmailDraft(), 600);
    } else {
      this.withTyping(() => this.showPreview(), 600);
    }
  }

  // ── Email draft flow ───────────────────────────────────────────────────────
  private showEmailDraft(): void {
    const gen = ++this.emailGen;
    this.bot('email-draft', {
      gen, isSent: false,
      to: '',
      subject: `ขอเอกสารประกอบการขออนุญาตนำเข้า — ${this.formData().invoiceNo ?? 'ใบสั่งซื้อใหม่'}`,
      body: `เรียน คุณ...\n\nตามที่ท่านได้ยื่นคำขออนุญาตนำเข้า เลข Invoice ${this.formData().invoiceNo ?? ''}\nกรุณาส่งเอกสารเพิ่มเติม:\n\n1. ใบรับรอง GMP ฉบับจริง\n2. Certificate of Analysis (CoA)\n\nขอบคุณครับ`,
    } satisfies EmailDraftData);
  }

  onEmailSent(msgId: string): void {
    this.messages.update(ms => ms.map(m =>
      m.id === msgId && m.type === 'email-draft'
        ? { ...m, data: { ...(m.data as EmailDraftData), isSent: true } }
        : m
    ));
    this.user('ส่งอีเมลแล้ว');
    this.withTyping(() => this.showPostEmailChoice(), 600);
  }

  private showPostEmailChoice(): void {
    this.bot('choice-card', {
      question: 'รอการตอบกลับจากลูกค้า...',
      options: [
        { label: 'ลูกค้ายืนยันเอกสารแล้ว', value: 'confirmed' },
        { label: 'แก้ไขเอกสาร', value: 'edit' },
      ],
    } satisfies ChoiceCardData);
  }

  onPostEmailChoice(value: string): void {
    if (value === 'confirmed') {
      this.user('ลูกค้ายืนยันเอกสารแล้ว');
      this.withTyping(() => this.showPreview(), 600);
    } else {
      this.user('แก้ไขเอกสาร');
      this.withTyping(() => this.showFullUpload(), 400);
    }
  }

  // ── Preview / Submit ───────────────────────────────────────────────────────
  private showPreview(): void {
    this.step.set('preview');
    this.bot('choice-card', {
      question: `พรีวิวร่างใบอนุญาต — Invoice ${this.formData().invoiceNo ?? '—'} · HS ${this.formData().hsCode ?? '—'} · ${this.formData().importer ?? '—'}`,
      options: [
        { label: 'ยืนยันส่งกรม', value: 'submit', description: 'ส่งคำขออนุญาตไปยังกรมศุลกากร' },
        { label: 'แก้ไขเพิ่มเติม', value: 'edit', description: 'กลับไปแก้ไขข้อมูล' },
      ],
    } satisfies ChoiceCardData);
  }

  onPreviewChoice(value: string): void {
    if (value === 'submit') {
      this.user('ยืนยันส่งกรม');
      this.withTyping(() => this.submit(), 1200);
    } else {
      this.user('แก้ไขเพิ่มเติม');
      this.withTyping(() => this.showFullUpload(), 400);
    }
  }

  private submit(): void {
    const refNo = `RG-2568-${Math.floor(Math.random() * 90000 + 10000)}`;
    this.submittedRefNo.set(refNo);

    const flowMsgs = this.messages().slice(this.flowStartIdx);
    const fd = this.formData();

    const chatName = fd.ref?.startsWith('HTHM') ? fd.ref
      : fd.invoiceNo ? fd.invoiceNo
      : fd.importer ? `${fd.importer.replace('บริษัท ', '').replace(' จำกัด', '')} · ${fd.goodsDesc?.slice(0, 30) ?? ''}`
      : `ขอใบ ${new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}`;

    const shipment: Shipment = {
      id: genId(), chatName, isNew: false,
      hthmRef: fd.ref?.startsWith('HTHM') ? fd.ref : undefined,
      customsNo: refNo, type: 'IMP',
      customer: fd.importer ?? '', contact: '', contactEmail: '',
      goods: fd.goodsDesc ?? fd.hsCode ?? '', hs: fd.hsCode ?? '',
      origin: fd.countryOrigin ?? '', importedAt: new Date().toLocaleString('th-TH'),
      owner: '', permitNeeded: true, agency: 'fda',
      formCode: 'ร.7', formName: 'แบบคำขออนุญาตนำเข้า',
      conf: 88, stage: 8, statusKey: 'submitted',
      assess: { conf: 88, reason: 'ยื่นแล้ว' },
      classify: { agency: 'fda', conf: 88, reason: '', alt: [] },
      draft: { fields: [] }, flags: [],
      audit: [{ time: getTime(), text: 'ยืนยันส่งกรมจากแชท', by: 'เจ้าหน้าที่' }],
      email: { toName: '', to: '', subject: '', body: '', attName: '' },
      messages: flowMsgs,
    };

    this.queue.add([shipment]);
    this.step.set('done');

    this.bot('status-card', {
      refNo, customsRef: fd.ref ?? fd.invoiceNo ?? '—',
      submittedAt: new Date().toLocaleDateString('th-TH'),
    } satisfies StatusCardData);
  }

  // ── SPN list permit request ────────────────────────────────────────────────
  onRequestPermit(refs: string[]): void {
    const snap = this.messages().slice(this.flowStartIdx);
    const items: Shipment[] = refs.map(ref => {
      const entry = this.spnEntries().find(e => e.ref === ref);
      return {
        id: genId(), chatName: ref, hthmRef: ref, isNew: true,
        customsNo: entry?.customsNo ?? ref, type: 'IMP' as const,
        customer: entry?.importer ?? '', contact: '', contactEmail: '',
        goods: entry?.goods ?? '', hs: entry?.hs ?? '',
        origin: entry?.origin ?? '', importedAt: new Date().toLocaleString('th-TH'),
        owner: '', permitNeeded: true, agency: 'fda' as const,
        formCode: 'ร.7', formName: 'แบบคำขออนุญาตนำเข้า',
        conf: 0, stage: 1, statusKey: 'needs_you' as const,
        assess: { conf: 0, reason: '' },
        classify: { agency: 'fda' as const, conf: 0, reason: '', alt: [] },
        draft: { fields: [] }, flags: [],
        audit: [{ time: getTime(), text: 'เพิ่มจากแชท', by: 'เจ้าหน้าที่' as const }],
        email: { toName: '', to: '', subject: '', body: '', attName: '' },
        messages: snap,
      };
    });
    this.spnEntries.update(es => es.map(e => refs.includes(e.ref) ? { ...e, inQueue: true } : e));
    this.queue.add(items);
    this.setSidebarActive('queue');
  }

  // ── Print ──────────────────────────────────────────────────────────────────
  openPrintPage(): void {
    const fd = this.formData();
    const printData = {
      ref: fd.ref ?? '', refNo: this.submittedRefNo(),
      importer: fd.importer ?? '', declarant: fd.declarant ?? '',
      port: fd.port ?? '', hsCode: fd.hsCode ?? '',
      countryOrigin: fd.countryOrigin ?? '',
      quantity: fd.quantity ?? '', unit: fd.unit ?? 'กิโลกรัม',
      invoiceNo: fd.invoiceNo ?? '', invoiceDate: fd.invoiceDate ?? '',
      lotNo: fd.lotNo ?? '', uNo: fd.uNo ?? '',
      drugRegNo: fd.drugRegNo ?? '', importDate: fd.importDate ?? '',
      goodsDesc: fd.goodsDesc ?? '', licenseType: fd.licenseType ?? 'RGoods',
      printedAt: new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }),
    };
    sessionStorage.setItem('__printLicenseData', JSON.stringify(printData));
    window.open('/print/license', '_blank');
    this.withTyping(() => this.bot('text', undefined, 'เปิดหน้าพิมพ์ใบอนุญาตแล้วครับ'), 400);
  }

  // ── New chat ───────────────────────────────────────────────────────────────
  newChat(): void {
    this.messages.set([WELCOME]);
    this.step.set('idle');
    this.formData.set({});
    this.submittedRefNo.set('');
    this.flowStartIdx = 0;
    this.ocr.reset();
  }

  private delay(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
  }
}
