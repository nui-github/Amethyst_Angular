// ─── Message Types ───────────────────────────────────────────────────────────

export type MessageRole = 'bot' | 'user';

// Which side of the customs pipeline this session is on — threads through ChatService.direction,
// LicenseFormData.direction, and the shared declaration-header sections (customs-declaration-
// sections.ts) so copy reads correctly ("ผู้นำเข้า" vs "ผู้ส่งออก") without forking components.
export type Direction = 'import' | 'export';

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
  | 'item-hs-analysis' // invoice path: per-product HS Code + Smart Tariff → agency lookup, user must confirm/correct each row
  | 'item-measurement' // after flags confirmed: table of every item being submitted (TH/EN name,
                        // tariff code, Lot No. from OCR) + Measurement/Meas. Unit the user must key in
                        // per row before proceeding — the only fields no upstream document captures
  | 'invoice-select'    // invoice path only: shown when the uploaded file's OCR detects more than
                        // one invoice inside it (see ocr.service.ts MULTI_INVOICE_TRIGGER) — user
                        // picks exactly one before the ocr-results card appears; the rest of the
                        // flow then proceeds using only that chosen invoice's data, same as a
                        // normal single-invoice upload
  | 'agency-docs-returned' // กรมควบคุมโรค/การยาง only (see ChatService.QR_PAYMENT_AGENCIES): shown
                        // after the department approves the request (triggered by clicking
                        // "ตรวจสอบสถานะ" on status-card) and, if a fee applies, after payment-qr
                        // is paid — lists the documents the department sent back
  | 'agency-approval-pending' // fee-charging QR_PAYMENT_AGENCIES only (currently กรมควบคุมโรค):
                        // shown right after showAgencyApproval()'s approval instead of the old
                        // 2 separate plain-text bot() bubbles — single card combining "approved"
                        // + "QR is on its way to the queue page", see AgencyApprovalPendingComponent
  | 'rubber-cert-payment' // การยาง (RAOT) export path — LEGACY, only used by historical
                        // queue-mock/sessions-mock message replay now. The live flow used to show
                        // this (pick a linked bank account, click "ชำระเงิน") right after the
                        // e-QC request form's "ดำเนินการต่อ", but once the request-form drawer
                        // itself gained its own "บัญชีที่ตัดชำระ" field (see
                        // RubberEqcRequestEditorComponent), re-asking here was pure duplicate
                        // work — replaced by 'rubber-eqc-status' below, see RubberCertPaymentComponent
  | 'rubber-eqc-gate' // การยาง (RAOT) export path only: posted right after the user picks
                        // "ขอหนังสือรับรองคุณภาพยาง (e-QC)" on the rubber-flow choice-card (a
                        // plain 'choice-card' — see onRubberFlowChoice()). Shows only a
                        // "กรอกข้อมูล" button until the RubberEqcRequestEditorComponent drawer
                        // is saved (data.completed) — same gate pattern as ocr-results'
                        // declarationGateRequired ("กรอกข้อมูลเพิ่มเติม" → "ดำเนินการต่อ"), except
                        // "กรอกข้อมูล" stays clickable even after completion so the user can
                        // reopen and edit again before actually proceeding to 'rubber-eqc-status'
  | 'rubber-eqc-status' // การยาง (RAOT) export path only: posted when "ดำเนินการต่อ" is clicked
                        // on the rubber-eqc-gate card (see showRubberEqcStatus()) — a pure display
                        // card, never interactive. Starts as status 'rubber-accept' (request
                        // accepted by RAOT, awaiting auto-debit from the account chosen in the
                        // request-form drawer); after a 3s mock delay (same convention as
                        // showAgencyApproval()'s pending→approved flip) swaps in place to
                        // 'license-accept' with a mock Certificate No. + full license detail —
                        // see RubberEqcStatusComponent
  | 'rubber-esfr-gate' // การยาง (RAOT) export path only: posted right after e-QC LICENSE ACCEPT,
                        // once the user picks "ทำ e-SFR ต่อ" on the finish/continue choice-card
                        // (see showEsfrChoice()/onEsfrFlowChoice()) — same gate pattern as
                        // rubber-eqc-gate (only "กรอกข้อมูล" until RubberEsfrRequestEditorComponent
                        // is saved, then both "กรอกข้อมูล" + "ดำเนินการต่อ" show together). e-SFR
                        // field set is a first-pass placeholder (no RAOT data dictionary for it
                        // yet, unlike e-QC's) — see RubberEsfrRequestData
  | 'rubber-esfr-preview' // posted when "ดำเนินการต่อ" is clicked on rubber-esfr-gate (see
                        // showEsfrPreview()) — a read-only summary of the saved e-SFR request
                        // before it's actually submitted to RAOT. Footer has "แก้ไขข้อมูล"
                        // (reopens RubberEsfrRequestEditorComponent, saving updates this card's
                        // data in place — see saveEsfrRequest()) and "ส่งคำขอใบอนุญาต" (seals this
                        // card read-only and posts rubber-esfr-status — see onEsfrPreviewSubmit())
  | 'rubber-esfr-status' // posted once the preview's "ส่งคำขอใบอนุญาต" is clicked (see
                        // showEsfrStatus()) — pure display card, never interactive itself besides
                        // its own "ดำเนินการต่อ". Starts as status 'rubber-accept' (request
                        // accepted by RAOT, mock processing in progress); after a 3s mock delay
                        // (same convention as rubber-eqc-status) flips in place to 'license-accept',
                        // which enables "ดำเนินการต่อ" — see onEsfrStatusProceed()
  | 'rubber-esfr-fee-receipt' // posted once "ดำเนินการต่อ" is clicked on rubber-esfr-status while
                        // 'license-accept' (see onEsfrStatusProceed()) — the ใบรับค่าธรรมเนียม
                        // reply from ศุลกากร (License Number/Issue Date/Issue Authority/Message/
                        // EffectiveDate/ExpireDate) + a download button. Terminal card of the
                        // e-SFR flow — pure display, no further action, see RubberEsfrFeeReceiptData
  | 'petroleum-ocr-results' // customs-docs (import) path only — shown instead of the generic
                        // 'ocr-results' card when the uploaded ใบขนขาเข้า is detected as a
                        // "ขอออกของไปก่อน" duty-exemption request for petroleum-business equipment
                        // (ocr.service.ts PETROLEUM_DUTY_TRIGGER; มาตรา 70 พ.ร.บ.ปิโตรเลียม 2514,
                        // agency กรมเชื้อเพลิงธรรมชาติ/DMF). Fully separate component/data/mock from
                        // the generic customsDeclaration pipeline (per explicit product decision —
                        // this scenario's fields, like privilege code/DMF cert/guarantee bond
                        // number, don't fit the DocumentControl/GoodsShipment schema at all). Same
                        // gate pattern as ocr-results' declarationGateRequired: only "กรอกข้อมูลเพิ่มเติม"
                        // shows until PetroleumDeclarationEditorComponent (own signals — see
                        // petroleumEditorOpen/petroleumEditorMsgId — not the shared
                        // declarationEditorOpen) is saved, then "ดำเนินการต่อ" appears alongside it.
                        // Only one agency ever applies (DMF), so onPetroleumOcrProceed() skips
                        // item-hs-analysis/เลือกกรม entirely and goes straight to profile-select.
  | 'dmf-submission-status'; // DMF (เชื้อเพลิง) duty-exemption path only — posted right after
                        // "ยืนยันส่งกรม" (see ChatService.showDmfSubmissionStatus()), BEFORE
                        // showNextAgencyIfAny() runs. Mocks the real ยื่นข้อมูลผ่านระบบคอมพิวเตอร์
                        // round-trip to กรมเชื้อเพลิงธรรมชาติ: 'waiting-response' → (3s) 'dmf-accept'
                        // (DECL info + item table appear) → (5s) 'license-accept' (duty-exempt
                        // items ticked, "ดูรายละเอียดใบอนุญาต" unlocked) — see DmfSubmissionStatusData

