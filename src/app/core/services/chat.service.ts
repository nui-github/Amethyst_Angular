import { Injectable, computed, signal } from '@angular/core';
import {
  ChatMessage, ChatHistorySession, ChatStep, LicenseFormData, MessageType,
  FlagCardData, FlagItem, ChoiceCardData, EmailDraftData,
  StatusCardData, OcrResultsData, SpnResultData, Shipment,
  MissingField, MissingFieldsData, PaymentSlipData, HsAnalysisData,
  InvoiceLineItem, ItemHsAnalysisData, ProductHsAnalysis, ItemMeasurementData, CustomsDeclarationData,
  InvoiceSelectData, Direction, AgencyDocsReturnedData, AgencyApprovalPendingData,
  ShipmentItem, ShipmentDocument, AgencyKey,
} from '@app/core/models/types';
import { OcrService, MultiInvoiceDetection } from './ocr.service';
import { QueueService } from './queue.service';
import { analyzeHsCode } from '@mock/hs-analysis.mock';
import { getAgencyPayment } from '@mock/payment.mock';
import { getAgencyReturnDocs } from '@mock/agency-return-docs.mock';
import { KNOWN_REFS, MOCK_FORM_DATA, MOCK_SPN_LIST } from '@mock/spn.mock';
import { MOCK_SPN_PROFILES } from '@mock/spn-companies.mock';
import { getInvoiceLineItems, INVOICE_ITEMS_DECLARATION } from '@mock/invoice-items.mock';
import { getProductHsAnalysis, mapToInvoiceLineItems } from '@mock/product-hs-analysis.mock';
import { getExportProductClassification, mapExportItemsToInvoiceLineItems } from '@mock/export-product-classification.mock';
import { InvoiceOcrResult, toInvoiceSummaryOption } from '@mock/invoice-ocr.mock';
import { environment } from '@env/environment';
import { MOCK_SESSIONS } from '@mock/sessions.mock';
import { mergeCustomsDeclaration } from '@app/shared/utils/helpers';

let _idCounter = 0;
const genId = () => `msg_${Date.now()}_${_idCounter++}`;
const getTime = () => new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
// Placeholder for documents finalizeSubmit() reconstructs from formData — mirrors queue.mock.ts's
// own SAMPLE_PDF convention (real uploaded files aren't retained as blobs in this mock environment).
const SAMPLE_DOC_URL = 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/PDF1.pdf';

const WELCOME: ChatMessage = {
  id: 'welcome', role: 'bot', type: 'welcome', time: '09:00',
};

@Injectable({ providedIn: 'root' })
export class ChatService {
  // ── State ──────────────────────────────────────────────────────────────────
  readonly messages        = signal<ChatMessage[]>([WELCOME]);
  readonly sessions        = signal<ChatHistorySession[]>(MOCK_SESSIONS);
  readonly activeSessionId = signal<string | null>(null);
  readonly isTyping        = signal(false);
  readonly spnSession      = signal<{ companyName: string; url: string; username: string; profile?: string } | null>(null);
  readonly step            = signal<ChatStep>('idle');
  readonly isConnected     = signal(false);
  readonly pendingRef      = signal('');
  readonly formData        = signal<LicenseFormData>({});
  readonly submittedRefNo  = signal('');
  readonly spnEntries      = signal(MOCK_SPN_LIST);
  readonly sidebarActive    = signal<'chatbot' | 'queue'>('chatbot');
  readonly sidebarCollapsed = signal(false);
  readonly queueShipmentId  = signal<string | null>(null);

  // Full-screen "กรอกข้อมูลเพิ่มเติม" declaration-editor panel (customs-declaration-editor) —
  // global overlay rendered from ChatPageComponent, opened from any ocr-results card that has a
  // structured customsDeclaration. declarationEditorMsgId tracks which message to write back into.
  readonly declarationEditorOpen  = signal(false);
  readonly declarationEditorMsgId = signal<string | null>(null);

  // Which side of the pipeline the current session is on — set once from showDocTypeChoice()'s
  // answer, threaded into formData.direction and every message that needs direction-aware copy
  // (single-upload title, ocr-results/form-preview/declaration-editor header sections).
  readonly direction = signal<Direction>('import');

  readonly needsYouCount = computed(() => this.queue.needsYouCount());

  private flowStartIdx = 0;
  private flagGen = 0;
  private emailGen = 0;
  private currentAgency = '';
  private submittedAgencies: string[] = [];
  // Shipment.id most recently pushed to the queue by finalizeSubmit() — checkStatus()'s approval
  // flow patches this record directly (e.g. setAgencyPaymentQr()) since it happens later in the
  // same session, after the shipment already exists in QueueService.
  private lastShipmentId: string | null = null;

