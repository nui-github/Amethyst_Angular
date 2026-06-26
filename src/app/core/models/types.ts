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
  | 'payment-slip';    // upload payment slip after scanning QR

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

export interface OcrResultsData {
  invoiceNo: string;
  invoiceDate: string;
  quantity: string;
  importer: string;
  port: string;
  hsCode: string;
  countryOrigin: string;
  lotNo: string;
  uNo: string;
  isManual?: boolean;       // true = data came from manual entry, not OCR
  autoProceeded?: boolean;  // true = flow auto-proceeded, hide the button immediately
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
  isPending?: boolean;      // true = sent but awaiting payment; false/absent = fully successful
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
}

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

export type ShipmentStatus =
  | 'needs_you'
  | 'no_permit'
  | 'email_outbox'
  | 'await_customer'
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
  by: 'ระบบ' | 'AI' | 'เจ้าหน้าที่';
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
  email: { toName: string; to: string; subject: string; body: string; attName: string };
}

// ─── Print ───────────────────────────────────────────────────────────────────

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
