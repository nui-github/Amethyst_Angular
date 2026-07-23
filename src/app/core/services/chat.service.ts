import { Injectable, computed, signal } from '@angular/core';
import {
  ChatMessage, ChatHistorySession, ChatStep, LicenseFormData, MessageType,
  FlagCardData, FlagItem, ChoiceCardData, EmailDraftData,
  StatusCardData, OcrResultsData, SpnResultData, Shipment,
  MissingField, MissingFieldsData, PaymentSlipData, HsAnalysisData,
  InvoiceLineItem, ItemHsAnalysisData, ProductHsAnalysis, ItemMeasurementData, CustomsDeclarationData,
  InvoiceSelectData, Direction, AgencyDocsReturnedData, AgencyApprovalPendingData,
  ShipmentItem, ShipmentDocument, AgencyKey, RubberCertPaymentData,
  RubberEqcRequestData, RubberEqcGateData, RubberEqcStatusData,
  RubberEsfrGateData, RubberEsfrRequestData, RubberEsfrPreviewData, RubberEsfrStatusData, RubberEsfrFeeReceiptData,
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
import { RUBBER_COMPOUND_CERT_FEE, MOCK_LINKED_BANK_ACCOUNTS } from '@mock/rubber-cert.mock';
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

  // Full-screen RAOT "Rubber Certificate Request Message (e-QC)" panel — opened from a
  // rubber-eqc-gate card's "กรอกข้อมูล" button (see openRubberEqcEditor()); must be saved (all
  // required fields filled) before that card's "ดำเนินการต่อ" button appears and the e-QC fee
  // payment card (rubber-cert-payment) can be shown. rubberEqcEditorMsgId tracks which
  // rubber-eqc-gate message to write completed:true back into, same pattern as
  // declarationEditorMsgId above.
  readonly rubberEqcEditorOpen  = signal(false);
  readonly rubberEqcEditorMsgId = signal<string | null>(null);

  // Full-screen e-SFR (ผ่านด่านศุลกากร + ค่าธรรมเนียมส่งออก) panel — same gate/drawer pattern as
  // the e-QC one above, opened once the user picks "ทำ e-SFR ต่อ" after e-QC LICENSE ACCEPT (see
  // showEsfrChoice()/onEsfrFlowChoice()).
  readonly rubberEsfrEditorOpen  = signal(false);
  readonly rubberEsfrEditorMsgId = signal<string | null>(null);

  // Which side of the pipeline the current session is on — set once from showDocTypeChoice()'s
  // answer, threaded into formData.direction and every message that needs direction-aware copy
  // (single-upload title, ocr-results/form-preview/declaration-editor header sections).
  readonly direction = signal<Direction>('import');

  readonly needsYouCount = computed(() => this.queue.needsYouCount());

  private flowStartIdx = 0;
  private flagGen = 0;
  private emailGen = 0;
  private currentAgency = '';
  /** Read-only view of currentAgency for components outside ChatService (e.g. ChatPageComponent
   *  deciding which declaration-editor variant to show — DDC Pink Form is DDC-specific, not
   *  export-direction-specific). */
  get currentAgencyName(): string {
    return this.currentAgency;
  }

  /** Read-only view of the compound-rubber items pending the e-QC request/payment gate — used by
   *  RubberEqcRequestEditorComponent to build one item card per item, same access pattern as
   *  currentAgencyName above. */
  get pendingRubberItems(): ProductHsAnalysis[] {
    return this.pendingRubberFlowItems;
  }

  /** Read-only view of the e-QC request form's last-saved values, if any — lets
   *  RubberEqcRequestEditorComponent restore what the user already filled in when reopened via
   *  "กรอกข้อมูล" instead of resetting to blank. */
  get rubberEqcRequest(): RubberEqcRequestData | undefined {
    return this.rubberEqcRequestData;
  }

  /** Same restore-on-reopen pattern as rubberEqcRequest, for the e-SFR drawer. */
  get esfrRequest(): RubberEsfrRequestData | undefined {
    return this.esfrRequestData;
  }

  /** The e-QC Certificate No. just obtained this round — the e-SFR request needs it (the
   *  finish/continue choice-card that gates e-SFR already states an e-QC number is required), and
   *  RubberEsfrRequestEditorComponent has no other way to read it. */
  get eqcCertificateNo(): string {
    return this.lastEqcCertificateNo;
  }
  private submittedAgencies: string[] = [];
  // Shipment.id most recently pushed to the queue by finalizeSubmit() — checkStatus()'s approval
  // flow patches this record directly (e.g. setAgencyPaymentQr()) since it happens later in the
  // same session, after the shipment already exists in QueueService.
  private lastShipmentId: string | null = null;
  // True once saveEarlyQueueEntry() has run for the CURRENT agency round — reset at the top of
  // onProfileSelected() (every round, fresh or a "ขอใบอนุญาตเพิ่ม" repeat, starts there) and by
  // loadQueueSession() setting it straight to true (a record already exists for a resumed round).
  // Lets ensureQueueEntrySaved()/refreshQueueSnapshot() update the SAME round's record in place
  // instead of saveEarlyQueueEntry() creating a second one — needed now that the การยาง (RAOT)
  // e-QC wait card (showRubberEqcStatus()) creates the record earlier than continueAgencyFlow()
  // used to, so continueAgencyFlow() must not re-create it once the round reaches that point.
  private earlyEntrySavedForRound = false;

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
  // การยาง (RAOT) compound-rubber cert fee gate — see onProfileSelected()/showRubberCertPayment()
  private rubberCertPaid = false;
  private pendingRubberCertAgency = '';
  // Compound items pending a choice between requesting the e-QC cert now vs. going straight to
  // customs clearance (only legal once the e-QC number already exists — see onRubberFlowChoice()).
  private pendingRubberFlowItems: ProductHsAnalysis[] = [];
  // Set by onRubberCertPaid(), consumed (and cleared) by the very next saveEarlyQueueEntry() —
  // there's exactly one such call per agency round, right after the gate resolves.
  private rubberCertPaymentInfo?: Shipment['rubberCertPayment'];
  // Filled e-QC request form, persisted across re-opens of the drawer (see saveRubberEqcRequest()/
  // pendingRubberItems below) so re-clicking "กรอกข้อมูล" after the first save shows what was
  // already entered instead of resetting blank.
  private rubberEqcRequestData?: RubberEqcRequestData;
  // e-QC Certificate No. obtained this round — read by RubberEsfrRequestEditorComponent via the
  // eqcCertificateNo getter above. Set in onRubberEqcStatusProceed(), cleared in newChat().
  private lastEqcCertificateNo = '';
  // Filled e-SFR request form, same persist-across-reopens purpose as rubberEqcRequestData above.
  private esfrRequestData?: RubberEsfrRequestData;

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
  // entries for the same pairing) — "Pink Form" is DDC's own real form name specifically, not a
  // generic label for every QR_PAYMENT_AGENCIES member, so การยาง needs its own case (real RAOT
  // document is ใบอนุญาตค้ายาง under พ.ร.บ.ควบคุมยาง — see product-hs-analysis licenseType).
  private formForAgency(agency: string): { code: string; name: string } {
    const isExport = this.direction() === 'export';
    if (agency === 'กรมควบคุมโรค') {
      return {
        code: 'Pink Form',
        name: `คำขออนุญาต${isExport ? 'ส่งออก' : 'นำเข้า'} (Pink Form) — ${agency}`,
      };
    }
    if (agency === 'การยาง') {
      return {
        code: 'ใบอนุญาตค้ายาง',
        name: `คำขอใบอนุญาตค้ายาง${isExport ? 'ขาออก' : ''} — การยางแห่งประเทศไทย (RAOT)`,
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
    // Every call here starts a fresh agency round (including each "ขอใบอนุญาตเพิ่ม" repeat) — reset
    // so this round's first ensureQueueEntrySaved() call creates its own record instead of patching
    // whatever round happened to run before it.
    this.earlyEntrySavedForRound = false;
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

    // การยาง (RAOT) gate: compound-rubber items (isCompound) must resolve a choice — request the
    // หนังสือรับรองคุณภาพยาง (e-QC) + fee now (bank account debit), or go straight to customs
    // clearance (only legal if the e-QC number already exists) — BEFORE any of the branches below
    // run. Cheaper to check once here than duplicate the check in every branch.
    const compoundItems = agency
      ? this.confirmedProductItems.filter(i => i.agency === agency && i.isCompound)
      : [];
    if (compoundItems.length > 0 && !this.rubberCertPaid) {
      this.pendingRubberCertAgency = agency!;
      this.showRubberFlowChoice(agency!, compoundItems);
      return;
    }
    this.continueAgencyFlow(agency!);
  }

  /** The "what happens after profile confirmed" branch — extracted from onProfileSelected()
   *  so it can also run after the การยาง compound-rubber cert fee is paid (onRubberCertPaid()),
   *  without re-running the profile/spnSession setup above. Determine what to do based on
   *  pendingAfterFlow (set before agency choice). */
  private continueAgencyFlow(agency: string): void {
    if (this.pendingAfterFlow === 'agency-docs') {
      // Invoice path: show agency-upload
      this.withTyping(() => {
        this.bot('text', undefined, `กรุณาอัปโหลดเอกสารประกอบที่${agency}ต้องการครับ`);
        setTimeout(() => this.withTyping(() => {
          this.isAgencyDocsUpload = true;
          this.bot('agency-upload', { agency });
          this.ensureQueueEntrySaved(this.currentAgency);
        }, 400), 600);
      }, 500);
    } else if (this.pendingAfterFlow === 'form-preview') {
      // Customs path: every item AI grouped under this agency is the request — no re-selection
      this.selectAllAgencyItems();
      this.withTyping(() => {
        this.showPreview();
        this.ensureQueueEntrySaved(this.currentAgency);
      }, 500);
    } else {
      // SPN path: every item AI grouped under this agency is the request — no re-selection
      this.selectAllAgencyItems();
      this.withTyping(() => {
        this.showProceedChoice();
        this.ensureQueueEntrySaved(this.currentAgency);
      }, 500);
    }
  }

  /** Saves this round's queue record the first time it's called (saveEarlyQueueEntry()), or just
   *  re-snapshots the live messages/stage onto the already-saved record on every later call —
   *  needed now that showRubberEqcStatus() can save the record earlier than continueAgencyFlow()
   *  used to, so continueAgencyFlow() reaching this same round later must patch it, not duplicate
   *  it. */
  private ensureQueueEntrySaved(agency: string): void {
    if (this.earlyEntrySavedForRound) {
      this.refreshQueueSnapshot();
    } else {
      this.saveEarlyQueueEntry(agency);
    }
  }

  /** Re-snapshots this round's live messages/stage onto the already-saved queue record — keeps the
   *  queue and chat in sync whenever something changes after the record was first created (e.g. the
   *  การยาง (RAOT) e-QC card flipping from 'rubber-accept' to 'rubber-accept-ready'). No-op for a
   *  resumed session (queueShipmentId set) — syncQueueProgress() already handles merging a resumed
   *  session's new progress back on newChat(), and its merge (append) semantics are the correct ones
   *  there, unlike this method's full-replace snapshot which assumes flowStartIdx marks the round's
   *  true start (only true for a fresh, non-resumed round). */
  private refreshQueueSnapshot(): void {
    if (this.queueShipmentId()) return;
    if (!this.lastShipmentId) return;
    const ship = this.queue.get(this.lastShipmentId);
    if (!ship) return;
    const messages = this.messages().slice(this.flowStartIdx);
    this.queue.update(this.lastShipmentId, {
      messages,
      stage: Math.max(ship.stage, this.deriveStageFromMessages(messages)),
    });
  }

  /** Posts a 2-way choice — gated between เลือกโปรไฟล์ and the agency's next step whenever the
   *  confirmed การยาง group contains a compound-rubber item: request the e-QC quality cert now,
   *  or go straight to customs clearance + export fee (only legal if the e-QC number already
   *  exists, i.e. this session already paid for it earlier this round). */
  private showRubberFlowChoice(agency: string, items: ProductHsAnalysis[]): void {
    this.pendingRubberFlowItems = items;
    this.withTyping(() => {
      this.bot('choice-card', {
        question: 'ท่านต้องการดำเนินการขั้นตอนใดต่อ?',
        subtitle: 'ท่านสามารถขอหนังสือรับรองคุณภาพยาง (e-QC) ก่อนได้ เพื่อนำเลขหนังสือรับรองไปใช้ต่อในการขอใบอนุญาตและชำระค่าธรรมเนียม (e-SFR)',
        options: [
          {
            label: 'ขอหนังสือรับรองคุณภาพยาง (e-QC)',
            value: 'rubber-eqc',
            description: `สำหรับรายการยางผสม (${items.length} รายการ) — ต้องขอและชำระค่าธรรมเนียมก่อนส่งออก`,
          },
          {
            label: 'ขอใบอนุญาตผ่านด่านศุลกากร และชำระค่าธรรมเนียมส่งยางออกนอกราชอาณาจักร (e-SFR)',
            value: 'rubber-customs-fee',
            description: 'หมายเหตุ: รายการยางผสมต้องมีเลขหนังสือรับรองคุณภาพยาง (e-QC) แล้วจึงจะขอขั้นตอนนี้ได้',
          },
        ],
      } satisfies ChoiceCardData);
    }, 500);
  }

  /** Called from ChatAreaComponent when the user picks an option on the rubber-flow choice-card. */
  onRubberFlowChoice(value: string): void {
    if (value === 'rubber-eqc') {
      this.user('ขอหนังสือรับรองคุณภาพยาง (e-QC)');
      this.showRubberEqcGate(this.pendingRubberCertAgency, this.pendingRubberFlowItems);
      return;
    }
    this.user('ขอใบอนุญาตผ่านด่านศุลกากร และชำระค่าธรรมเนียมส่งยางออกนอกราชอาณาจักร');
    if (!this.rubberCertPaid) {
      this.withTyping(() => {
        this.bot('text', undefined, 'รายการยางผสมยังไม่มีเลขหนังสือรับรองคุณภาพยาง (e-QC) กรุณาขอหนังสือรับรองให้เรียบร้อยก่อน จึงจะขอใบอนุญาตผ่านด่านศุลกากรได้ครับ');
        this.showRubberFlowChoice(this.pendingRubberCertAgency, this.pendingRubberFlowItems);
      }, 500);
      return;
    }
    this.continueAgencyFlow(this.pendingRubberCertAgency);
  }

  /** Posts the rubber-eqc-gate card — only a "กรอกข้อมูล" button shows until the request-form
   *  drawer is saved (data.completed), forcing the user to fill it before "ดำเนินการต่อ" appears. */
  private showRubberEqcGate(agency: string, items: ProductHsAnalysis[]): void {
    this.withTyping(() => {
      this.bot('rubber-eqc-gate', {
        agency,
        itemNames: items.map(i => i.name),
        completed: false,
      } satisfies RubberEqcGateData);
    }, 500);
  }

  /** Called from RubberEqcGateComponent's "กรอกข้อมูล" button. */
  openRubberEqcEditor(msgId: string): void {
    this.rubberEqcEditorMsgId.set(msgId);
    this.rubberEqcEditorOpen.set(true);
  }

  /** Called from RubberEqcRequestEditorComponent's close button — no partial save, matches
   *  CustomsDeclarationEditorComponent/DdcPinkFormEditorComponent's onClose() convention. */
  closeRubberEqcEditor(): void {
    this.rubberEqcEditorOpen.set(false);
  }

  /** Called from RubberEqcRequestEditorComponent once every required field is filled and the
   *  user confirms save — every required field was already validated there. Persists the filled
   *  data (so reopening "กรอกข้อมูล" later shows it instead of resetting blank), closes the panel,
   *  and marks the originating rubber-eqc-gate message complete so "ดำเนินการต่อ" appears. */
  saveRubberEqcRequest(data: RubberEqcRequestData): void {
    this.rubberEqcRequestData = data;
    this.rubberEqcEditorOpen.set(false);
    const msgId = this.rubberEqcEditorMsgId();
    if (msgId) {
      this.messages.update(ms => ms.map(m =>
        m.id === msgId && m.type === 'rubber-eqc-gate'
          ? { ...m, data: { ...(m.data as RubberEqcGateData), completed: true } }
          : m
      ));
    }
  }

  /** Called from RubberEqcGateComponent's "ดำเนินการต่อ" button, only reachable once the request
   *  form has been saved at least once. Moves on to the e-QC submission-status card. */
  onRubberEqcGateProceed(): void {
    this.user('ดำเนินการต่อ');
    this.withTyping(() => this.showRubberEqcStatus(this.pendingRubberCertAgency), 400);
  }

  /** Posts the rubber-eqc-status card — starts as 'rubber-accept' (request accepted by RAOT;
   *  card explains the user must send the sample piece to the officer for inspection, ~3-7
   *  business days), then after a mock 3s wait (standing in for the real inspection turnaround)
   *  flips in place to 'rubber-accept-ready', which enables the card's own "ดำเนินการต่อ" button.
   *  The full license detail only appears once the user clicks that button — see
   *  onRubberEqcStatusProceed(). */
  private showRubberEqcStatus(agency: string): void {
    const req = this.rubberEqcRequestData;
    const account = MOCK_LINKED_BANK_ACCOUNTS.find(a => a.id === req?.paymentAccountId);
    const amount = req?.paymentAmount ?? RUBBER_COMPOUND_CERT_FEE;
    const paidAccountLabel = account ? `${account.bankName} ${account.accountNoMasked}` : '';
    const labCode = req?.labCode;

    this.bot('rubber-eqc-status', {
      agency,
      status: 'rubber-accept',
      amount,
      paidAccountLabel,
      labCode,
    } satisfies RubberEqcStatusData);

    // Save/update the queue record NOW, not only once the whole e-QC wait resolves — the user has
    // to wait 3-7 real business days here, so they need to be able to leave and pick this session
    // back up from คิวงาน while it's still pending, not just once it's done.
    this.ensureQueueEntrySaved(agency);

    setTimeout(() => {
      this.updateLastMessageData('rubber-eqc-status', {
        agency,
        status: 'rubber-accept-ready',
        amount,
        paidAccountLabel,
        labCode,
      } satisfies RubberEqcStatusData);
      this.refreshQueueSnapshot();
    }, 3000);
  }

  /** Called from RubberEqcStatusComponent's "ดำเนินการต่อ" button — only reachable once the mock
   *  inspection result flips the card to 'rubber-accept-ready'. Seals that card read-only and
   *  posts a NEW rubber-eqc-status message carrying the full 'license-accept' detail (Certificate
   *  No. and issuer info), then continues the agency flow. Reads amount/paidAccountLabel/labCode
   *  back off the card just sealed rather than this.rubberEqcRequestData — that field is never
   *  restored by a queue resume (loadQueueSession()), but the values already posted on the card ARE
   *  always present, resumed or not, so this stays correct either way. */
  onRubberEqcStatusProceed(): void {
    const agency = this.pendingRubberCertAgency;
    const prior = [...this.messages()].reverse().find(m => m.type === 'rubber-eqc-status')?.data as RubberEqcStatusData | undefined;
    const amount = prior?.amount ?? RUBBER_COMPOUND_CERT_FEE;
    const paidAccountLabel = prior?.paidAccountLabel ?? '';
    const labCode = prior?.labCode;

    this.markLastReadOnly('rubber-eqc-status');
    this.user('ดำเนินการต่อ');
    this.withTyping(() => {
      const certificateNo = `RAOT-EQC-2568-${Math.floor(100000 + Math.random() * 900000)}`;
      const issueDate = new Date().toISOString().slice(0, 10);
      const expireDate = new Date(Date.now() + 45 * 24 * 3600_000).toISOString().slice(0, 10);

      this.bot('rubber-eqc-status', {
        agency,
        status: 'license-accept',
        amount,
        paidAccountLabel,
        certificateNo,
        issueDate,
        expireDate,
        issuerOrgId: '0994001057192',
        issuerNameTh: 'การยางแห่งประเทศไทย',
        issuerNameEn: 'Rubber Authority of Thailand',
        issuerAddressTh: '67/25 ถนนบางขุนนนท์ บางขุนนนท์ เขตบางกอกน้อย กรุงเทพมหานคร',
        issuerAddressEn: '67/25 Bangkhunnon, Bangkoknoi, Bangkok 10700',
        issuerAuthorizerNameTh: 'ผู้มีอำนาจ ลงนาม',
        issuerAuthorizerPositionTh: 'ผู้อำนวยการฝ่ายอุตสาหกรรมยาง',
        issuerAuthorizerNameEn: 'ผู้มีอำนาจ ลงนาม',
        issuerAuthorizerPositionEn: 'Chief of Rubber Industry',
        labCode,
        labNameEn: 'Analytical chemistry laboratory',
        labAddressTh: 'ถนน พหลโยธิน ลาดยาว จตุจักร กรุงเทพมหานคร 10900',
        labAddressEn: 'Phaholyothin Road, Ladyao, Chatuchak, Bangkok 10900',
        labTestStartDate: issueDate,
        labTestEndDate: issueDate,
        labSampleReceivedDate: issueDate,
        labStaffName: 'น.ส. ชัญญา ศิระเลิศ',
        labStaffPosition: 'N/A',
        labPhone: '0-2433-2222',
        labFax: '0-2433-6490',
        remark: '',
        certUrl: SAMPLE_DOC_URL,
      } satisfies RubberEqcStatusData);

      this.rubberCertPaid = true;
      this.lastEqcCertificateNo = certificateNo;
      this.rubberCertPaymentInfo = {
        itemNames: this.pendingRubberFlowItems.map(i => i.name),
        amount,
        refNo: certificateNo,
        paidAccountLabel,
        certUrl: SAMPLE_DOC_URL,
        paidAt: new Date().toLocaleDateString('th-TH'),
      };
      this.showEsfrChoice(agency);
    }, 500);
  }

  /** Posted right after e-QC LICENSE ACCEPT — offers "เสร็จสิ้น" (skip e-SFR for now, continue the
   *  normal agency flow) or "ทำ e-SFR ต่อ" (fill in the e-SFR request now, gated behind having just
   *  obtained the e-QC number). */
  private showEsfrChoice(agency: string): void {
    this.withTyping(() => {
      this.bot('choice-card', {
        question: 'ต้องการดำเนินการขั้นตอนใดต่อ?',
        subtitle: 'ได้รับหนังสือรับรองคุณภาพยาง (e-QC) แล้ว ท่านสามารถขอผ่านด่านศุลกากรและชำระค่าธรรมเนียมส่งออก (e-SFR) ต่อได้เลย หรือจะทำภายหลังก็ได้',
        options: [
          { label: 'เสร็จสิ้น', value: 'esfr-finish', description: 'ดำเนินการขั้นตอน e-SFR ภายหลัง' },
          { label: 'ทำ e-SFR ต่อ', value: 'esfr-continue', description: 'ขอผ่านด่านศุลกากร และชำระค่าธรรมเนียมส่งยางออกนอกราชอาณาจักรตอนนี้เลย' },
        ],
      } satisfies ChoiceCardData);
    }, 500);
  }

  /** Called from ChatAreaComponent when the user picks an option on the e-SFR finish/continue
   *  choice-card. */
  onEsfrFlowChoice(value: string): void {
    const agency = this.pendingRubberCertAgency;
    if (value === 'esfr-continue') {
      this.user('ทำ e-SFR ต่อ');
      this.showEsfrGate(agency, this.pendingRubberFlowItems);
      return;
    }
    this.user('เสร็จสิ้น');
    this.continueAgencyFlow(agency);
  }

  /** Posts the rubber-esfr-gate card — same "กรอกข้อมูล"-only-until-saved pattern as
   *  showRubberEqcGate() above. */
  private showEsfrGate(agency: string, items: ProductHsAnalysis[]): void {
    this.withTyping(() => {
      this.bot('rubber-esfr-gate', {
        agency,
        itemNames: items.map(i => i.name),
        completed: false,
      } satisfies RubberEsfrGateData);
    }, 500);
  }

  /** Called from RubberEsfrGateComponent's "กรอกข้อมูล" button. */
  openEsfrEditor(msgId: string): void {
    this.rubberEsfrEditorMsgId.set(msgId);
    this.rubberEsfrEditorOpen.set(true);
  }

  /** Called from RubberEsfrRequestEditorComponent's close button — no partial save. */
  closeEsfrEditor(): void {
    this.rubberEsfrEditorOpen.set(false);
  }

  /** Called from RubberEsfrRequestEditorComponent once every required field is filled and the
   *  user confirms save — mirrors saveRubberEqcRequest() above. The editor can be reopened from
   *  either the gate card (first fill) or the preview card (edit-after-preview), so this patches
   *  whichever one's msgId is currently tracked — the gate just flips its `completed` flag, the
   *  preview gets its whole `request` swapped in place so the summary reflects the edit. */
  saveEsfrRequest(data: RubberEsfrRequestData): void {
    this.esfrRequestData = data;
    this.rubberEsfrEditorOpen.set(false);
    const msgId = this.rubberEsfrEditorMsgId();
    if (msgId) {
      this.messages.update(ms => ms.map(m => {
        if (m.id !== msgId) return m;
        if (m.type === 'rubber-esfr-gate') {
          return { ...m, data: { ...(m.data as RubberEsfrGateData), completed: true } };
        }
        if (m.type === 'rubber-esfr-preview') {
          return { ...m, data: { ...(m.data as RubberEsfrPreviewData), request: data } };
        }
        return m;
      }));
    }
  }

  /** Called from RubberEsfrGateComponent's "ดำเนินการต่อ" button, only reachable once the e-SFR
   *  request form has been saved at least once. Moves on to the read-only preview card instead of
   *  submitting directly — the user gets one more look at everything before it actually goes out. */
  onEsfrGateProceed(): void {
    this.markLastReadOnly('rubber-esfr-gate');
    this.user('ดำเนินการต่อ');
    this.withTyping(() => this.showEsfrPreview(this.pendingRubberCertAgency), 500);
  }

  /** Posts the rubber-esfr-preview card — a read-only summary of the just-saved e-SFR request,
   *  with "แก้ไขข้อมูล" (reopen the editor) and "ส่งคำขอใบอนุญาต" (actually submit) in its footer. */
  private showEsfrPreview(agency: string): void {
    if (!this.esfrRequestData) return;
    this.bot('rubber-esfr-preview', {
      agency,
      request: this.esfrRequestData,
    } satisfies RubberEsfrPreviewData);
  }

  /** Called from RubberEsfrPreviewComponent's "ส่งคำขอใบอนุญาต" button — seals the preview card
   *  read-only and moves on to the submission-status card. */
  onEsfrPreviewSubmit(msgId: string): void {
    this.messages.update(list => list.map(m => m.id === msgId ? { ...m, isReadOnly: true } : m));
    this.user('ส่งคำขอใบอนุญาต');
    this.withTyping(() => this.showEsfrStatus(this.pendingRubberCertAgency), 500);
  }

  /** Posts the rubber-esfr-status card — starts as 'rubber-accept' (request accepted by RAOT),
   *  then after a mock 3s wait (same convention as showRubberEqcStatus()) flips in place to
   *  'license-accept', which enables the card's own "ดำเนินการต่อ" button. */
  private showEsfrStatus(agency: string): void {
    const referenceNumber = this.esfrRequestData?.referenceNumber ?? '';

    this.bot('rubber-esfr-status', {
      agency,
      referenceNumber,
      status: 'rubber-accept',
    } satisfies RubberEsfrStatusData);

    this.ensureQueueEntrySaved(agency);

    setTimeout(() => {
      this.updateLastMessageData('rubber-esfr-status', {
        agency,
        referenceNumber,
        status: 'license-accept',
      } satisfies RubberEsfrStatusData);
      this.refreshQueueSnapshot();
    }, 3000);
  }

  /** Called from RubberEsfrStatusComponent's "ดำเนินการต่อ" button — only reachable once the mock
   *  wait flips the card to 'license-accept'. Posts the fee-receipt card (terminal display for the
   *  e-SFR flow — see RubberEsfrFeeReceiptData) then continues the normal agency flow. */
  onEsfrStatusProceed(): void {
    const agency = this.pendingRubberCertAgency;
    const referenceNumber = this.esfrRequestData?.referenceNumber ?? '';
    this.markLastReadOnly('rubber-esfr-status');
    this.user('ดำเนินการต่อ');
    this.withTyping(() => {
      this.bot('rubber-esfr-fee-receipt', {
        agency,
        referenceNumber,
        licenseNumber: `ERL19004-${(new Date().getFullYear() + 543) % 100}/${String(Math.floor(10000 + Math.random() * 90000))}`,
        issueDate: new Date().toLocaleDateString('en-GB').split('/').join('-'),
        issueAuthority: '0994001057192-การยางแห่งประเทศไทย',
        message: 'พร้อมที่จะผ่านพิธีการศุลกากรใบขนสินค้าขาออก',
        effectiveDate: new Date().toLocaleDateString('en-GB').split('/').join('-'),
        expireDate: new Date(Date.now() + 30 * 24 * 3600_000).toLocaleDateString('en-GB').split('/').join('-'),
        receiptUrl: SAMPLE_DOC_URL,
      } satisfies RubberEsfrFeeReceiptData);
      this.continueAgencyFlow(agency);
    }, 500);
  }

  /** Posts the rubber-cert-payment card — gated between เลือกโปรไฟล์ and the agency's next step
   *  whenever the confirmed การยาง group contains a compound-rubber item. */
  private showRubberCertPayment(agency: string, items: ProductHsAnalysis[]): void {
    this.withTyping(() => {
      this.bot('rubber-cert-payment', {
        agency,
        itemNames: items.map(i => i.name),
        amount: RUBBER_COMPOUND_CERT_FEE,
        refNo: `RC-2568-${Math.floor(100000 + Math.random() * 900000)}`,
        accounts: MOCK_LINKED_BANK_ACCOUNTS,
      } satisfies RubberCertPaymentData);
    }, 500);
  }

  /** Called from RubberCertPaymentComponent once the user confirms payment. */
  onRubberCertPaid(data: RubberCertPaymentData, accountId: string): void {
    this.updateLastMessageData('rubber-cert-payment', { ...data, paid: true, paidAccountId: accountId });
    this.markLastReadOnly('rubber-cert-payment');
    this.user('ชำระค่าธรรมเนียมใบรับรองยางผสมแล้ว');
    this.rubberCertPaid = true;
    const account = MOCK_LINKED_BANK_ACCOUNTS.find(a => a.id === accountId);
    this.rubberCertPaymentInfo = {
      itemNames: data.itemNames,
      amount: data.amount,
      refNo: data.refNo,
      paidAccountLabel: account ? `${account.bankName} ${account.accountNoMasked}` : '',
      certUrl: SAMPLE_DOC_URL,
      paidAt: new Date().toLocaleDateString('th-TH'),
    };
    this.continueAgencyFlow(this.pendingRubberCertAgency);
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

  /** CustomsDeclarationItem.itemNumber set for whichever items the confirmed item-hs-analysis
   *  grouped under `agency` — lets an agency-specific editor (e.g. DdcPinkFormEditorComponent)
   *  narrow decl.items down to just its own certificate's item(s) instead of every item on the
   *  shared invoice (continueAfterOCR()'s isAgencyDocsUpload branch deliberately sets
   *  formData.selectedItems to the WHOLE invoice regardless of agency — "every line item on the
   *  uploaded invoice is the request" — so that alone can't be used to filter). Empty when nothing's
   *  been confirmed yet (e.g. the customs-first path's gate, which runs before item-hs-analysis) —
   *  callers should fall back to showing every item in that case. */
  declarationItemNumbersForAgency(agency: string): Set<number> {
    const items = mapExportItemsToInvoiceLineItems(this.confirmedProductItems.filter(i => i.agency === agency));
    return new Set(items.map(i => i.declarationItemNumber).filter((n): n is number => n !== undefined));
  }

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

  /** Swaps the `data` on the most recent message of `type` in place — used by showAgencyApproval()
   *  to flip its pending card over to the approved state without posting a second message. */
  private updateLastMessageData(type: MessageType, data: unknown): void {
    const msgs = this.messages();
    const idx = [...msgs].reverse().findIndex(m => m.type === type);
    if (idx === -1) return;
    const actual = msgs.length - 1 - idx;
    this.messages.update(list => list.map((m, i) => i === actual ? { ...m, data } : m));
  }

  // Agencies whose "ตรวจสอบสถานะ" chip simulates a real department approval → (QR payment if a
  // fee applies) → returned-documents flow, instead of opening the generic permit-status list.
  private readonly QR_PAYMENT_AGENCIES = ['กรมควบคุมโรค', 'การยาง'];

  /** StatusCardComponent uses this to hide its "ตรวจสอบสถานะ" chip for QR_PAYMENT_AGENCIES —
   *  finalizeSubmit() now posts the approval step for them automatically, so the chip would just
   *  be dead UI (see finalizeSubmit()'s QR_PAYMENT_AGENCIES branch). */
  isAutoApprovalAgency(agency?: string): boolean {
    return !!agency && this.QR_PAYMENT_AGENCIES.includes(agency);
  }

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
      // Posts a "กำลังตรวจสอบ..." card first, standing in for the wait on the department's own
      // API to respond, then flips the same message over to the approved state — rather than
      // jumping straight to "อนุมัติแล้ว" with no sense that a real review happened. Approval and
      // the QR itself are two separate, independently-timed events from the department's side —
      // see markDeptApproved() — so paymentQr is deliberately NOT set here; the queue detail page
      // shows a "waiting on the QR" card until the user mocks its arrival there.
      this.bot('agency-approval-pending', { agency, pending: true } satisfies AgencyApprovalPendingData);
      setTimeout(() => {
        this.updateLastMessageData('agency-approval-pending', { agency, pending: false });
        this.markDeptApproved(agency);
        this.withTyping(() => this.showNextAgencyIfAny(), 700);
      }, 3000);
    } else {
      this.bot('text', undefined, `${agency}ตรวจสอบและอนุมัติคำขอแล้วครับ ✅`);
      this.withTyping(() => this.showAgencyReturnedDocs(agency), 600);
    }
  }

  /** Flags the shipment's queue record as department-approved — QueuePageComponent reads this to
   *  swap its "รอการตรวจสอบและอนุมัติ" card for a "รอ QR จากกรม" one (paymentQr itself only gets
   *  set once the user mocks the QR's arrival there, via QueuePageComponent.mockQrArrival()). */
  private markDeptApproved(agency: string): void {
    if (!this.lastShipmentId) return;
    const ship = this.queue.get(this.lastShipmentId);
    if (!ship) return;
    this.queue.update(this.lastShipmentId, {
      deptApproved: true,
      audit: [...ship.audit, { time: getTime(), text: `${agency}ตรวจสอบและอนุมัติคำขอแล้ว`, by: agency }],
    });
  }

  private showAgencyReturnedDocs(agency: string): void {
    const docs = getAgencyReturnDocs(agency);
    this.bot('agency-docs-returned', { agency, docs } satisfies AgencyDocsReturnedData);
    // Also persist onto the queue record — mirrors QueuePageComponent.payQr()'s equivalent write
    // for the QR-fee branch, so the final permit (e.g. ใบอนุญาตค้ายาง) shows up in the queue
    // detail's "ผลการยื่น" card too, not just as a transient chat card.
    if (this.lastShipmentId) {
      const doneTime = getTime();
      this.queue.update(this.lastShipmentId, {
        returnedDocuments: docs.map((d, i) => ({
          id: `pd_${this.lastShipmentId}_${i}`, name: d.label, fileType: 'pdf', category: 'other',
          url: d.url, uploadedAt: doneTime,
        })),
      });
    }
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
      rubberCertPayment: this.rubberCertPaymentInfo,
    };
    this.rubberCertPaymentInfo = undefined;

    this.queue.add([shipment]);
    this.lastShipmentId = shipment.id;
    this.earlyEntrySavedForRound = true;
  }

  private finalizeSubmit(refNo: string, feeNote?: string): void {
    this.promoteActiveSession();
    const fd = this.formData();

    const agencyKey: AgencyKey = this.AGENCY_KEY_MAP[this.currentAgency] ?? 'none';
    const form = this.formForAgency(this.currentAgency);

    // Posted BEFORE the flowMsgs snapshot below so the status-card message is actually included
    // in the saved Shipment.messages — QueuePageComponent.openSubmissionResult() (queue-page.
    // component.ts) finds its "ผลการยื่น" data by scanning ship.messages for a status-card
    // message; posting it after the snapshot silently left every live-submitted shipment with no
    // ผลการยื่น card at all on the queue page (only the static mock data had one baked in).
    this.bot('status-card', {
      refNo, customsRef: fd.ref ?? fd.invoiceNo ?? '—',
      submittedAt: new Date().toLocaleDateString('th-TH'),
      feeNote, agency: this.currentAgency,
    } satisfies StatusCardData);

    const flowMsgs = this.messages().slice(this.flowStartIdx);

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

    if (this.currentAgency) {
      this.submittedAgencies.push(this.currentAgency);
      this.submittedPermits.update(ps => [...ps, {
        agency: this.currentAgency,
        refNo,
        submittedAt: new Date().toLocaleDateString('th-TH'),
        licenseType: fd.licenseType ?? 'RGoods',
        invoiceRef: fd.ref ?? fd.invoiceNo ?? '—',
      }]);
      // QR_PAYMENT_AGENCIES must finish approval → (QR payment in the queue page, if a fee
      // applies, else returned docs right away) first — showNextAgencyIfAny() runs from
      // showAgencyApproval()/showAgencyReturnedDocs() instead for those. Posted automatically
      // here rather than waiting on the status-card's "ตรวจสอบสถานะ" chip (not shown for these
      // agencies — see StatusCardComponent/isAutoApprovalAgency()) since the department review
      // is simulated anyway; no reason to make the user click through it.
      if (this.QR_PAYMENT_AGENCIES.includes(this.currentAgency)) {
        this.withTyping(() => this.showAgencyApproval(this.currentAgency), 900);
      } else {
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
    this.syncQueueProgress();
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
    this.rubberCertPaid = false;
    this.earlyEntrySavedForRound = false;
    this.pendingRubberCertAgency = '';
    this.pendingRubberFlowItems = [];
    this.rubberCertPaymentInfo = undefined;
    this.rubberEqcEditorOpen.set(false);
    this.rubberEqcEditorMsgId.set(null);
    this.rubberEqcRequestData = undefined;
    this.lastEqcCertificateNo = '';
    this.rubberEsfrEditorOpen.set(false);
    this.rubberEsfrEditorMsgId.set(null);
    this.esfrRequestData = undefined;
    this.ocr.reset();
  }

  // Type→audit-label map for whatever the user progressed through in a resumed session that never
  // reached "ยืนยันส่งกรม" — syncQueueProgress() below appends one entry per new step reached, so
  // the queue detail's own Audit trail card reflects "the last step discussed", not the state the
  // shipment was in when loadQueueSession() first opened it.
  private readonly STEP_AUDIT_LABELS: Partial<Record<MessageType, string>> = {
    'ocr-results': 'OCR อ่านข้อมูลสำเร็จ',
    'hs-analysis': 'วิเคราะห์ HS Code แล้ว',
    'item-hs-analysis': 'วิเคราะห์และจัดกลุ่มสินค้าตามกรมแล้ว',
    'agency-upload': 'อัปโหลดเอกสารประกอบกรมแล้ว',
    'missing-fields': 'กรอกข้อมูลที่ขาดหายแล้ว',
    'form-preview': 'ตรวจสอบข้อมูลก่อนส่งกรมแล้ว',
    'flag-card': 'ยืนยันจุดที่ต้องตรวจสอบแล้ว',
    'item-measurement': 'กรอกข้อมูล Measurement แล้ว',
  };

  /** How far the steps-bar (queue-page's STAGE_LABELS) should advance given the message types seen
   *  so far — mirrors the stage numbers already hand-authored per step in queue.mock.ts, so a
   *  synced-back session lines up with those same checkpoints instead of drifting. */
  private deriveStageFromMessages(msgs: ChatMessage[]): number {
    const hasType = (t: MessageType) => msgs.some(m => m.type === t);
    if (hasType('form-preview')) return 6;
    if (hasType('agency-upload') && msgs.filter(m => m.type === 'ocr-results').length >= 2) return 5;
    if (hasType('agency-upload')) return 4;
    if (hasType('item-hs-analysis') || hasType('hs-analysis')) return 3;
    if (hasType('ocr-results')) return 2;
    return 1;
  }

  /** Persists whatever progress a RESUMED ("ดำเนินการต่อ") session made back onto its Shipment
   *  record, even if the flow was left unfinished — otherwise the queue detail view (steps-bar,
   *  audit trail) stays frozen at the point loadQueueSession() first opened it, and the next
   *  "ดำเนินการต่อ" would restore state from a stale, incomplete message history. A flow that DID
   *  reach "ยืนยันส่งกรม" is already fully handled by finalizeSubmit()'s own queue.update(), so this
   *  is a no-op once submittedRefNo is set — re-running it would re-append the whole flow a second
   *  time, since flowStartIdx isn't advanced mid-flow. */
  private syncQueueProgress(): void {
    const shipmentId = this.queueShipmentId();
    if (!shipmentId || this.submittedRefNo()) return;
    const ship = this.queue.get(shipmentId);
    if (!ship) return;
    const newMsgs = this.messages().slice(this.flowStartIdx);
    if (newMsgs.length === 0) return;

    const mergedMessages = [...(ship.messages ?? []), ...newMsgs];
    const newAuditTexts = newMsgs
      .map(m => this.STEP_AUDIT_LABELS[m.type])
      .filter((text): text is string => !!text && !ship.audit.some(a => a.text === text));
    const audit = [
      ...ship.audit,
      ...newAuditTexts.map(text => ({ time: getTime(), text, by: 'เจ้าหน้าที่' as const })),
    ];

    const fd = this.formData();
    const items: ShipmentItem[] | undefined = fd.selectedItems?.length
      ? fd.selectedItems.map(i => ({
          id: i.id, name: i.name, hsCode: i.hsCode, origin: i.origin,
          quantity: i.quantity, unit: i.unit, lotNo: i.lotNo, amount: i.amount,
        }))
      : undefined;

    this.queue.update(shipmentId, {
      messages: mergedMessages,
      audit,
      stage: Math.max(ship.stage, this.deriveStageFromMessages(mergedMessages)),
      ...(items ? { items, itemsSelected: true } : {}),
    });
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
    // A record already exists for this round — without this, continueAgencyFlow() reaching
    // ensureQueueEntrySaved() later in a resumed session would call saveEarlyQueueEntry() again
    // and spawn a duplicate shipment instead of patching this one.
    this.earlyEntrySavedForRound = true;
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
      if (m.type === 'rubber-eqc-gate') {
        const d = m.data as RubberEqcGateData;
        this.pendingRubberCertAgency = d.agency;
        // Only `.name` is read by RubberEqcRequestEditorComponent when building fresh item cards
        // (see its ngOnInit) — a lightweight reconstruction is enough to resume "กรอกข้อมูล" here.
        this.pendingRubberFlowItems = d.itemNames.map(name => ({ name } as ProductHsAnalysis));
      }
      if (m.type === 'rubber-cert-payment') {
        const d = m.data as RubberCertPaymentData;
        this.pendingRubberCertAgency = d.agency;
        this.rubberCertPaid = !!d.paid;
      }
      if (m.type === 'rubber-eqc-status') {
        const d = m.data as RubberEqcStatusData;
        this.pendingRubberCertAgency = d.agency;
        this.rubberCertPaid = d.status === 'license-accept';
        if (d.certificateNo) this.lastEqcCertificateNo = d.certificateNo;
      }
      if (m.type === 'rubber-esfr-gate') {
        const d = m.data as RubberEsfrGateData;
        this.pendingRubberCertAgency = d.agency;
        this.pendingRubberFlowItems = d.itemNames.map(name => ({ name } as ProductHsAnalysis));
      }
      if (m.type === 'rubber-esfr-preview') {
        const d = m.data as RubberEsfrPreviewData;
        this.pendingRubberCertAgency = d.agency;
        this.esfrRequestData = d.request;
      }
      if (m.type === 'rubber-esfr-status') {
        const d = m.data as RubberEsfrStatusData;
        this.pendingRubberCertAgency = d.agency;
      }
      if (m.type === 'rubber-esfr-fee-receipt') {
        const d = m.data as RubberEsfrFeeReceiptData;
        this.pendingRubberCertAgency = d.agency;
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