  // Public: tracks all agencies needed + which have been submitted
  readonly allPermitAgencies  = signal<string[]>([]);
  readonly submittedPermits   = signal<{ agency: string; refNo: string; submittedAt: string; licenseType: string; invoiceRef: string }[]>([]);

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
    } else if (lower.includes('ตรวจสอบสถานะ')) {
      this.withTyping(() => this.bot('permit-status'), 500);
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
  onSpnConnected(companyName: string, url: string, username: string, profile?: string): void {
    this.isConnected.set(true);
    this.spnSession.set({ companyName, url, username, profile });
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

  /** Called from SpnCard when user picks a single entry */
  selectSpnEntry(ref: string): void {
    this.user(`เลือก ${ref}`);
    this.withTyping(() => this.fetchSPN(ref), 400);
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

    // SPN path: AI analysis → proceed choice (no flags, data already verified)
    this.withTyping(() => this.continueAfterSPN(), 800);
  }

  private continueAfterSPN(): void {
    // SPN path: item-hs-analysis → agency choice → profile → proceed
    this.pendingAfterFlow = 'proceed';
    this.submittedAgencies = [];
    if (this.formData().hsCode) {
      this.withTyping(() => this.showItemHsAnalysis(), 600);
    } else {
      this.withTyping(() => this.showProfileSelectForProceed(), 800);
    }
  }

  private continueAfterCustomsOCR(): void {
    // Customs path: item-hs-analysis → agency choice → profile → form-preview (no extra upload)
    this.pendingAfterFlow = 'form-preview';
    this.submittedAgencies = [];
    if (this.formData().hsCode) {
      this.withTyping(() => this.showItemHsAnalysis(), 600);
    } else {
      this.withTyping(() => this.showProfileSelectForProceed(), 800);
    }
  }

  private showProfileSelectForProceed(): void {
    const currentCode = this.spnSession()?.profile;
    this.bot('profile-select', {
      mode: currentCode ? 'confirm' : 'select',
      currentProfileCode: currentCode,
      afterFlow: 'proceed',
    });
  }

  private spnNotFound(ref: string): void {
    this.formData.update(f => ({ ...f, ref, licenseType: 'RGoods' }));
    this.step.set('not_found');
    this.bot('spn-not-found');
  }

  // ── Doc type gate (entry from welcome card) ────────────────────────────────
  showDocTypeChoice(): void {
    this.bot('choice-card', {
      question: 'ท่านต้องการดำเนินการด้านใดครับ?',
      options: [
        { label: 'เอกสารนำเข้าสินค้า', value: 'import', description: 'ขอใบอนุญาต, RGoods, วิเคราะห์ HS Code' },
        { label: 'เอกสารส่งออกสินค้า', value: 'export', description: 'ใบขนส่งออก, ภาษีส่งออก' },
      ],
    } satisfies ChoiceCardData);
  }

  onDocTypeChoice(value: string): void {
    if (value === 'import') {
      this.direction.set('import');
      this.user('เอกสารนำเข้าสินค้า');
      this.withTyping(() => {
        this.bot('choice-card', {
          question: 'ต้องการดึงข้อมูลจาก ShippingNet หรืออัปโหลดเอกสารเองครับ?',
          options: [
            { label: 'ดึงข้อมูลจาก ShippingNet', value: 'spn',    description: 'ต้องมี account SPN — ระบบจะดึงข้อมูลใบขนให้อัตโนมัติ' },
            { label: 'อัปโหลดเอกสารเอง',          value: 'upload', description: 'AI OCR ดึงข้อมูลจากไฟล์ที่อัปโหลด ไม่ต้องมี SPN' },
          ],
        } satisfies ChoiceCardData);
      }, 400);
    } else {
      // Export path has no ShippingNet integration yet — skip straight to the upload-method menu.
      this.direction.set('export');
      this.user('เอกสารส่งออกสินค้า');
      this.markFlowStart();
      this.withTyping(() => this.openImportLicenseMenu(), 400);
    }
  }

  // ── Import/export license menu ──────────────────────────────────────────────
  openImportLicenseMenu(): void {
    this.withTyping(() => this.bot('import-license-menu', { direction: this.direction() }), 400);
  }

  // ── Document choice flows ──────────────────────────────────────────────────

  /** Handle the SPN vs Upload choice (import path only) */
  onCustomsDocsChoice(value: string): void {
    if (value === 'spn') {
      this.user('ดึงข้อมูลจาก ShippingNet');
      this.markFlowStart();
      // Skip profile picker — show SPN list directly; profile selection comes after agency choice
      this.withTyping(() => this.showSPNList(), 400);
    } else {
      this.user('อัปโหลดเอกสารเอง');
      this.openImportLicenseMenu();
    }
  }

  /** ใบขนสินค้าขาเข้า/ใบขนสินค้าขาออก from menu — no flag review needed */
  chooseCustomsDocs(): void {
    const dir = this.direction();
    this.user(dir === 'export' ? 'ใบขนสินค้าขาออก' : 'ใบขนสินค้าขาเข้า');
    this.markFlowStart();
    this.isCustomsOnlyUpload = true;
    this.withTyping(() => { this.step.set('invoice_upload'); this.bot('single-upload', { direction: dir }); }, 400);
  }

  chooseInvoiceFirst(): void {
    const dir = this.direction();
    this.user('ใบ Invoice');
    this.markFlowStart();
    this.isInvoicePath = true;
    this.submittedAgencies = [];
    this.withTyping(() => { this.step.set('invoice_upload'); this.bot('single-upload', { mode: 'invoice', direction: dir }); }, 400);
  }

  chooseFullUpload(): void {
    this.user('เอกสารชุดสำหรับการขอใบอนุญาตนำเข้า');
    this.markFlowStart();
    this.step.set('full_upload');
    this.bot('full-upload');
  }

  private isReEditOCR = false;
  private isCustomsOnlyUpload = false;
  private isInvoicePath = false;
  private isAgencyDocsUpload = false;
  private isCustomsDocPath = false;
  private checkMissingAfterFlags = false;          // invoice path: check missing fields after flags
  private pendingAfterMissingFields: 'ocr' | 'proceed-choice' = 'ocr';
  // What to do after agency+profile selection
  private pendingAfterFlow: 'agency-docs' | 'form-preview' | 'proceed' = 'proceed';

  private showFullUpload(reEdit = false): void {
    this.isReEditOCR = reEdit;
    this.markFlowStart();
    this.step.set('full_upload');
    this.bot('full-upload');
  }

  // ── OCR flow ───────────────────────────────────────────────────────────────
  private pendingInvoiceOptions: InvoiceOcrResult[] = [];

  async startOCR(_files?: unknown[]): Promise<void> {
    this.step.set('ocr');
    this.bot('ocr-progress');
    const dir = this.direction();
    const result = await this.ocr.startOCR(_files, this.isInvoicePath ? 'invoice' : 'default', dir);

    if ('multiInvoice' in result) {
      this.showInvoiceSelect(result);
      return;
    }

    this.formData.update(f => ({
      ...f, ...result, direction: dir,
      customsDeclaration: mergeCustomsDeclaration(f.customsDeclaration, result.customsDeclaration),
    }));
    this.promoteActiveSession();
    this.showOCRResults(result);
  }

  /** File OCR detected more than one invoice inside it — let the user pick which one to work
   *  with before showing the ocr-results card at all; the rest of the flow then proceeds using
   *  only that chosen invoice's data, exactly like a normal single-invoice upload. */
  private showInvoiceSelect(detection: MultiInvoiceDetection): void {
    this.pendingInvoiceOptions = detection.invoices;
    this.promoteActiveSession();
    this.bot('invoice-select', {
      invoices: detection.invoices.map(toInvoiceSummaryOption),
    } satisfies InvoiceSelectData);
  }

  /** Called from InvoiceSelectComponent once the user picks one of the detected invoices. */
  onInvoiceSelected(invoiceId: string): void {
    const chosen = this.pendingInvoiceOptions.find(inv => inv.invoiceNo === invoiceId);
    if (!chosen) return;
    this.user(`เลือก ${invoiceId}`);
    this.pendingInvoiceOptions = [];

    this.messages.update(ms => {
      const last = [...ms].reverse().find(m => m.type === 'invoice-select');
      if (!last) return ms;
      return ms.map(m => m.id === last.id
        ? { ...m, data: { ...(m.data as InvoiceSelectData), selectedId: invoiceId } }
        : m);
    });

    this.formData.update(f => ({
      ...f, ...chosen, direction: this.direction(),
      customsDeclaration: mergeCustomsDeclaration(f.customsDeclaration, chosen.customsDeclaration),
    }));
    this.promoteActiveSession();
    this.withTyping(() => this.showOCRResults(chosen), 400);
  }

  /** Called when agency-upload uses only manual entry — skip OCR progress, show manual summary */
  skipOCRManualOnly(): void {
    const fd = this.formData();
    this.bot('ocr-results', {
      invoiceNo: fd.invoiceNo ?? '', invoiceDate: fd.invoiceDate ?? '',
      quantity: fd.quantity ?? '', importer: fd.importer ?? '', port: fd.port ?? '',
      hsCode: fd.hsCode ?? '', countryOrigin: fd.countryOrigin ?? '',
      lotNo: fd.lotNo ?? '', uNo: fd.uNo ?? '',
      isManual: true,
      ...(fd.customsDeclaration ? { customsDeclaration: fd.customsDeclaration } : {}),
      declarationGateRequired: this.isCustomsOnlyUpload || this.isAgencyDocsUpload,
      direction: this.direction(),
    } satisfies OcrResultsData);
    this.withTyping(() => this.continueAfterOCR(), 600);
  }

  // Required fields to be considered "complete" for manual upload paths
  private readonly REQUIRED_FIELDS: MissingField[] = [
    { key: 'invoiceNo',   label: 'Invoice No.',         placeholder: 'เช่น INV-2024-8834' },
    { key: 'importer',    label: 'ผู้นำเข้า',             placeholder: 'ชื่อบริษัทผู้นำเข้า' },
    { key: 'goodsDesc',   label: 'รายละเอียดสินค้า',     placeholder: 'เช่น ยาปฏิชีวนะ HS 2941' },
    { key: 'port',        label: 'ท่าเรือ/ด่านนำเข้า',   placeholder: 'เช่น ท่าเรือแหลมฉบัง' },
  ];

  private getMissingFields(data: LicenseFormData): MissingField[] {
    return this.REQUIRED_FIELDS.filter(f => !((data as Record<string, string>)[f.key]?.trim()));
  }

  private showOCRResults(result: typeof import('@mock/ocr.mock').MOCK_OCR_RESULT | InvoiceOcrResult, round = 1): void {
    const withLineItems = result as Partial<InvoiceOcrResult>;
    this.bot('ocr-results', {
      invoiceNo: result.invoiceNo, invoiceDate: result.invoiceDate,
      quantity: result.quantity, importer: result.importer, port: result.port,
      hsCode: result.hsCode, countryOrigin: result.countryOrigin,
      lotNo: result.lotNo, uNo: result.uNo,
      ...(withLineItems.qtyUnit ? { qtyUnit: withLineItems.qtyUnit } : {}),
      ...(withLineItems.lineItems ? { lineItems: withLineItems.lineItems } : {}),
      ...(this.formData().customsDeclaration ? { customsDeclaration: this.formData().customsDeclaration } : {}),
      // Only the customs-only single-upload pass and the invoice path's 2nd (agency-upload) pass
      // are meant to be the final/complete declaration — the invoice path's 1st pass (invoice doc
      // alone) can't carry full customs-manifest data yet, so it isn't gated.
      declarationGateRequired: this.isCustomsOnlyUpload || this.isAgencyDocsUpload,
      direction: this.direction(),
    } satisfies OcrResultsData);

    // Skip missing fields check for re-edit paths (post-email, post-flag edit)
    if (this.isReEditOCR) {
      this.isReEditOCR = false;
      // Mark the card as auto-proceeded so the button hides immediately
      this.messages.update(ms => {
        const last = [...ms].reverse().find(m => m.type === 'ocr-results');
        if (!last) return ms;
        return ms.map(m => m.id === last.id ? { ...m, data: { ...(m.data as OcrResultsData), autoProceeded: true } } : m);
      });
      this.continueAfterOCR();
      return;
    }

    const currentData = this.formData();
    const missing = this.getMissingFields(currentData);

    if (missing.length > 0) {
      // Show missing fields form — user fills in or uploads more
      this.withTyping(() => {
        this.bot('missing-fields', {
          missingFields: missing,
          existingData: { ...currentData },
          round,
        } satisfies MissingFieldsData);
      }, 600);
    }
    // else: user clicks "ดำเนินการต่อ" in OcrResultsComponent → onOcrResultsProceed()
  }

  // ── Full-screen declaration-editor panel ─────────────────────────────────────
  openDeclarationEditor(msgId: string): void {
    this.declarationEditorMsgId.set(msgId);
    this.declarationEditorOpen.set(true);
  }

  closeDeclarationEditor(): void {
    this.declarationEditorOpen.set(false);
  }

  /** Called from CustomsDeclarationEditorComponent when the user saves — every required field
   *  was already validated there. Writes the edited declaration back into both the shared
   *  formData (so downstream steps see it) and the originating ocr-results message's own data
   *  (so "ดำเนินการต่อ" appears on that card and "กรอกข้อมูลเพิ่มเติม" can re-open with the same values). */
  saveDeclarationEditor(updated: CustomsDeclarationData): void {
    const msgId = this.declarationEditorMsgId();
    this.formData.update(f => ({ ...f, customsDeclaration: updated }));
    if (msgId) {
      this.messages.update(ms => ms.map(m =>
        m.id === msgId && m.type === 'ocr-results'
          ? { ...m, data: { ...(m.data as OcrResultsData), customsDeclaration: updated, declarationComplete: true } }
          : m
      ));
    }
    this.declarationEditorOpen.set(false);
  }

  /** Called from OcrResultsComponent "ดำเนินการต่อ" button */
  onOcrResultsProceed(): void {
    this.user('ดำเนินการต่อ');
    this.withTyping(() => this.continueAfterOCR(), 400);
  }

  private continueAfterOCR(): void {
    // Agency docs upload (2nd doc in invoice path): skip hs-analysis AND flags/item-measurement —
    // the declaration-editor panel (gated on this very OCR pass, see declarationGateRequired)
    // already made the user fill in everything (including Measurement/Meas. Unit per item and any
    // flagged discrepancies) before "ดำเนินการต่อ" was even reachable, so re-asking via flag-card /
    // item-measurement here would just be duplicate work. Go straight to the same missing-fields
    // check / proceed-choice those two steps used to lead into.
    if (this.isAgencyDocsUpload) {
      this.isAgencyDocsUpload = false;
      this.checkMissingAfterFlags = true;   // invoice path: check missing fields after flags confirmed
      // No separate item-selection step — every line item on the uploaded invoice is the request.
      if (this.direction() === 'export') {
        // Export items' own CustomsDeclarationItem records (itemNumber 1-4) already came in via
        // the export OCR passes — no extra merge needed, unlike the import mock below.
        this.formData.update(f => ({
          ...f,
          selectedItems: mapExportItemsToInvoiceLineItems(getExportProductClassification()),
        }));
      } else {
        // These items are a different shipment from the shared medical-device customsDeclaration
        // (itemNumber 1-6), so their own CustomsDeclarationItem records (101-104) merge in alongside
        // it rather than replacing it — form-preview's item modal can then show the full schema too.
        this.formData.update(f => ({
          ...f,
          selectedItems: getInvoiceLineItems(this.formData().invoiceNo),
          customsDeclaration: mergeCustomsDeclaration(f.customsDeclaration, { items: INVOICE_ITEMS_DECLARATION }),
        }));
      }
      this.withTyping(() => this.afterFlagsConfirmed(), 600);
      return;
    }
    // Customs single-upload: skip flags, hs-analysis → profile → agency choice (same as invoice)
    if (this.isCustomsOnlyUpload) {
      this.isCustomsOnlyUpload = false;
      this.continueAfterCustomsOCR();
      return;
    }
    // Invoice path: per-product HS Code + Smart Tariff analysis (user reviews each row)
    // → profile select → agency choice → second upload → flags
    if (this.isInvoicePath) {
      this.isInvoicePath = false;
      this.pendingAfterFlow = 'agency-docs';
      this.withTyping(() => this.showItemHsAnalysis(), 600);
      return;
    }
    // Full-upload path: hs-analysis → flags
    if (this.formData().hsCode) {
      this.withTyping(() => {
        const analysis = analyzeHsCode(this.formData().hsCode!);
        this.bot('hs-analysis', analysis);
        setTimeout(() => this.withTyping(() => this.showFlags(), 600), 400);
      }, 600);
    } else {
      this.withTyping(() => this.showFlags(), 800);
    }
  }

  private readonly AGENCY_DESC: Record<string, string> = {
    'อย.': 'สำนักงานคณะกรรมการอาหารและยา (อย.)',
    'กษ.': 'กรมวิชาการเกษตร (กษ.)',
    'ปส.': 'สำนักงานปรมาณูเพื่อสันติภาพ (ปส.)',
    '—':   'ขอใบอนุญาตนำเข้าทั่วไป',
    // Export-path agencies (see 'Export path' in CLAUDE.md)
    'กรมควบคุมโรค': 'กรมควบคุมโรค (DDC)',
    'เชื้อเพลิง':    'กรมธุรกิจพลังงาน (DOEB)',
    'การยาง':       'การยางแห่งประเทศไทย (RAOT)',
  };

  // Maps this.currentAgency's display string (as used throughout the chat flow — item-hs-analysis
  // groups, AGENCY_DESC above, choice-card option values) onto the AgencyKey the queue side actually
  // keys off of (AGENCY_LABEL/AGENCY_SHORT in queue.mock.ts) — finalizeSubmit() needs this since it
  // used to just hardcode 'fda' regardless of which agency the user actually submitted to.
  private readonly AGENCY_KEY_MAP: Record<string, AgencyKey> = {
    'อย.': 'fda', 'กษ.': 'doa', 'ปส.': 'oap',
    'กรมควบคุมโรค': 'ddc', 'เชื้อเพลิง': 'doeb', 'การยาง': 'raot',
  };

  // formCode/formName as actually shown for this agency's own flow (see queue.mock.ts static
  // entries for the same pairing) — QR_PAYMENT_AGENCIES use Pink Form, everything else RGoods.
  private formForAgency(agency: string): { code: string; name: string } {
    const isExport = this.direction() === 'export';
    if (this.QR_PAYMENT_AGENCIES.includes(agency)) {
      return {
        code: 'Pink Form',
        name: `คำขออนุญาต${isExport ? 'ส่งออก' : 'นำเข้า'} (Pink Form) — ${agency}`,
      };
    }
    return {
      code: 'RGoods',
      name: `คำขออนุญาต${isExport ? 'ส่งออก' : 'นำเข้า'}สินค้า (RGoods) — ${agency}`,
    };
  }

  private showAgencyChoice(recommendedAgency: string): void {
    const others = this.ALL_AGENCIES.filter(a => a !== recommendedAgency);
    const options: ChoiceCardData['options'] = [
      {
        label: recommendedAgency,
        value: `dept:${recommendedAgency}`,
        description: this.AGENCY_DESC[recommendedAgency] ?? recommendedAgency,
      },
      ...others.map(a => ({
        label: a,
        value: `dept:${a}`,
        description: this.AGENCY_DESC[a] ?? a,
      })),
    ];
    this.bot('choice-card', { question: 'ต้องการขอใบอนุญาตจากกรมใดบ้าง?', options } satisfies ChoiceCardData);
  }

  onAgencyChoice(rawValue: string): void {
    const agency = rawValue.startsWith('dept:') ? rawValue.replace('dept:', '') : rawValue;
    this.currentAgency = agency;
    this.user(`เลือก ${agency}`);
    // After agency choice: show profile-select, then continue based on pendingAfterFlow
    this.withTyping(() => {
      const currentCode = this.spnSession()?.profile;
      this.bot('profile-select', {
        mode: currentCode ? 'confirm' : 'select',
        currentProfileCode: currentCode,
        afterFlow: this.pendingAfterFlow === 'proceed' ? 'proceed' : 'agency-docs',
        agency,
      });
    }, 500);
  }

  private showProfileSelectForAgency(agency: string): void {
    this.bot('profile-select', {
      mode: 'select',
      afterFlow: 'agency-choice',
      agency,
    });
  }

  /** Called from ProfileSelectComponent when user confirms a profile */
  onProfileSelected(profile: { code: string; displayName: string; username: string }, afterFlow: 'agency-choice' | 'agency-docs' | 'proceed', agency?: string): void {
    this.user(`ใช้โปรไฟล์ ${profile.displayName}`);
    const existing = this.spnSession();
    this.isConnected.set(true);
    this.spnSession.set({
      companyName: existing?.companyName ?? profile.displayName,
      url:         existing?.url         ?? '',
      username:    profile.username,
      profile:     profile.code,
    });
    // Every chat becomes a queue task the moment a profile is confirmed, not only once the user
    // eventually clicks "ยืนยันส่งกรม" — finalizeSubmit() fills this same record in later. Saved
    // AFTER each branch posts its own next actionable card (not here, synchronously) so the
    // snapshot's last message is something the user can actually continue from — "กลับไปคิวงาน" →
    // "ดำเนินการต่อ" only leaves the LAST message interactive (loadQueueSession()), so a snapshot
    // ending right after "เลือกโปรไฟล์แล้ว" with nothing further would strand the resumed session.
    // Determine what to do based on pendingAfterFlow (set before agency choice)
    if (this.pendingAfterFlow === 'agency-docs') {
      // Invoice path: show agency-upload
      this.withTyping(() => {
        this.bot('text', undefined, `กรุณาอัปโหลดเอกสารประกอบที่${agency}ต้องการครับ`);
        setTimeout(() => this.withTyping(() => {
          this.isAgencyDocsUpload = true;
          this.bot('agency-upload', { agency });
          this.saveEarlyQueueEntry(this.currentAgency);
        }, 400), 600);
      }, 500);
    } else if (this.pendingAfterFlow === 'form-preview') {
      // Customs path: every item AI grouped under this agency is the request — no re-selection
      this.selectAllAgencyItems();
      this.withTyping(() => {
        this.showPreview();
        this.saveEarlyQueueEntry(this.currentAgency);
      }, 500);
    } else {
      // SPN path: every item AI grouped under this agency is the request — no re-selection
      this.selectAllAgencyItems();
      this.withTyping(() => {
        this.showProceedChoice();
        this.saveEarlyQueueEntry(this.currentAgency);
      }, 500);
    }
  }

  /** Called from MissingFieldsComponent when user submits */
  async onMissingFieldsSubmit(extra: LicenseFormData, file: File | undefined, round: number): Promise<void> {
    // Merge manually filled fields
    this.formData.update(f => ({ ...f, ...extra }));

    const afterComplete = () => {
      if (this.pendingAfterMissingFields === 'proceed-choice') {
        this.pendingAfterMissingFields = 'ocr';
        this.withTyping(() => this.showProceedChoice(), 600);
      } else {
        this.continueAfterOCR();
      }
    };

    if (file) {
      // OCR the additional file, merge, then re-check
      this.bot('text', undefined, 'กำลัง OCR เอกสารที่อัปโหลดเพิ่ม...');
      this.bot('ocr-progress');
      const ocrResult = await this.ocr.startOCR([file]);
      // This re-upload path only ever runs default-variant OCR (customs/full-upload flows),
      // never 'invoice', so multi-invoice detection is not reachable here.
      if ('multiInvoice' in ocrResult) return;
      const result = ocrResult;
      // Merge: existing fields take priority for fields already filled
      const merged = {
        ...result, ...this.formData(), ...extra,
        customsDeclaration: mergeCustomsDeclaration(this.formData().customsDeclaration, result.customsDeclaration),
      };
      this.formData.set(merged);
      const stillMissing = this.getMissingFields(this.formData());
      this.bot('ocr-results', {
        invoiceNo: result.invoiceNo, invoiceDate: result.invoiceDate,
        quantity: result.quantity, importer: result.importer, port: result.port,
        hsCode: result.hsCode, countryOrigin: result.countryOrigin,
        lotNo: result.lotNo, uNo: result.uNo,
        ...(merged.customsDeclaration ? { customsDeclaration: merged.customsDeclaration } : {}),
      } satisfies OcrResultsData);
      if (stillMissing.length > 0) {
        this.withTyping(() => {
          this.bot('missing-fields', {
            missingFields: stillMissing,
            existingData: { ...this.formData() },
            round: round + 1,
          } satisfies MissingFieldsData);
        }, 400);
      } else {
        this.withTyping(() => afterComplete(), 600);
      }
    } else {
      // No extra file — check if now complete
      const stillMissing = this.getMissingFields(this.formData());
      if (stillMissing.length > 0) {
        this.withTyping(() => {
          this.bot('missing-fields', {
            missingFields: stillMissing,
            existingData: { ...this.formData() },
            round: round + 1,
          } satisfies MissingFieldsData);
        }, 400);
      } else {
        afterComplete();
      }
    }
  }

  // ── Per-product HS Code + Smart Tariff analysis (invoice path, right after OCR) ──
  private showItemHsAnalysis(): void {
    const items = this.direction() === 'export' ? getExportProductClassification() : getProductHsAnalysis();
    this.bot('item-hs-analysis', { items } satisfies ItemHsAnalysisData);
  }

  /** All items from the most recently confirmed item-hs-analysis card — kept so the
   *  customs/SPN item-selection step can filter down to whichever agency was chosen. */
  private confirmedProductItems: ProductHsAnalysis[] = [];

  onItemHsAnalysisConfirmed(msgId: string, items: ProductHsAnalysis[]): void {
    this.messages.update(ms => ms.map(m =>
      m.id === msgId && m.type === 'item-hs-analysis'
        ? { ...m, data: { items, reviewed: true } satisfies ItemHsAnalysisData }
        : m
    ));
    this.user('ยืนยันผลการวิเคราะห์รายสินค้าแล้ว');
    this.confirmedProductItems = items;

    const requiredAgencies = Array.from(new Set(items.filter(i => i.requiresPermit).map(i => i.agency)));
    if (requiredAgencies.length === 0) {
      this.withTyping(() => this.bot('text', undefined,
        'ไม่มีสินค้ารายการใดต้องขอใบอนุญาตเพิ่มเติมครับ — ท่านสามารถดำเนินพิธีการนำเข้าได้ตามปกติ'), 600);
      return;
    }
    this.ALL_AGENCIES = requiredAgencies;
    this.allPermitAgencies.set(this.ALL_AGENCIES);
    this.withTyping(() => this.showAgencyChoice(requiredAgencies[0]), 600);
  }

  /** Customs-declaration / SPN paths: every item AI grouped under the chosen agency during
   *  item-hs-analysis IS the request — set formData.selectedItems directly, no separate
   *  re-selection step for the user. */
  private selectAllAgencyItems(): void {
    const agencyItems = this.confirmedProductItems.filter(i => i.requiresPermit && i.agency === this.currentAgency);
    const selectedItems = this.direction() === 'export'
      ? mapExportItemsToInvoiceLineItems(agencyItems)
      : mapToInvoiceLineItems(agencyItems);
    this.formData.update(f => ({ ...f, selectedItems }));
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
        qtyOptions: ['250 กิโลกรัม', '248.5 กิโลกรัม'],
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
    this.promoteActiveSession();
    const items = this.formData().selectedItems;
    if (items && items.length > 0) {
      this.withTyping(() => {
        this.bot('item-measurement', {
          items,
          customsDeclaration: this.formData().customsDeclaration,
        } satisfies ItemMeasurementData);
      }, 700);
      return;
    }
    this.afterFlagsConfirmed();
  }

  /** Called from ItemMeasurementComponent when every row's Measurement/Meas. Unit is confirmed */
  onItemMeasurementConfirmed(msgId: string, items: InvoiceLineItem[]): void {
    // Keep the card visible (not swapped for a readonly-tag) so the user can scroll back up and
    // see what they entered — write the confirmed items back into the message's own data so a
    // re-render (or queue-history replay) shows the same values, not a blank table again.
    this.messages.update(ms => ms.map(m =>
      m.id === msgId && m.type === 'item-measurement'
        ? { ...m, isReadOnly: true, data: { ...(m.data as ItemMeasurementData), items, confirmed: true } }
        : m
    ));
    this.user('ยืนยันข้อมูล Measurement ครบทุกรายการแล้ว');
    this.formData.update(f => ({ ...f, selectedItems: items }));
    this.withTyping(() => this.afterFlagsConfirmed(), 500);
  }

  private afterFlagsConfirmed(): void {
    if (this.checkMissingAfterFlags) {
      this.checkMissingAfterFlags = false;
      const missing = this.getMissingFields(this.formData());
      if (missing.length > 0) {
        this.pendingAfterMissingFields = 'proceed-choice';
        this.withTyping(() => {
          this.bot('missing-fields', {
            missingFields: missing,
            existingData: { ...this.formData() },
            round: 1,
          } satisfies MissingFieldsData);
        }, 700);
        return;
      }
    }
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

  /** Called from "แก้ไขเอกสาร" in proceed/post-email choice — re-upload skips missing check */
  openReEditUpload(): void {
    this.withTyping(() => this.showFullUpload(true), 400);
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
      this.withTyping(() => this.showFullUpload(true), 400);
    }
  }

  // ── Preview / Submit ───────────────────────────────────────────────────────
  private showPreview(): void {
    this.step.set('preview');
    this.bot('form-preview', { ...this.formData() });
    // choice-card appears only after user clicks "ดำเนินการต่อ" inside form-preview
  }

  /** Called from FormPreviewComponent when user finishes editing and clicks "ดำเนินการต่อ" */
  onFormPreviewProceed(): void {
    this.promoteActiveSession();
    this.user('ดำเนินการต่อ');
    this.withTyping(() => {
      this.bot('choice-card', {
        question: 'ข้อมูลครบถ้วนแล้วครับ — ต้องการดำเนินการต่ออย่างไร?',
        options: [
          { label: 'แก้ไขเอกสารเพิ่มเติม', value: 'edit',   description: 'กลับไปแก้ไขหรืออัปโหลดเอกสารใหม่' },
          { label: 'ยืนยันส่งกรม',        value: 'submit', description: 'ส่งคำขออนุญาตไปยังหน่วยงานที่เกี่ยวข้อง' },
        ],
      } satisfies ChoiceCardData);
    }, 400);
  }

  /** Rewind to the last choice-card so user can re-select */
  rewindToLastChoice(): void {
    const msgs = this.messages();
    // Find last choice-card (reverse search)
    const reversed = [...msgs].reverse();
    const revIdx = reversed.findIndex(m => m.type === 'choice-card');
    if (revIdx === -1) return;
    const actualIdx = msgs.length - 1 - revIdx;
    const choiceMsg = msgs[actualIdx];
    // Keep everything before the choice-card, re-add it with a fresh id so component re-instantiates
    const before = msgs.slice(0, actualIdx);
    this.messages.set([...before, { ...choiceMsg, id: choiceMsg.id + '_r' + Date.now() }]);
  }

  onPreviewChoice(value: string): void {
    if (value === 'submit') {
      this.user('ยืนยันส่งกรม');
      this.withTyping(() => this.submit(), 1200);
    } else {
      this.user('แก้ไขเพิ่มเติม');
      if (this.isCustomsOnlyUpload) {
        this.withTyping(() => {
          this.isReEditOCR = true;
          this.markFlowStart();
          this.step.set('invoice_upload');
          this.bot('single-upload', { direction: this.direction() });
        }, 400);
      } else {
        this.withTyping(() => this.showFullUpload(true), 400);
      }
    }
  }

  private pendingSubmitRefNo = '';

  private submit(): void {
    const refNo = `RG-2568-${Math.floor(Math.random() * 90000 + 10000)}`;
    this.submittedRefNo.set(refNo);
    this.pendingSubmitRefNo = refNo;

    const payConfig = getAgencyPayment(this.currentAgency);
    const feeNote = payConfig.requiresFee
      ? this.QR_PAYMENT_AGENCIES.includes(this.currentAgency)
        ? `ค่าธรรมเนียมกรม ฿${payConfig.amount.toLocaleString('th-TH')} (รอชำระผ่าน QR หลังกรมอนุมัติ)`
        : `ค่าธรรมเนียมกรม ฿${payConfig.amount.toLocaleString('th-TH')} จะรวมในบิลรายเดือน`
      : undefined;

    this.finalizeSubmit(refNo, feeNote);
  }

  private markLastReadOnly(type: MessageType): void {
    const msgs = this.messages();
    const idx = [...msgs].reverse().findIndex(m => m.type === type);
    if (idx === -1) return;
    const actual = msgs.length - 1 - idx;
    this.messages.update(list => list.map((m, i) => i === actual ? { ...m, isReadOnly: true } : m));
  }

  // Agencies whose "ตรวจสอบสถานะ" chip simulates a real department approval → (QR payment if a
  // fee applies) → returned-documents flow, instead of opening the generic permit-status list.
  private readonly QR_PAYMENT_AGENCIES = ['กรมควบคุมโรค', 'การยาง'];

  /** Called from status-card's "ตรวจสอบสถานะ" chip — agency-aware, unlike onCheckStatusChoice above */
  checkStatus(agency?: string): void {
    this.user('ตรวจสอบสถานะใบอนุญาต');
    if (agency && this.QR_PAYMENT_AGENCIES.includes(agency)) {
      this.withTyping(() => this.showAgencyApproval(agency), 700);
    } else {
      this.withTyping(() => this.bot('permit-status'), 500);
    }
  }

  private showAgencyApproval(agency: string): void {
    const payConfig = getAgencyPayment(agency);
    if (payConfig.requiresFee) {
      this.bot('agency-approval-pending', { agency } satisfies AgencyApprovalPendingData);
      this.setAgencyPaymentQr(agency, payConfig.amount);
      this.withTyping(() => this.showNextAgencyIfAny(), 700);
    } else {
      this.bot('text', undefined, `${agency}ตรวจสอบและอนุมัติคำขอแล้วครับ ✅`);
      this.withTyping(() => this.showAgencyReturnedDocs(agency), 600);
    }
  }

  /** Writes the QR payment straight onto the shipment's queue record — the rest of that
   *  agency's flow (view QR, pay, wait for confirmation, receive returned docs) happens on the
   *  queue detail page from here, not in chat. See QueuePageComponent.payQr(). */
  private setAgencyPaymentQr(agency: string, amount: number): void {
    if (!this.lastShipmentId) return;
    this.queue.update(this.lastShipmentId, {
      paymentQr: {
        agency, amount,
        refNo: `PAY-${Math.floor(Math.random() * 900000 + 100000)}`,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        status: 'unpaid',
      },
    });
  }

  private showAgencyReturnedDocs(agency: string): void {
    this.bot('agency-docs-returned', {
      agency, docs: getAgencyReturnDocs(agency),
    } satisfies AgencyDocsReturnedData);
    // Deferred from finalizeSubmit() for QR_PAYMENT_AGENCIES — only offer "ขอใบอนุญาตเพิ่ม" once
    // this agency's approval → returned-docs sequence has actually finished.
    if (this.submittedAgencies.includes(agency)) {
      this.withTyping(() => this.showNextAgencyIfAny(), 800);
    }
  }

  onSlipUploaded(data: PaymentSlipData): void {
    this.markLastReadOnly('payment-slip');
    this.user('อัปโหลด Slip เรียบร้อยแล้ว');
    this.withTyping(() => this.finalizeSubmit(this.pendingSubmitRefNo), 800);
  }

  /** Reconstructs the document list from formData — real uploaded files aren't retained as blobs
   *  in this mock environment, so this is metadata-accurate (real invoice/customs ref) rather than
   *  the actual file. Shared by saveEarlyQueueEntry() and finalizeSubmit(). */
  private buildDocumentsFromFormData(fd: LicenseFormData): ShipmentDocument[] {
    const documents: ShipmentDocument[] = [];
    const uploadedAt = new Date().toLocaleDateString('th-TH');
    if (fd.invoiceNo) {
      documents.push({ id: genId(), name: `Invoice ${fd.invoiceNo}`, fileType: 'pdf', category: 'invoice', url: SAMPLE_DOC_URL, uploadedAt });
    }
    if (fd.ref?.startsWith('HTHM')) {
      documents.push({ id: genId(), name: `ใบขนสินค้า ${fd.ref}`, fileType: 'pdf', category: 'customs', url: SAMPLE_DOC_URL, uploadedAt });
    }
    return documents;
  }

  private chatNameFor(fd: LicenseFormData): string {
    return fd.ref?.startsWith('HTHM') ? fd.ref
      : fd.invoiceNo ? fd.invoiceNo
      : fd.importer ? `${fd.importer.replace('บริษัท ', '').replace(' จำกัด', '')} · ${fd.goodsDesc?.slice(0, 30) ?? ''}`
      : `ขอใบ ${new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  }

  /** Saves a 'needs_you' placeholder into the queue the moment a profile is confirmed — every chat
   *  now shows up there right away instead of only once "ยืนยันส่งกรม" is finally clicked.
   *  finalizeSubmit() later updates this same record (via lastShipmentId) rather than creating a
   *  second one. Items/documents aren't collected yet at this point in the flow, so this is
   *  necessarily a thinner snapshot than the finalized record — filled in as the flow continues. */
  private saveEarlyQueueEntry(agency: string): void {
    const fd = this.formData();
    const agencyKey: AgencyKey = this.AGENCY_KEY_MAP[agency] ?? 'none';
    const form = this.formForAgency(agency);

    const shipment: Shipment = {
      id: genId(), chatName: this.chatNameFor(fd), isNew: true,
      hthmRef: fd.ref?.startsWith('HTHM') ? fd.ref : undefined,
      customsNo: fd.ref ?? fd.invoiceNo ?? 'รอเลขอ้างอิง', type: fd.direction === 'export' ? 'EXP' : 'IMP',
      customer: fd.importer ?? '', contact: '', contactEmail: '',
      goods: fd.goodsDesc ?? fd.hsCode ?? '', hs: fd.hsCode ?? '',
      origin: fd.countryOrigin ?? '', importedAt: new Date().toLocaleString('th-TH'), createdAt: Date.now(),
      owner: '', permitNeeded: true, agency: agencyKey,
      formCode: form.code, formName: form.name,
      conf: 88, stage: 4, statusKey: 'needs_you',
      assess: { conf: 88, reason: 'กำลังดำเนินการ' },
      classify: { agency: agencyKey, conf: 88, reason: '', alt: [] },
      draft: { fields: [] }, flags: [],
      audit: [{ time: getTime(), text: `เลือกโปรไฟล์และเริ่มดำเนินการกับ${agency}`, by: 'เจ้าหน้าที่' }],
      documents: this.buildDocumentsFromFormData(fd), items: [], itemsSelected: false,
      email: { toName: '', to: '', subject: '', body: '', attName: '' },
      messages: this.messages().slice(this.flowStartIdx),
    };

    this.queue.add([shipment]);
    this.lastShipmentId = shipment.id;
  }

  private finalizeSubmit(refNo: string, feeNote?: string): void {
    this.promoteActiveSession();
    const flowMsgs = this.messages().slice(this.flowStartIdx);
    const fd = this.formData();

    const agencyKey: AgencyKey = this.AGENCY_KEY_MAP[this.currentAgency] ?? 'none';
    const form = this.formForAgency(this.currentAgency);

    const items: ShipmentItem[] = (fd.selectedItems ?? []).map(i => ({
      id: i.id, name: i.name, hsCode: i.hsCode, origin: i.origin,
      quantity: i.quantity, unit: i.unit, lotNo: i.lotNo, amount: i.amount,
    }));

    const shipmentId = this.lastShipmentId ?? genId();
    const shipment: Shipment = {
      id: shipmentId, chatName: this.chatNameFor(fd), isNew: false,
      hthmRef: fd.ref?.startsWith('HTHM') ? fd.ref : undefined,
      customsNo: refNo, type: fd.direction === 'export' ? 'EXP' : 'IMP',
      customer: fd.importer ?? '', contact: '', contactEmail: '',
      goods: fd.goodsDesc ?? fd.hsCode ?? '', hs: fd.hsCode ?? '',
      origin: fd.countryOrigin ?? '', importedAt: new Date().toLocaleString('th-TH'), createdAt: Date.now(),
      owner: '', permitNeeded: true, agency: agencyKey,
      formCode: form.code, formName: form.name,
      conf: 88, stage: agencyKey === 'ddc' ? 8 : 7, statusKey: 'submitted',
      assess: { conf: 88, reason: 'ยื่นแล้ว' },
      classify: { agency: agencyKey, conf: 88, reason: '', alt: [] },
      draft: { fields: [] }, flags: [],
      audit: [{ time: getTime(), text: 'ยืนยันส่งกรมจากแชท', by: 'เจ้าหน้าที่' }],
      documents: this.buildDocumentsFromFormData(fd), items, itemsSelected: items.length > 0,
      email: { toName: '', to: '', subject: '', body: '', attName: '' },
      messages: flowMsgs,
    };

    // saveEarlyQueueEntry() (called from onProfileSelected) already pushed a 'needs_you' record for
    // this agency's round — update it in place instead of adding a duplicate. Falls back to add()
    // only if that somehow never ran (shouldn't happen — every flow goes through profile-select).
    if (this.lastShipmentId && this.queue.get(this.lastShipmentId)) {
      const { id: _drop, ...patch } = shipment;
      this.queue.update(this.lastShipmentId, patch);
    } else {
      this.queue.add([shipment]);
    }
    this.lastShipmentId = shipmentId;
    this.step.set('done');

    this.bot('status-card', {
      refNo, customsRef: fd.ref ?? fd.invoiceNo ?? '—',
      submittedAt: new Date().toLocaleDateString('th-TH'),
      feeNote, agency: this.currentAgency,
    } satisfies StatusCardData);

    if (this.currentAgency) {
      this.submittedAgencies.push(this.currentAgency);
      this.submittedPermits.update(ps => [...ps, {
        agency: this.currentAgency,
        refNo,
        submittedAt: new Date().toLocaleDateString('th-TH'),
        licenseType: fd.licenseType ?? 'RGoods',
        invoiceRef: fd.ref ?? fd.invoiceNo ?? '—',
      }]);
      // QR_PAYMENT_AGENCIES must finish "ตรวจสอบสถานะ" → approval → (QR payment in the queue page,
      // if a fee applies, else returned docs right away) first — showNextAgencyIfAny() runs from
      // showAgencyApproval()/showAgencyReturnedDocs() instead for those.
      if (!this.QR_PAYMENT_AGENCIES.includes(this.currentAgency)) {
        this.withTyping(() => this.showNextAgencyIfAny(), 800);
      }
    }
  }

  private ALL_AGENCIES = ['อย.', 'กษ.'];

  private showNextAgencyIfAny(): void {
    const remaining = this.ALL_AGENCIES.filter(a => !this.submittedAgencies.includes(a));

    if (remaining.length === 0) {
      this.bot('text', undefined, 'ขออนุญาตครบทุกใบแล้วครับ ✓');
      this.bot('choice-card', {
        question: 'ต้องการตรวจสอบสถานะใบอนุญาตที่ยื่นไปหรือไม่ครับ?',
        options: [
          { label: 'ตรวจสอบสถานะใบอนุญาต', value: 'check-status', description: 'ดูสถานะใบอนุญาตทั้งหมดที่ยื่นไปในแชทนี้' },
        ],
      } satisfies ChoiceCardData);
      return;
    }

    const doneOption = {
      label: 'เสร็จสิ้น',
      value: 'no-more-agency',
      description: 'ไม่ต้องการขอใบอนุญาตเพิ่มเติม',
    };
    const remainingLabel = remaining.join(', ');
    this.bot('choice-card', {
      question: 'ต้องการขอใบอนุญาตเพิ่มเติมไหมครับ?',
      options: [
        doneOption,
        {
          label: 'ขอใบอนุญาตเพิ่ม',
          value: 'more-agencies',
          description: `ยังมีกรมที่ยังไม่ได้ยื่นขอ: ${remainingLabel}`,
        },
      ],
    } satisfies ChoiceCardData);
  }

  onNextAgencyChoice(value: string): void {
    if (value === 'no-more-agency') {
      this.user('เสร็จสิ้น');
      this.withTyping(() => this.bot('text', undefined, 'ดำเนินการเสร็จสิ้นแล้วครับ ✓'), 400);
      return;
    }
    if (value === 'more-agencies') {
      this.user('ขอใบอนุญาตเพิ่ม');
      // Show remaining agency selector card
      this.withTyping(() => this.showRemainingAgencySelector(), 500);
      return;
    }
    // Specific agency selected from selector — go straight to upload, skip agency choice card
    const agency = value.replace('agency:', '');
    this.onAgencyChoice(agency);
  }

  onCheckStatusChoice(value: string): void {
    if (value !== 'check-status') return;
    this.user('ตรวจสอบสถานะใบอนุญาต');
    this.withTyping(() => this.bot('permit-status'), 500);
  }

  private showRemainingAgencySelector(): void {
    const remaining = this.ALL_AGENCIES.filter(a => !this.submittedAgencies.includes(a));
    this.bot('choice-card', {
      question: 'เลือกกรมที่ต้องการยื่นขอใบอนุญาต',
      options: remaining.map(a => ({
        label: a,
        value: `agency:${a}`,
        description: this.AGENCY_DESC[a] ?? a,
      })),
    } satisfies ChoiceCardData);
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
        origin: entry?.origin ?? '', importedAt: new Date().toLocaleString('th-TH'), createdAt: Date.now(),
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
    this.saveCurrentSession();
    this.activeSessionId.set(null);
    this.messages.set([WELCOME]);
    this.step.set('idle');
    this.formData.set({});
    this.submittedRefNo.set('');
    this.flowStartIdx = 0;
    this.queueShipmentId.set(null);
    this.allPermitAgencies.set([]);
    this.submittedPermits.set([]);
    this.ocr.reset();
  }

  /**
   * Session title prefix. Only uses numbers that come from an uploaded document
   * (invoiceNo from OCR on an invoice/customs/XML upload) or the final submitted
   * license ref. `fd.ref`/`fd.hsCode` are set as soon as an SPN entry is fetched —
   * before any file is uploaded — so they're deliberately excluded: until a real
   * document has been uploaded and OCR'd, the title shows only the current step name.
   */
  private buildBaseRef(): string {
    const fd = this.formData();
    return this.submittedRefNo() || fd.invoiceNo || '';
  }

  private buildStatusLabel(): string {
    const msgs = this.messages();
    const hasType = (t: string) => msgs.some(m => m.type === t);
    if (this.submittedRefNo()) {
      const hasPending = msgs.some(m => m.type === 'status-card' && !!(m.data as Record<string, unknown>)['isPending']);
      return hasPending ? `รอชำระ ${this.currentAgency}`.trim() : `ส่งกรมแล้ว ${this.currentAgency}`.trim();
    }
    if (hasType('form-preview'))   return 'ตรวจสอบก่อนส่งกรม';
    if (hasType('flag-card'))      return 'ยืนยัน flags';
    if (hasType('item-hs-analysis') || hasType('hs-analysis')) return 'วิเคราะห์ HS Code';
    if (hasType('ocr-results'))    return 'OCR เสร็จแล้ว';
    if (hasType('ocr-progress'))   return 'กำลัง OCR';
    if (hasType('agency-upload') || hasType('single-upload') || hasType('full-upload'))
                                   return 'อัปโหลดเอกสาร';
    if (hasType('choice-card') || hasType('import-license-menu')) return 'เลือกขั้นตอน';
    return 'เริ่มต้น';
  }

  private buildTitle(baseRef: string): string {
    const status = this.buildStatusLabel();
    return baseRef ? `${baseRef} · ${status}` : status;
  }

  /** Save current session in-place (no reorder). Creates new entry if no activeSessionId. */
  private saveCurrentSession(): void {
    const msgs = this.messages();
    if (!msgs.filter(m => m.role === 'user').length) return;
    const activeId = this.activeSessionId();
    const existing = activeId ? this.sessions().find(s => s.id === activeId) : undefined;
    const baseRef = existing?.baseRef ?? this.buildBaseRef();
    const id = activeId ?? ('sess_' + Date.now());
    const session: ChatHistorySession = { id, baseRef, title: this.buildTitle(baseRef), timestamp: Date.now(), messages: msgs };
    this.sessions.update(ss => {
      if (existing) {
        // update in-place — keep position
        return ss.map(s => s.id === id ? session : s);
      }
      // new session — prepend
      return [session, ...ss.filter(s => s.id !== id)].slice(0, 30);
    });
  }

  /** Called after a significant action: update title + promote session to top. */
  promoteActiveSession(): void {
    const activeId = this.activeSessionId();
    if (!activeId) return;
    const existing = this.sessions().find(s => s.id === activeId);
    if (!existing) return;
    const msgs = this.messages();
    const baseRef = existing.baseRef || this.buildBaseRef();
    const session: ChatHistorySession = { ...existing, baseRef, title: this.buildTitle(baseRef), timestamp: Date.now(), messages: msgs };
    this.sessions.update(ss => [session, ...ss.filter(s => s.id !== activeId)]);
  }

  loadSession(id: string): void {
    const session = this.sessions().find(s => s.id === id);
    if (!session) return;
    this.saveCurrentSession();   // save previous in-place (no reorder)
    this.activeSessionId.set(session.id);
    this.messages.set(session.messages);
    this.step.set('idle');
    this.formData.set({});
    this.submittedRefNo.set('');
    this.flowStartIdx = session.messages.length;
    this.queueShipmentId.set(null);
  }

  loadQueueSession(ship: { id: string; messages?: import('@app/core/models/types').ChatMessage[]; statusKey: string; formCode?: string; hs?: string; goods?: string; type?: 'IMP' | 'EXP'; }): void {
    const msgs = ship.messages ?? [];
    // For unresolved shipments, leave the last message live so the user can continue the flow
    const canResume = ship.statusKey === 'needs_you' && msgs.length > 0;
    const sealed = msgs.map((m, i) => ({ ...m, isReadOnly: canResume ? i < msgs.length - 1 : true }));
    this.messages.set(sealed.length ? sealed : [WELCOME]);
    this.flowStartIdx = sealed.length;
    this.queueShipmentId.set(ship.id);
    // direction only ever gets set from the welcome-menu choice (onDocTypeChoice) — resuming a
    // queue session skips that entirely, so without this an export session would silently
    // continue against whatever direction was last active (or the 'import' default), pulling the
    // wrong OCR mock for any later upload step in this resumed flow.
    this.direction.set(ship.type === 'EXP' ? 'export' : 'import');
    // saveEarlyQueueEntry()/finalizeSubmit() both key off lastShipmentId to update this shipment
    // in place rather than creating a new one — without restoring it here, continuing a resumed
    // session through to submit spawns a duplicate queue entry and leaves the original stranded.
    this.lastShipmentId = ship.id;
    if (canResume) this.restoreStateFromMessages(msgs);
    // Restore step from statusKey so send() context is correct
    const stepMap: Record<string, import('@app/core/models/types').ChatStep> = {
      needs_you: 'preview',
      submitted: 'done',
    };
    this.step.set((stepMap[ship.statusKey] as import('@app/core/models/types').ChatStep) ?? 'idle');
  }

  /** Rebuild the minimal service state needed for the last (unsealed) message's action to work correctly. */
  private restoreStateFromMessages(msgs: ChatMessage[]): void {
    let formData: LicenseFormData = {};
    this.isAgencyDocsUpload = false;
    for (const m of msgs) {
      if (m.type === 'ocr-results' || m.type === 'form-preview') {
        formData = { ...formData, ...(m.data as LicenseFormData) };
      }
      if (m.type === 'hs-analysis') {
        const d = m.data as HsAnalysisData;
        this.ALL_AGENCIES = d.agencies?.length ? d.agencies.map(a => a.code) : (d.agency && d.agency !== '—' ? [d.agency] : []);
        if (d.agency && d.agency !== '—') this.currentAgency = d.agency;
      }
      if (m.type === 'item-hs-analysis') {
        const d = m.data as ItemHsAnalysisData;
        const agencies = Array.from(new Set(d.items.filter(i => i.requiresPermit).map(i => i.agency)));
        this.ALL_AGENCIES = agencies;
        if (agencies.length) this.currentAgency = agencies[0];
      }
      // agency-upload only exists on the invoice-first path (chooseInvoiceFirst() → ... →
      // onProfileSelected() sets isAgencyDocsUpload right before posting this message — see there).
      // Resuming straight into this card without restoring the flag left continueAfterOCR() falling
      // through to the legacy full-upload/hs-analysis branch once the COA upload's OCR pass finished,
      // showing an unrelated generic analysis instead of continuing the real invoice-path flow.
      if (m.type === 'agency-upload') {
        this.isAgencyDocsUpload = true;
      }
    }
    this.formData.set(formData);
    this.submittedAgencies = [];
    this.pendingAfterFlow = 'proceed';
    this.checkMissingAfterFlags = msgs[msgs.length - 1]?.type === 'flag-card';
  }

  private delay(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
  }
}
