// ─── Message Types ───────────────────────────────────────────────────────────

export type MessageRole = 'bot' | 'user';

/**
 * Every bot message has a `type` that tells ChatAreaComponent which
 * sub-component to render. `data` carries the typed payload for that type.
 * Plain text/HTML uses type='text' with a `content` string.
 */
export type MessageType =
  | 'text'               // plain text or simple HTML string
  | 'welcome'            // welcome card + quick chips
  | 'spn-result'         // SPN lookup success card
  | 'spn-not-found'      // SPN not found → choose doc type
  | 'import-license-menu'// 3-option card (choose doc flow)
  | 'choice-card'        // 2-option decision card
  | 'ocr-progress'       // OCR stage animation
  | 'ocr-results'        // OCR result summary card
  | 'flag-card'          // flag confirmation UI (interactive)
  | 'form'               // form fill panel
  | 'full-upload'        // 4-slot document upload
  | 'connect'            // ShippingNet login
  | 'spn-list'           // SPN multi-select list
  | 'email-draft'        // editable email composer (interactive)
  | 'status-card'        // submission result card
  | 'spn-connect'        // multi-step SPN company → URL → login flow
  | 'single-upload'      // single-slot upload (ใบขนสินค้า path)
  | 'hs-analysis'        // AI HS Code classification result
  | 'form-preview'       // pre-submit data review table
  | 'missing-fields'    // incomplete OCR → fill remaining fields
  | 'agency-upload'     // multi-slot upload for agency-required docs
  | 'profile-select'    // pick or confirm ShippingNet profile before submission
  | 'permit-status'     // status overview of all submitted permit requests
  | 'payment-qr'       // QR payment card (fee required by agency)
  | 'payment-slip'     // upload payment slip after scanning QR
  | 'invoice-items'    // select which invoice line items to submit for this agency's permit
  | 'item-hs-analysis';// invoice path: per-product HS Code + Smart Tariff → agency lookup, user must confirm/correct each row

export interface InvoiceItemsData {
  agency: string;
  items: InvoiceLineItem[];
  selectedIds?: string[]; // set once confirmed (isReadOnly display)
}

// One alternative HS Code suggestion offered when the user edits an item's classification —
// invoices from real users typically carry no HS Code at all, so AI classifies purely from the
// product description and offers a shortlist of plausible codes to choose from instead.
export interface HsCandidate {
  hsCode: string;
  tariffCode: string;
  description: string;   // short description of what this HS heading covers
  dutyRate: number;       // import duty rate, %
  confidence: number;
}

// รายการวิเคราะห์รายสินค้า: product description → HS Code → Smart Tariff → กรมที่ต้องยื่น
export interface ProductHsAnalysis {
  id: string;
  name: string;          // product description จาก invoice
  hsCode: string;
  tariffCode: string;    // เลขพิกัดอัตราศุลกากรเต็ม (Smart Tariff)
  requiresPermit: boolean;
  agency: string;        // 'อย.' | 'กษ.' | '—' (ไม่ต้องขอ)
  agencyFull: string;
  licenseType?: string;
  confidence: number;
  reason: string;         // เหตุผลที่ AI จัดพิกัดนี้ให้ จาก product description
  dutyRate: number;       // อัตราภาษีนำเข้า, %
  candidates?: HsCandidate[]; // ตัวเลือกพิกัด HS Code อื่นๆ (สูงสุด 5 รายการ) สำหรับให้ user แก้ไขเลือกเอง
  manuallyEdited?: boolean;   // true เมื่อ user เลือกพิกัดอื่นแทนที่ AI แนะนำ
}

export interface ItemHsAnalysisData {
  items: ProductHsAnalysis[];
  reviewed?: boolean; // true once user has confirmed/corrected every row (isReadOnly display)
}

export interface MissingField {
  key: keyof LicenseFormData;
  label: string;
  placeholder: string;
}

export interface MissingFieldsData {
  missingFields: MissingField[];
  existingData: LicenseFormData;
  round: number;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  type: MessageType;
  content?: string;      // for type='text'
  data?: unknown;        // typed payload per MessageType
  time: string;
  isReadOnly?: boolean;  // set true when stored in Shipment.messages
}

// ─── Message Data Shapes ─────────────────────────────────────────────────────