// One alternative HS Code suggestion offered when the user edits an item's classification —
// invoices from real users typically carry no HS Code at all, so AI classifies purely from the
// product description and offers a shortlist of plausible codes to choose from instead.
export interface HsCandidate {
  hsCode: string;
  tariffCode: string;
  description: string;   // short description of what this HS heading covers
  dutyRate: number;       // import duty rate, %
  confidence: number;
  // Optional agency this heading actually falls under — when set (AI candidates for the
  // 'ไม่สามารถระบุ HS Code' group, or a manual lookupHsCode() hit), applying this candidate moves
  // the item into that agency's group instead of just updating the HS Code display in place. Left
  // undefined for ordinary same-agency re-classification candidates, which just refine the exact
  // heading without changing which department the item is grouped under.
  agency?: string;
  agencyFull?: string;
  requiresPermit?: boolean;
  licenseType?: string;
  isCompound?: boolean; // การยาง only: applying this candidate reclassifies the item as
                         // compound/raw rubber — see ProductHsAnalysis.isCompound
}

// รายการวิเคราะห์รายสินค้า: product description → HS Code → Smart Tariff → กรมที่ต้องยื่น
export interface ProductHsAnalysis {
  id: string;
  name: string;          // product description จาก invoice
  hsCode: string;
  tariffCode: string;    // เลขพิกัดอัตราศุลกากรเต็ม (Smart Tariff)
  requiresPermit: boolean;
  agency: string;        // 'อย.' | 'กษ.' | 'เชื้อเพลิง' | '—' (ไม่ต้องขอ) | '?' (AI จัดกลุ่มไม่ได้ ต้องระบุเอง)
  agencyFull: string;
  licenseType?: string;
  confidence: number;
  reason: string;         // เหตุผลที่ AI จัดพิกัดนี้ให้ จาก product description
  dutyRate: number;       // อัตราภาษีนำเข้า, %
  candidates?: HsCandidate[]; // ตัวเลือกพิกัด HS Code อื่นๆ (สูงสุด 5 รายการ) สำหรับให้ user แก้ไขเลือกเอง
  manuallyEdited?: boolean;   // true เมื่อ user เลือกพิกัดอื่นแทนที่ AI แนะนำ
  isCompound?: boolean;       // การยาง only: compounded/processed rubber (ยางผสม) — instead of
                              // ใบอนุญาตค้ายาง, gates a choice-card (see onRubberFlowChoice()) between
                              // requesting a หนังสือรับรองคุณภาพยาง (e-QC) + fee, or going straight
                              // to customs clearance (only legal once the e-QC number already exists)
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

// One invoice found inside the uploaded file, summarized for the picker card — full data for
// the chosen one lives in InvoiceOcrResult (invoice-ocr.mock.ts), looked up by `id` once selected.
export interface InvoiceSummaryOption {
  id: string;
  invoiceNo: string;
  invoiceDate: string;
  itemCount: number;
  totalAmount: string;
  currency: string;
}

export interface InvoiceSelectData {
  invoices: InvoiceSummaryOption[];
  selectedId?: string; // set once the user has chosen, drives the read-only/locked display
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
  // true once the user has filled every required field via the full-screen "กรอกข้อมูลเพิ่มเติม"
  // declaration-editor panel (customs-declaration-editor) — only then does "ดำเนินการต่อ" appear.
  declarationComplete?: boolean;
  // true when this particular ocr-results card should force the declarationComplete gate before
  // "ดำเนินการต่อ" is allowed — set only for OCR passes meant to be the FINAL/complete declaration
  // (customs-only single-upload; the second, agency-upload OCR pass in the invoice path). The
  // invoice path's first OCR pass (invoice doc alone, before COA/เลข U are even uploaded) leaves
  // this unset — a plain commercial invoice can't carry full customs-manifest data yet, so forcing
  // full completion there just blocks the user on fields no document has supplied yet.
  declarationGateRequired?: boolean;
  direction?: Direction; // 'import' | 'export' — picks which header-section labels to show
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

// LocationInfo — warehouse/storage location for this GoodsShipment line
export interface CustomsDeclarationLocation {
  goodsCode?: string;
  goodsName?: string;
  streetAndNumber?: string;
  district?: string;
  subProvince?: string;
  province?: string;
  postcode?: string;
  phoneNumber?: string;
  faxNumber?: string;
}

// One GoodsShipment line item, flattened from the real ใบขนสินค้า/LPI JSON payload
export interface CustomsDeclarationItem {
  itemNumber: number;
  invoiceNo?: string;
  invoiceDate?: string;
  invoiceItemNumber?: number;
  declarationLineNumber?: number;
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
  location?: CustomsDeclarationLocation;
  sources?: CustomsDeclarationSource[];
  productions?: CustomsDeclarationProduction[];
  authorities?: CustomsDeclarationAuthority[];
}

// DocumentControl (header) + GoodsShipment (line items) — the structure ready to submit to the
// agency, also reused as the pre-submission preview structure (form-preview item detail).
export interface CustomsDeclarationData {
  declarationNo?: string;     // เลขที่ใบขน
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
  portDischargeCode?: string;      // PortInfo.Discharge — numeric port code
  portLoadCode?: string;           // PortInfo.Load — numeric port code
  controlDischargePort?: string;   // ControlAgencyInfo.DischargePort — UN/LOCODE (e.g. THBKK)
  controlReleasePort?: string;     // ControlAgencyInfo.ReleasePort — UN/LOCODE (e.g. THLCH)
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
  subtitle?: string;
  tip?: string; // short callout rendered as a highlighted tip box (lightbulb icon) instead of a
                // plain subtitle paragraph — for a hint the user should really notice, e.g.
                // showRubberFlowChoice()'s e-QC/e-SFR guidance
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
  agency?: string;          // which department this submission went to — drives "ตรวจสอบสถานะ"
                             // behavior for QR-payment-flow agencies (see ChatService.checkStatus)
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

// การยาง only: linked bank account for the หนังสือรับรองคุณภาพยาง (e-QC) fee — system already has
// the user's accounts on file (RAOT e-SFR direct-debit convention), UI just lets them pick which.
export interface BankAccount {
  id: string;
  bankName: string;
  accountNoMasked: string;  // e.g. "xxx-x-x1234-5"
  accountName: string;
  isDefault?: boolean;
}

export interface RubberCertPaymentData {
  agency: string;           // 'การยาง'
  itemNames: string[];      // compound-rubber items needing the certificate
  amount: number;           // THB
  refNo: string;
  accounts: BankAccount[];
  paid?: boolean;
  paidAccountId?: string;
}

// RAOT "Rubber Certificate Request Message (e-QC)" — the request form that must be filled and
// saved BEFORE the e-QC fee (RubberCertPaymentData above) is paid; opened from
// RubberEqcRequestEditorComponent when the user picks the e-QC option on the rubber-flow
// choice-card. Field set/required (*) markers mirror the real RAOT e-QC request form.
// Control section fields/required-ness mirror the real RAOT (กยท.) data dictionary — "Rubber
// Certificate Request Message V1.10" — using its กยท. column as ground truth (this flow only
// ever submits to การยาง/RAOT, never to กวก., so กวก.-only fields like Test Group/Total Product
// Amount are dropped, and Reason Type/Document Type/Language use the doc's own enum values, not
// invented ones). Fields the doc marks "C" (conditional, e.g. Broker/Manufacturer Tax Number)
// are kept as optional inputs rather than hard-required, since their condition depends on other
// field values this mock doesn't otherwise model.
export interface RubberEqcRequestData {
  referenceNumber: string;         // Reference Number * — auto-generated, not user-entered
  senderRegistrationId: string;    // Sender Registration ID * — auto-issued, same as Reference Number
  companyTaxNumber: string;        // Company Tax Number *
  companyBranch: string;           // Company Branch *
  companyThaiName: string;         // Company Thai Name *
  companyEnglishName: string;      // Company English Name *
  street: string;                  // Street and Number *
  district: string;                // District *
  subProvince: string;             // Sub province *
  province: string;                // Province *
  postcode: string;                // Postcode *
  companyStrLicenseNo: string;     // Company Str License No (conditional)
  // Broker Tax Number dropped — the RAOT data dictionary marks it "ไม่ใช้" (not used by กยท.),
  // unlike Broker Branch which stays a conditional field.
  brokerBranch: string;            // Broker Branch (conditional)
  manufacturerTaxNumber: string;   // Manufacturer Tax Number (conditional)
  manufacturerBranch: string;      // Manufacturer Branch (conditional)
  manufacturerStrLicenseNo: string; // Manufacturer Str License No (conditional)
  labCode: string;                 // Lab Code *
  certificateEnglishAddress: string; // Certificate English Address (conditional)
  reasonType: string;              // Reason Type * — 0 ส่งออก / 1 ทั่วไป / 2 นำเข้า
  documentType: string;            // Document Type * — 1 หนังสือรับรอง / 2 ใบรายงานผล / 3 ทั้งสอง
  documentLanguage: string;        // Language * — 1 ไทย / 2 อังกฤษ / 3 ไทย+อังกฤษ
  deliveryMethod: string;          // Delivery — กยท. ยอมรับเฉพาะ "3 อิเล็กทรอนิกส์" จึงล็อกค่าไว้
  contactName: string;             // Contact Name *
  contactPhone: string;            // Contact Telephone Number *
  email: string;                   // e-mail (optional)
  sampleReturn: 'return' | 'no-return'; // Return *
  isUrgent: boolean;               // Is Urgent *
  paymentMethod: string;           // Payment Method * — กยท. ยอมรับเฉพาะ "1 e-Payment" จึงล็อกค่าไว้
  // e-Payment debits one of the user's already-linked bank accounts (BankAccount,
  // rubber-cert.mock.ts) — picking one already carries its own bank/branch/account number, so
  // there's no separate Bank Code/Branch Code/Account Number entry (that's what those 3 fields
  // in the raw data dictionary collapse into once "linked account" selection exists).
  paymentAccountId: string;        // *
  paymentAmount: number;           // Payment Amount — system-computed (RUBBER_COMPOUND_CERT_FEE), not user-entered
  creditAmount: number;            // Credit Amount (optional)
  managerIdCard: string;           // Manager ID Card (conditional)
  managerName: string;             // Manager Name (conditional on Manager ID Card)
  items: RubberEqcRequestItem[];
}

export interface RubberEqcRequestItem {
  itemNo: string;               // read-only, auto "0001", "0002", ...
  invoiceNumber: string;        // เลขที่บัญชีราคาสินค้า/ใบกำกับสินค้า (conditional on Reason Type = ส่งออก)
  invoiceDate: string;          // วันที่บัญชีราคาสินค้า/ใบกำกับสินค้า (conditional, same as above)
  invoiceItemNo: string;
  destCountryCode: string;      // รหัสประเทศปลายทาง
  descriptionEn: string;
  descriptionTh: string;
  contractNo: string;           // เลขที่สัญญา
  rubberSpecies: string;        // Class Rubber — ชนิดของยางพารา *
  inspectionType: string;       // ประเภทการขอตรวจ *
  packageAmount?: number;
  exportWeight?: number;
  exportWeightUnit: string;     // Export Weight Unit Code (conditional, pairs with exportWeight)
  productionFormula?: number;   // สูตรการผลิต ปริมาณยางธรรมชาติ (%)
  rubberQuantity?: number;      // จำนวนยาง
  remark: string;
  attributes: RubberEqcAttribute[];
}

export interface RubberEqcAttribute {
  testItem: string;        // การทดสอบคุณสมบัติ
  testMethod: string;      // วิธีทดสอบ
  uncertaintyTest: string; // ทดสอบความไม่แน่นอนของการวัด
}

export interface RubberEqcGateData {
  agency: string;      // 'การยาง'
  itemNames: string[]; // compound-rubber items the request form covers
  completed: boolean;  // true once RubberEqcRequestEditorComponent has been saved at least once
}

export interface RubberEqcStatusData {
  agency: string;                  // 'การยาง'
  // 'rubber-accept'       → request accepted by RAOT, mock 3-7 day officer inspection in progress
  // 'rubber-accept-ready' → mock inspection result came back LICENSE ACCEPT; "ดำเนินการต่อ" enables
  // 'license-accept'      → user proceeded; posted as a NEW message with the full license detail
  status: 'rubber-accept' | 'rubber-accept-ready' | 'license-accept';
  amount: number;                  // fee amount, auto-debited from paidAccountLabel's account
  paidAccountLabel: string;        // e.g. "ธนาคารกสิกรไทย xxx-x-x4821-5" — from the request form's own account picker
  certificateNo?: string;          // set once status is 'license-accept'
  issueDate?: string;
  expireDate?: string;
  issuerOrgId?: string;
  issuerNameTh?: string;
  issuerNameEn?: string;
  issuerAddressTh?: string;
  issuerAddressEn?: string;
  issuerAuthorizerNameTh?: string;     // เจ้าหน้าที่ที่มีอำนาจลงนามใบอนุญาต
  issuerAuthorizerPositionTh?: string; // ตำแหน่งเจ้าหน้าที่ที่มีอำนาจลงนามใบอนุญาต
  issuerAuthorizerNameEn?: string;     // Authority English Name
  issuerAuthorizerPositionEn?: string; // Position of Authority English
  labCode?: string;                // from the saved request form (unused in the lab-detail tab —
                                    // that shows RAOT's own lab response fields below instead)
  labNameEn?: string;               // ชื่อห้องทดสอบ (อังกฤษ)
  labAddressTh?: string;
  labAddressEn?: string;
  labTestStartDate?: string;        // วันที่ทดสอบ
  labTestEndDate?: string;          // วันที่สิ้นสุดทดสอบ
  labSampleReceivedDate?: string;   // วันที่รับตัวอย่าง
  labStaffName?: string;            // เจ้าหน้าที่ห้องปฏิบัติการ
  labStaffPosition?: string;        // ตำแหน่งเจ้าหน้าที่ห้องปฏิบัติการ
  labPhone?: string;
  labFax?: string;
  remark?: string;
  certUrl?: string;                // downloadable หนังสือรับรองคุณภาพยาง (e-QC) file, set once status is 'license-accept'
}

export interface RubberEsfrGateData {
  agency: string;      // 'การยาง'
  itemNames: string[]; // compound-rubber items the e-SFR request covers (same items as the e-QC round)
  completed: boolean;  // true once RubberEsfrRequestEditorComponent has been saved at least once
}

// ใบขออนุญาตผ่านด่านศุลกากรและใบชำระเงินค่าธรรมเนียมก่อนส่งออกยางไปนอกราชอาณาจักร (e-SFR /
// Rubber License Request Message V1.0, กวก. data dictionary — the "Cat (อิง กวก. > Cat หลัก)"
// version, which resolves every field the earlier "กวก." column alone left blank/"ไม่ใช้" to its
// real O/M/C category instead) — field set + required-ness follow that column. Payment section
// (Payment Method/บัญชีที่ตัดชำระ/Payment Amount) is deliberately NOT modeled off this dictionary's
// own payment/Cess fields (46-55, mostly O/C here) — it stays the linked-bank-account picker
// already built for e-QC, left untouched by design; those dictionary fields are skipped entirely
// rather than added as unused duplicates.
export interface RubberEsfrRequestData {
  referenceNumber: string;        // auto-issued, same convention as RubberEqcRequestData.referenceNumber
  senderRegistrationId: string;   // Sender Registration ID * — auto-issued, same as e-QC's
  licenseType: string;            // License Type * — กวก. ยอมรับเฉพาะ "1 - ส่งออก" จึงล็อกค่าไว้
  tradeLicenseNo: string;         // Trade License No * — เลขทะเบียนผู้ค้ายางพารา
  exportLicenseNo: string;        // Export License No * — เลขทะเบียนผู้ส่งออกยางพารา
  inventoryName: string;          // Inventory Name * — สถานที่เก็บสินค้าก่อนส่งออก ชื่อสถานที่
  inventoryStreet: string;        // Inventory Street and Number *
  inventoryDistrict: string;      // Inventory District *
  inventorySubProvince: string;   // Inventory Sub province *
  inventoryProvince: string;      // Inventory Province *
  inventoryPostcode: string;      // Inventory Postcode (optional)
  inventoryPhone: string;         // Inventory Phone Number *
  inventoryContactPerson: string; // Inventory Contact Person *
  companyTaxNumber: string;       // Company Tax Number *
  companyBranch: string;          // Company Branch *
  companyThaiName: string;        // Company Thai Name (optional)
  companyEnglishName: string;     // Company English Name (optional)
  companyStreet: string;          // (Company) Street and Number (optional)
  companyDistrict: string;        // (Company) District (optional)
  companySubProvince: string;     // (Company) Sub province (optional)
  companyProvince: string;        // (Company) Province (optional)
  companyPostcode: string;        // (Company) Postcode (optional)
  brokerTaxNumber: string;        // Broker Tax Number (conditional)
  brokerBranch: string;           // Broker Branch (optional)
  managerIdCard: string;          // Manager ID Card (conditional on Broker Tax Number)
  managerName: string;            // Manager Name (optional)
  modeOfTransport: string;        // Mode of Transport * — กวก. ยอมรับช่องทาง 1-4 เท่านั้น
  loadPort: string;               // Load Port * — รหัสสถานที่ส่งออก
  destinationCountryCode: string; // Destination Country Code *
  invoiceNumber: string;          // Invoice Number *
  invoiceDate: string;            // Invoice Date *
  tradeTerms: string;             // Trade Terms * — เงื่อนไขการซื้อขายตาม INCOTERMS
  freightFee: number;             // Freight fee * — ค่าระวาง
  insuranceAmount: number;        // Insurance Amount Foreign * — ค่าประกันภัย
  purchaseOrderNumber: string;    // Purchase Order Number (optional)
  consigneeName: string;          // Consignee Name (optional)
  consigneeStreet: string;        // Consignee Street and Number (optional)
  consigneeDistrict: string;      // Consignee District (optional)
  consigneeSubProvince: string;   // Consignee Sub province (optional)
  consigneeProvince: string;      // Consignee Province (optional)
  consigneePostcode: string;      // Consignee Postcode (optional)
  purchaseCountryCode: string;    // Purchase Country Code (optional)
  netWeight: number;              // Net Weight * — หน่วยเป็น KGM เท่านั้น
  fobValueForeign: number;        // FOB Value Foreign * — ราคาต่อกิโลกรัม เงินต่างประเทศ (US)
  currencyCode: string;           // Currency Code * — USD หรือ THB
  contractPricePerKg: number;     // Contract price/kg *
  paymentAccountId: string;       // บัญชีที่ตัดชำระ * — same linked-account picker as e-QC; Bank
                                   // Code/Branch Code/Bank Account Number (49-51) aren't modeled
                                   // separately since picking an account already carries all three
  paymentAmount: number;          // Cess fee, system-computed from items' Weight (rateForExportWeight)
  chargesRate: number;            // Charges Rate (optional) — อัตราเรียกเก็บต่อกิโลกรัม (เงิน Cess)
  creditAmount: number;           // Credit Amount (optional)
  totalAmountRaot: number;        // Total Amount RAOT — system-computed, Payment Amount + Credit Amount
  announcementNumber: string;     // Announcement Number (optional)
  announcementDate: string;       // Announcement Date (optional)
  items: RubberEsfrRequestItem[];
}

export interface RubberEsfrRequestItem {
  invoiceItemNo: string;          // Invoice Item Number *
  tariffCode: string;             // Tariff Code * — รหัสพิกัดศุลกากร
  statisticalCode: string;        // Statistical Code * — รหัสสถิติสินค้าของกรมศุลกากร
  descriptionTh: string;          // Thai Description of Goods *
  descriptionEn: string;          // English Description of Goods *
  rubberCode: string;             // Rubber Code * — Class Rubber
  weight?: number;                // Weight * — น้ำหนักที่อนุญาต
  weightUnitCode: string;         // Weight Unit Code * — KGM/TNE/GRM
  quantity?: number;               // Quantity (optional)
  quantityUnitCode: string;        // Quantity Unit Code (optional)
  drc?: number;                   // DRC * — ร้อยละเนื้อยางแห้ง
  contractDate: string;           // Contract Date *
  reductionRate?: number;          // Reduction Rate (optional) — ค่า % ลดน้ำหนักสุทธิ
  reductionWeight?: number;        // Reduction Weight (optional)
  priceValueFreight?: number;     // Price Value Freight * — ราคาต่อกก. เงินต่างประเทศ
  priceValueBaht?: number;        // Price Value Baht *
  netPriceValueFreight?: number;  // Net Price Value Freight * — FOB เงิน US
  netPriceValueBaht?: number;     // Net Price Value Baht * — FOB เงินบาท
  chargingWeight?: number;         // Charging Weight (optional) — น้ำหนักสุทธิเรียกเก็บ
  remark: string;                 // Remark (optional)
  certificates: RubberEsfrCertificate[]; // Quality Certificate — required when the tariff code is
                                   // compound/mixed rubber, which is every item on this flow
}

export interface RubberEsfrCertificate {
  certificateNumber: string;         // Certificate Number — เลขที่ใบรับรองคุณภาพยาง (e-QC)
  certificateItemNo: string;         // Certificate Item Number — ลำดับรายการในใบรับรองคุณภาพยาง
  certificateIssueAuthority: string; // Certificate Issue Authority — เลขประจำตัวผู้เสียภาษีของผู้ออกใบรับรอง
  certificateIssueDate: string;      // Certificate Issue Date
}

export interface RubberEsfrPreviewData {
  agency: string;                  // 'การยาง'
  request: RubberEsfrRequestData;  // full saved e-SFR request, shown as a read-only summary before submit
}

export interface RubberEsfrStatusData {
  agency: string;          // 'การยาง'
  referenceNumber: string; // from the saved e-SFR request, shown for context while waiting
  // 'rubber-accept'  → request accepted by RAOT, mock processing in progress
  // 'license-accept' → mock wait resolved; "ดำเนินการต่อ" enables
  status: 'rubber-accept' | 'license-accept';
}

// Posted from RubberEsfrStatusComponent's "ดำเนินการต่อ" (only reachable once status is
// 'license-accept') — the fee-receipt reply from ศุลกากร, terminal card of the e-SFR flow.
// Field set/labels mirror the reference ข้อมูลตอบกลับคำขอใบอนุญาต slip (License Number/Issue
// Date/Issue Authority/Message/EffectiveDate/ExpireDate).
export interface RubberEsfrFeeReceiptData {
  agency: string;          // 'การยาง'
  referenceNumber: string; // from the saved e-SFR request, shown for context
  licenseNumber: string;
  issueDate: string;
  issueAuthority: string;
  message: string;
  effectiveDate: string;
  expireDate: string;
  feeAmount: number;       // Cess fee actually charged — RubberEsfrRequestData.totalAmountRaot,
                           // itself rateForExportWeight() per item (rubber-cert.mock.ts) summed;
                           // this is a REAL fee, unlike RGoods's ใบอนุญาตค้ายาง path which is free
  receiptUrl?: string;     // downloadable ใบรับค่าธรรมเนียม file
}

export interface AgencyReturnDoc {
  key: string;
  label: string;
  url: string;
}

export interface AgencyDocsReturnedData {
  agency: string;
  docs: AgencyReturnDoc[];
}

export interface AgencyApprovalPendingData {
  agency: string;
  pending?: boolean;   // true while simulating the department's review — see ChatService.showAgencyApproval
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
  selectedItems?: InvoiceLineItem[]; // สินค้าที่ยื่นขอใบอนุญาต (ทั้งกลุ่มที่ AI จัดไว้ให้กรมนี้)
  customsDeclaration?: CustomsDeclarationData; // structured OCR output, merged across every upload step
  petroleumDeclaration?: PetroleumDutyDeclarationData; // see PetroleumDutyDeclarationData below — own
                                                        // schema, not part of customsDeclaration
  direction?: Direction; // 'import' | 'export' — set once at flow start (ChatService.direction)
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
  mfgDate?: string;       // วันที่ผลิต (จาก OCR/production details เมื่อมี)
  expDate?: string;       // วันหมดอายุ (จาก OCR/production details เมื่อมี)
  declarationItemNumber?: number; // FK → CustomsDeclarationItem.itemNumber เมื่อมี (customs/SPN paths)
  measurement?: string;   // ปริมาณที่แจ้ง — กรอกโดย user ในกล่อง item-measurement (ไม่มีเอกสารต้นทางระบุ)
  measUnit?: string;      // หน่วยของ measurement
}

// ตารางสรุปรายการสินค้าที่ยื่นขอใบอนุญาต แสดงหลังยืนยัน flag-card — ผู้ใช้กรอก
// Measurement/Meas. Unit ต่อแถวก่อนกดยืนยันเพื่อไปขั้นตอนถัดไป
export interface ItemMeasurementData {
  items: InvoiceLineItem[];
  customsDeclaration?: CustomsDeclarationData;
  confirmed?: boolean; // set once the user confirms — card stays visible read-only, not swapped out
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

// ─── Petroleum duty-exemption ("ขอออกของไปก่อน") ─────────────────────────────
// Own schema, deliberately not the generic CustomsDeclarationData/GoodsShipment shape — modeled
// directly on the real DMF "License Request" message (Control/Invoice/Detail/Duty/Permit), not a
// generic declaration. Fields marked M below are Mandatory (must always have a value); C fields
// are Condition (required only when applicable — mainly the guarantee/deposit group, since that's
// the whole point of "ขอออกของไปก่อน"); everything else is Optional. A handful of low-relevance
// Optional fields from the source schema (sub-broker, tax-card debit account, argumentative-tariff
// dispute fields, AEOs/self-cert-origin remarks) were left out to keep the form usable — none of
// them apply to a straightforward petroleum-equipment early-release request.

// ── ส่วนภาษี (Duty) — one row per duty type charged/exempted on an item ──────────
export interface DmfDutyRow {
  dutyType?: string;        // M - Duty Type, an4
  valueRate?: string;       // M - อัตราตามราคา (%)
  specificRate?: string;    // M - อัตราตามสภาพ
  amount?: string;          // M - ค่าภาษีตามปกติ
  amountPaid?: string;      // M - ค่าภาษีที่ชำระ
  exemptionRate?: string;   // O - อัตรายกเว้นอากร (%) — 100 สำหรับยกเว้นเต็มจำนวน
  depositAmount?: string;   // O - เงินประกัน (ของ duty แถวนี้)
  depositReasonCode?: string; // O - รหัสเหตุผลการวางประกัน (ส่วนประกัน, ผูกกับ depositAmount)
}

// ── ส่วนใบอนุญาต (Permit) — 0-99 ต่อรายการ ────────────────────────────────────────
export interface DmfPermitRow {
  permitNumber?: string;    // M - เลขที่ใบอนุญาต/ใบรับรอง
  issueDate?: string;       // M
  issueAuthority?: string;  // M - เลขผู้เสียภาษีของหน่วยงานผู้ออก
}

// ── ส่วนรายการ (Detail) ───────────────────────────────────────────────────────────
export interface DmfItemData {
  itemNumber: number;             // M - ลำดับรายการในใบขน
  invoiceItemNumber?: string;     // M - ลำดับรายการในอินวอย
  tariffCode?: string;            // M
  tariffSequence?: string;        // M
  statisticalCode?: string;       // M
  importTariff?: string;          // O - พิกัดภาค 4 (ของที่ได้รับยกเว้นอากร)
  privilegeCode?: string;         // M - รหัสสิทธิพิเศษ, an3 — '005' ระหว่างรออนุมัติ
  natureOfTransaction?: string;   // M - 11/21/90
  nameTh?: string;                // M
  nameEn?: string;                // M
  productYear?: string;           // M - CCYY
  brandName?: string;             // M - 'NO BRAND' ถ้าไม่มี
  originCountryCode?: string;     // M
  netWeight?: string;             // M
  netWeightUnit?: string;         // M
  quantity?: string;              // M
  quantityUnit?: string;          // M
  currencyCode?: string;          // M
  exchangeRate?: string;          // M
  unitPriceForeign?: string;      // M
  unitPriceBaht?: string;         // M
  invoiceQuantity?: string;       // M
  invoiceQuantityUnit?: string;   // M
  invoiceAmountForeign?: string;  // M
  invoiceAmountBaht?: string;     // M
  cifValueForeign?: string;       // M
  cifValueBaht?: string;          // M
  shippingMarks?: string;         // M
  reImportationCertificate?: 'Y' | 'N'; // M
  boi?: 'Y' | 'N';                // M - สิทธิ์ส่งเสริมการลงทุน
  bond?: 'Y' | 'N';               // M - คลังสินค้าทัณฑ์บน
  bis19?: 'Y' | 'N';              // M - คืนอากร ม.19 ทวิ
  reExport?: 'Y' | 'N';           // M
  fz?: 'Y' | 'N';                 // M - Free Zone
  ieat?: 'Y' | 'N';               // M