export interface SpnResultData {
  ref: string;
  importer?: string;
  port?: string;
  declarationDate?: string;
  hsCode?: string;
  countryOrigin?: string;
  licenseType?: string;
}

// One line item as read directly off an uploaded invoice by OCR (invoice-upload path only)
export interface OcrLineItem {
  id: string;
  name: string;
  hsCode: string;
  origin: string;
  qty: string;
  unit: string;
}

export interface OcrResultsData {
  invoiceNo: string;
  invoiceDate: string;
  quantity: string;
  qtyUnit?: string;         // unit suffix for `quantity` — defaults to 'กิโลกรัม' when absent
  importer: string;
  port: string;
  hsCode: string;
  countryOrigin: string;
  lotNo: string;
  uNo: string;
  lineItems?: OcrLineItem[]; // per-product breakdown (invoice-upload path) — grouped display only, not editable inline
  isManual?: boolean;       // true = data came from manual entry, not OCR
  autoProceeded?: boolean;  // true = flow auto-proceeded, hide the button immediately
  // Structured customs-declaration data extracted by OCR, shaped to match the actual
  // LPI submission payload (DocumentControl + GoodsShipment). Drives the ocr-results card's
  // main display; fields OCR couldn't read are simply left undefined/blank. Any later upload
  // step (e.g. agency-upload's own OCR pass) merges into this same shape via mergeCustomsDeclaration().
  customsDeclaration?: CustomsDeclarationData;
}

// One "Source" entry (license backing a controlled item) on a GoodsShipment line
export interface CustomsDeclarationSource {
  licenseNumber?: string;
  sourceReference?: string;
  radioactiveMaterial?: string;
  radioactiveQty?: string;
  radioactiveUnit?: string;
  amount?: string;
}

// One "ProductionDetails" entry (lot-level manufacturing info) on a GoodsShipment line
export interface CustomsDeclarationProduction {
  lotNo?: string;
  mfgDate?: string;
  expDate?: string;
  measurement?: string;
  measurementUnit?: string;
  quantity?: string;
  quantityUnit?: string;
}

// One "Authority" entry (permit issued by a specific agency) on a GoodsShipment line
export interface CustomsDeclarationAuthority {
  agency?: string;
  licenseNumber?: string;
}

// One GoodsShipment line item, flattened from the real ใบขนสินค้า/LPI JSON payload
export interface CustomsDeclarationItem {
  itemNumber: number;
  invoiceNo?: string;
  invoiceDate?: string;
  invoiceItemNumber?: number;
  nameTh?: string;
  nameEn?: string;
  dangerousTh?: string;
  dangerousEn?: string;
  brandName?: string;
  dangerousInfo?: string;      // DangerousGoodsAdditionalInformationText (UN no./class/packing group)
  characteristic?: string;
  tariffCode?: string;
  statisticalCode?: string;
  restrictedGoodsCode?: string;
  quantity?: string;
  quantityUnit?: string;
  netWeight?: string;
  netWeightUnit?: string;
  packageAmount?: string;
  packageUnit?: string;
  originCountry?: string;
  purchaseCountry?: string;
  invoiceAmountForeign?: string;
  currencyCode?: string;
  invoiceAmountBaht?: string;
  manufacture?: string;
  remark?: string;
  certificateAnalysis?: string;
  sources?: CustomsDeclarationSource[];
  productions?: CustomsDeclarationProduction[];
  authorities?: CustomsDeclarationAuthority[];
}

// DocumentControl (header) + GoodsShipment (line items) — the structure ready to submit to the
// agency, also reused as the pre-submission preview structure (form-preview item detail).
export interface CustomsDeclarationData {
  referenceNumber?: string;
  requestFactName?: string;
  controlAgencyOfficeCode?: string;
  companyTaxNumber?: string;
  companyBranch?: string;
  companyName?: string;
  attorneyIdCard?: string;
  arrivalDate?: string;
  departureDate?: string;
  licenseType?: string;
  vesselName?: string;
  consignmentCountry?: string;
  destinationCountry?: string;
  dischargePort?: string;
  loadPort?: string;
  informantIdCard?: string;
  informantName?: string;
  registrationId?: string;
  items: CustomsDeclarationItem[];
}