  duties: DmfDutyRow[];
  permits: DmfPermitRow[];
}

// ── ส่วนควบคุมอินวอย (Invoice Control) — หนึ่งอินวอยต่อคำร้อง ─────────────────────
export interface DmfInvoiceData {
  invoiceNumber?: string;       // M
  invoiceDate?: string;         // M
  purchaseOrderNumber?: string; // M
  termOfPaymentCode?: string;   // M
  tradeTerms?: string;          // M - INCOTERMS เช่น CIF/FOB
  buyerStatus?: string;         // M - AG/DI/CO/MA/OT
  consignorStatus?: string;     // M - AG/DI/CO/MA/OT
  commercialLevel?: string;     // M - WO/RE
  consignorName?: string;       // M
  streetAndNumber?: string;     // M
  district?: string;            // O
  subProvince?: string;         // O
  province?: string;            // O
  postcode?: string;            // M
  countryCode?: string;         // M
  invoiceCurrencyCode?: string; // M
  totalInvoiceAmount?: string;  // M
}

// ── ส่วนควบคุม (Control) — header ของคำร้อง ────────────────────────────────────────
export interface DmfControlData {
  // ข้อมูลควบคุมเอกสาร
  declarationNo?: string;       // O - เลขที่ใบขนสินค้า (มักยังไม่มี ณ ตอนยื่นคำร้องขอออกของไปก่อน)
  declarationDate?: string;     // O
  referenceNumber?: string;     // M - an13, XXXXnnnnnnnnn (Profile Name + running number)
  documentType?: string;        // M - fixed '3' = คำร้องขอรับของไปก่อน