export interface FlagItem {
  id: string;
  title: string;
  detail: string;
  conf: number;
  inputType: 'qty' | 'text';
  qtyOptions?: string[];
  confirmedValue: string | null;
  isConfirmed: boolean;
}

export interface FlagCardData {
  flags: FlagItem[];
  gen: number;  // unique generation — prevents stale interactions
}

export interface ChoiceCardData {
  question: string;
  options: { label: string; value: string; description?: string }[];
}

export interface EmailDraftData {
  gen: number;
  to: string;
  subject: string;
  body: string;
  isSent: boolean;
}

export interface HsAgency {
  code: string;      // e.g. 'อย.'
  full: string;      // full name
  licenseType?: string;
  legalRef?: string;
}

export interface HsAnalysisData {
  hsCode: string;
  description: string;
  goodsName: string;
  requiresPermit: boolean;
  direction: 'import' | 'export' | 'both';
  agency: string;       // primary agency code (kept for backward compat)
  agencyFull: string;   // primary agency full name
  agencies?: HsAgency[]; // all agencies when multiple required
  licenseType?: string;
  legalRef?: string;
  confidence: number;
}

export interface StatusCardData {
  refNo: string;            // RG-2568-XXXXX
  customsRef: string;       // HTHM or invoice ref
  submittedAt: string;
  isPending?: boolean;      // kept for queue mock compatibility; always false in new flow
  feeNote?: string;         // e.g. "ค่าธรรมเนียมกรม ฿500 จะรวมในบิลรายเดือน"
}

export interface PaymentQrData {
  agency: string;           // e.g. 'อย.'
  amount: number;           // THB
  refNo: string;            // payment ref
  expiresAt: string;        // display string
}

export interface PaymentSlipData {
  agency: string;
  amount: number;
  refNo: string;
}

// ─── Form / OCR ──────────────────────────────────────────────────────────────

export interface LicenseFormData {
  ref?: string;
  declarant?: string;
  importer?: string;
  port?: string;
  declarationDate?: string;
  goodsDesc?: string;
  hsCode?: string;
  countryOrigin?: string;
  quantity?: string;
  unit?: string;
  licenseType?: string;
  invoiceNo?: string;
  invoiceDate?: string;
  lotNo?: string;
  uNo?: string;
  drugRegNo?: string;
  importDate?: string;
  selectedItems?: InvoiceLineItem[]; // สินค้าที่เลือกยื่นขอใบอนุญาต (จาก invoice-items step)
  customsDeclaration?: CustomsDeclarationData; // structured OCR output, merged across every upload step
}

// รายการสินค้าใน Invoice — field ตามที่กรม (อย./กษ.) ใช้ประกอบคำขอนำเข้า
export interface InvoiceLineItem {
  id: string;
  name: string;           // ชื่อสินค้า/รายการสินค้า
  quantity: string;
  unit: string;
  unitPrice: number;      // ราคาต่อหน่วย
  amount: number;         // มูลค่ารวม
  lotNo: string;          // Lot/Batch No.
  hsCode: string;
  origin?: string;        // ประเทศกำเนิดสินค้า (จาก OCR)
}

// Fields NOT available from OCR — user must key these in per item before the
// form-preview step (invoice path) can proceed. All required.
export interface ItemManualDetail {
  lotNo: string;      // Lot Number
  mfgDate: string;    // Mfg. Date
  expDate: string;    // Exp. Date
  measurement: string; // Measurement
  measUnit: string;   // Meas. Unit
  qty: string;        // Qty.
  qtyUnit: string;    // Qty. Unit
}

export const ITEM_MANUAL_DETAIL_FIELDS: { key: keyof ItemManualDetail; label: string; placeholder: string; type?: 'date' }[] = [
  { key: 'lotNo',       label: 'Lot Number',   placeholder: 'เช่น CLA-2024-0091' },
  { key: 'mfgDate',     label: 'Mfg. Date',    placeholder: 'วว-ดด-ปปปป', type: 'date' },
  { key: 'expDate',     label: 'Exp. Date',    placeholder: 'วว-ดด-ปปปป', type: 'date' },
  { key: 'measurement', label: 'Measurement',  placeholder: 'เช่น 150' },
  { key: 'measUnit',    label: 'Meas. Unit',   placeholder: 'เช่น กก.' },
  { key: 'qty',         label: 'Qty.',         placeholder: 'เช่น 30' },
  { key: 'qtyUnit',     label: 'Qty. Unit',    placeholder: 'เช่น กล่อง' },
];