  // ข้อมูลบริษัทผู้นำเข้า
  companyTaxNumber?: string;    // M
  companyBranch?: string;       // M
  companyName?: string;         // M (TH)
  companyEnglishName?: string;  // M
  streetAndNumber?: string;     // M
  district?: string;            // O
  subProvince?: string;         // O
  province?: string;            // O
  postcode?: string;            // M

  // ตัวแทนออกของ / ผู้ปฏิบัติพิธีการ / ผู้รับมอบอำนาจ
  brokerTaxNumber?: string;         // O
  brokerBranch?: string;            // C - เมื่อมี brokerTaxNumber
  customsClearanceIdCard?: string;  // M
  customsClearanceName?: string;    // M
  managerIdCard?: string;           // M
  managerName?: string;             // M

  // ข้อมูลการขนส่ง
  modeOfTransport?: string;        // M - 1-9 (UNECE Rec.19)
  cargoTypeCode?: string;          // M - 0-9 (UNECE Rec.21)
  vesselName?: string;             // M
  arrivalDate?: string;            // M
  masterBillOfLading?: string;     // C
  houseBillOfLading?: string;      // M
  outsideReleasePort?: string;     // O
  releasePort?: string;            // M
  dischargePort?: string;          // M
  originCountryCode?: string;      // M
  consignmentCountryCode?: string; // M

  // หีบห่อ/น้ำหนักรวม
  shippingMarks?: string;             // M
  totalPackageAmount?: string;        // M
  totalPackageUnitCode?: string;      // M
  totalNetWeight?: string;            // M
  netWeightUnitCode?: string;         // M
  totalGrossWeight?: string;          // M
  totalGrossWeightUnitCode?: string;  // M

  // มูลค่า/อัตราแลกเปลี่ยนรวม
  currencyCode?: string;    // M
  exchangeRate?: string;    // M
  cifValueForeign?: string; // M
  cifValueBaht?: string;    // M

  // การชำระเงิน
  paymentMethod?: string;       // M - A/H/L
  totalTax?: string;            // M
  totalDeposit?: string;        // M
  rgsCode?: string;             // C
  customsBankCode?: string;     // C
  bankCode?: string;            // C
  bankBranchCode?: string;      // C
  bankAccountNumber?: string;   // C
  totalPaymentAmount?: string;  // C

  // การวางประกัน — หัวใจของคำร้องขอออกของไปก่อน (ต้องค้ำประกันก่อนรับของออกระหว่างรอ DMF อนุมัติ)
  guaranteeMethod?: string;             // M - A/H/L
  guaranteeType?: string;               // C - C/B/E/O/M
  guaranteeBankCode?: string;           // C
  guaranteeBankBranchCode?: string;     // C
  guaranteeBankAccountNumber?: string;  // O
  totalDepositAmount?: string;          // C