export type ChatStep =
  | 'idle'
  | 'upload'
  | 'full_upload'
  | 'not_found'
  | 'invoice_upload'
  | 'ocr'
  | 'form'
  | 'preview'
  | 'done';

// ─── SPN ─────────────────────────────────────────────────────────────────────

export interface SPNEntry {
  ref: string;
  customsNo: string;
  importer: string;
  goods: string;
  hs: string;
  origin: string;
  date: string;
  inQueue?: boolean;
}

// ─── Queue / Shipment ────────────────────────────────────────────────────────

export type AgencyKey = 'dld' | 'fda' | 'dft' | 'doa' | 'diw' | 'none';

// Queue shipments only exist once a chat session has passed profile selection — which only
// happens when a permit is actually required — so there is no "no_permit" queue status.
export type ShipmentStatus =
  | 'needs_you'
  | 'submitted';

export interface ShipmentFlag {
  id: string;
  title: string;
  detail: string;
  conf: number;
  resolved: boolean;
}

export interface AuditEntry {
  time: string;
  text: string;
  by: string;
}

export interface Shipment {
  id: string;
  chatName?: string;
  isNew?: boolean;
  hthmRef?: string;
  messages?: ChatMessage[];
  customsNo: string;
  type: 'IMP' | 'EXP';
  customer: string;
  contact: string;
  contactEmail: string;
  goods: string;
  hs: string;
  origin: string;
  importedAt: string;
  createdAt: number; // epoch ms — used to sort the queue list newest-first
  owner: string;
  permitNeeded: boolean;
  agency: AgencyKey;
  formCode: string;
  formName: string;
  conf: number;
  stage: number;
  statusKey: ShipmentStatus;
  assess: { conf: number; reason: string };
  classify: { agency: AgencyKey; conf: number; reason: string; alt: { agency: AgencyKey; conf: number }[] };
  draft: { fields: { label: string; value: string; flag?: string }[] };
  flags: ShipmentFlag[];
  audit: AuditEntry[];
  documents?: ShipmentDocument[];
  email?: { toName: string; to: string; subject: string; body: string; attName: string };
  items?: ShipmentItem[]; // per-product line items from the invoice/customs doc used for this LPI request
  itemsSelected?: boolean; // true once the shipment's flow has passed the item-selection step (invoice-items
                           // confirmed) — the queue detail view's item list card only renders when this is true,
                           // since `items` may be populated ahead of that step existing in mock data
}

// A product line item as captured from the invoice/customs upload during the LPI request —
// shown read-only in the queue detail view (per-item "รายละเอียด" card)
export interface ShipmentItem {
  id: string;
  name: string;
  hsCode: string;
  origin?: string;
  quantity: string;
  unit: string;
  lotNo?: string;
  amount?: number;
  detail?: ItemManualDetail; // manual fields captured when the LPI request was submitted
}

// replace url with real signed URL from storage (e.g. GET /shipments/:id/documents)
export interface ShipmentDocument {
  id: string;
  name: string;         // display name, e.g. "Invoice INV-2024-8834"
  fileType: 'pdf' | 'image' | 'other';
  category: 'invoice' | 'packing_list' | 'coa' | 'coo' | 'customs' | 'other';
  url: string;          // signed URL or blob URL — swap to API response in production
  uploadedAt?: string;  // ISO string or display string
  agencyKey?: AgencyKey; // set when doc belongs to a specific agency upload slot
}

// ─── Print ───────────────────────────────────────────────────────────────────

export interface ChatHistorySession {
  id: string;
  title: string;
  baseRef: string;   // preserved doc reference — never overwritten after first save
  timestamp: number;
  messages: ChatMessage[];
}

export interface PrintLicenseData {
  ref: string;
  refNo: string;
  importer: string;
  declarant: string;
  port: string;
  hsCode: string;
  countryOrigin: string;
  quantity: string;
  unit: string;
  invoiceNo: string;
  invoiceDate: string;
  lotNo: string;
  uNo: string;
  drugRegNo: string;
  importDate: string;
  goodsDesc: string;
  licenseType: string;
  printedAt: string;
}