  departureDate?: string;   // C
  approvalPort?: string;    // C
  approvalNumber?: string;  // C

  exportTaxIncentivesId?: string;  // C
  senderRegistrationId?: string;   // M - รหัสประจำตัวผู้ส่งข้อมูล
}

export interface PetroleumDutyDeclarationData {
  control: DmfControlData;
  invoice: DmfInvoiceData;
  items: DmfItemData[];
}

export interface PetroleumOcrResultsData {
  referenceNumber?: string;
  companyName?: string;
  vesselName?: string;
  itemCount: number;
  declaration?: PetroleumDutyDeclarationData;
  declarationComplete?: boolean;
  declarationGateRequired?: boolean;
}

// One row of the DMF submission-status item table — flattened from DmfItemData for display,
// same field set as the reference "ผลการส่งข้อมูล/DECL" screens DMF returns after ยื่นข้อมูล.
export interface DmfSubmissionStatusItem {
  itemNo: number;
  invNo: string;
  invItem: string;
  tariff: string;
  stat: string;
  enDesc: string;
  thDesc: string;
  pk: string;
  nw: string;
  qty: string;
  invAmount: string;
  cifForeign: string;
  cifBaht: string;
  dutyExempt: boolean; // true once DMF grants the ม.70 duty exemption for this item (LICENSE ACCEPT)
}

// "ดูรายละเอียดใบอนุญาต" detail — only present once status is 'license-accept'.
export interface DmfLicenseDetail {
  licenseNo: string;
  issueDate: string;
  requestNo: string;
  licenseName: string;
  licenseIssueAuthority: string;
  licenseAuthorityName: string;
  licenseType: string;
  licenseIssueDate: string;
  effectiveDate: string;
  expireDate: string;
}

// Posted right after "ยืนยันส่งกรม" on the DMF (เชื้อเพลิง) duty-exemption path — mocks the real
// ยื่นข้อมูลผ่านระบบคอมพิวเตอร์ round-trip to กรมเชื้อเพลิงธรรมชาติ กระทรวงพลังงาน:
//   waiting-response → dmf-accept (DECL info + item table appear) → license-accept (duty-exempt
//   items ticked + license detail unlocked). ChatService.showDmfSubmissionStatus() flips this same
//   message's data in place through the 3 stages, same updateLastMessageData() convention as
//   showRubberEqcStatus()/showAgencyApproval().
export interface DmfSubmissionStatusData {
  agency: string; // 'กรมเชื้อเพลิงธรรมชาติ'
  referenceNumber: string;
  status: 'waiting-response' | 'dmf-accept' | 'license-accept';
  declNo?: string;
  declDate?: string;
  companyNameTh?: string;
  companyNameEn?: string;
  taxNumber?: string;
  branch?: string;
  address?: string;
  remark?: string;
  items?: DmfSubmissionStatusItem[];
  license?: DmfLicenseDetail;
}

// ─── Queue / Shipment ────────────────────────────────────────────────────────

// dld/fda/dft/doa/diw are import-side agencies; ddc/raot are export-side agencies added for the
// ขาออก pink-form flow (see ChatService.QR_PAYMENT_AGENCIES) — กรมควบคุมโรค/การยาง.
// dmf = กรมเชื้อเพลิงธรรมชาติ (Department of Mineral Fuels) — both the 'เชื้อเพลิง' item-hs-analysis
// group (product-hs-analysis.mock.ts p1/p3, import-side) and the standalone import-side petroleum
// duty-exemption path (see 'petroleum-ocr-results' above) map to this same real-world department.
export type AgencyKey = 'dld' | 'fda' | 'dft' | 'doa' | 'diw' | 'ddc' | 'raot' | 'dmf' | 'none';

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
  // Files the department sent back after approval + payment (QR_PAYMENT_AGENCIES flow only —
  // see ChatService.showAgencyReturnedDocs / agency-docs-returned.component.ts for the chat-side
  // equivalent). Only present once that flow has actually completed.
  returnedDocuments?: ShipmentDocument[];
  // True once the department has finished its review (ChatService.showAgencyApproval /
  // QueuePageComponent.approveDeptReview, QR_PAYMENT_AGENCIES only) — set before paymentQr,
  // since the QR itself arrives from the department on its own unpredictable timeline. Lets the
  // queue detail page tell "still under review" apart from "approved, waiting on the QR".
  deptApproved?: boolean;
  // QR-payment state for QR_PAYMENT_AGENCIES (chat.service.ts) once the department sends the QR —
  // set by ChatService.markDeptApproved()'s caller / QueuePageComponent.mockQrArrival(), cleared
  // by no one (stays for history once paid). 'unpaid': QR ready to view/pay in the queue detail
  // view. 'paid_pending': user paid, waiting on the department's confirmation. 'paid_confirmed'
  // is never actually set — once confirmed the department's returnedDocuments show up instead and
  // this field is just left as history.
  paymentQr?: {
    agency: string;
    amount: number;
    refNo: string;
    expiresAt: string;
    status: 'unpaid' | 'paid_pending' | 'paid_confirmed';
  };
  // การยาง only: set once RubberCertPaymentComponent's fee is paid (ChatService.onRubberCertPaid) —
  // the หนังสือรับรองคุณภาพยาง (e-QC) is a separate document from returnedDocuments (the department's
  // final permit), obtained earlier in the flow via bank account debit rather than QR.
  rubberCertPayment?: {
    itemNames: string[];
    amount: number;
    refNo: string;
    paidAccountLabel: string; // e.g. "ธนาคารกสิกรไทย xxx-x-x4821-5"
    certUrl: string;
    paidAt: string;
  };
  // การยาง only: live e-QC/e-SFR round status mirrored from the chat's own RubberEqcStatusData/
  // RubberEsfrStatusData as the user progresses through each — lets the queue detail page show
  // the SAME "waiting on the department" state the chat card shows, not just the end result.
  // undefined means that sub-flow was never started this round (e.g. user skipped e-SFR).
  eqcStatus?: 'rubber-accept' | 'rubber-accept-ready' | 'license-accept';
  esfrStatus?: 'rubber-accept' | 'license-accept';
  // การยาง only: set once RubberEsfrStatusComponent's "ดำเนินการต่อ" is clicked while
  // 'license-accept' (ChatService.finalizeEsfrRound) — the e-SFR fee-receipt download, shown
  // alongside rubberCertPayment (e-QC) above when both are present, independently of each other.
  esfrFeeReceipt?: RubberEsfrFeeReceiptData;
  // DMF (เชื้อเพลิง) duty-exemption path only: set once ChatService.showDmfSubmissionStatus()'s
  // mock wait resolves to 'license-accept' — mirrors the chat's own dmf-submission-status card so
  // the queue detail page can show the granted license + exempted items directly, instead of the
  // generic ผลการยื่น card's พิมพ์/ดาวน์โหลดใบอนุญาต buttons (DMF's license isn't a downloadable
  // file in this flow, see QueuePageComponent's submission-result branch).
  dmfLicense?: DmfLicenseDetail;
  dmfSubmissionItems?: DmfSubmissionStatusItem[];
  email?: { toName: string; to: string; subject: string; body: string; attName: string };
  items?: ShipmentItem[]; // per-product line items from the invoice/customs doc used for this LPI request
  itemsSelected?: boolean; // true once the shipment's flow has confirmed its item group (item-hs-analysis) —
                           // the queue detail view's item list card only renders when this is true, since
                           // `items` may be populated ahead of that step existing in mock data
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
