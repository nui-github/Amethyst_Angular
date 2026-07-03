import { ChatHistorySession, ChatMessage } from '@app/core/models/types';

// ── helpers ──────────────────────────────────────────────────────────────────
const mk = (
  id: string, time: string, role: 'bot' | 'user',
  type: ChatMessage['type'], content?: string, data?: unknown,
): ChatMessage => ({ id, role, type, content, data, time, isReadOnly: true } as ChatMessage);

const bot  = (id: string, time: string, content: string) => mk(id, time, 'bot', 'text', content);
const usr  = (id: string, time: string, content: string) => mk(id, time, 'user', 'text', content);
const card = (id: string, time: string, type: ChatMessage['type'], data: unknown) =>
  mk(id, time, 'bot', type, undefined, data);

const WELCOME_MSG: ChatMessage = {
  id: 'w', role: 'bot', type: 'text', time: '09:00',
  content: 'สวัสดีครับ! ผมคือ <strong>Netbay Agent</strong><br>ช่วยท่านจัดการเอกสารนำเข้า-ส่งออก และพิธีการศุลกากรได้ครับ<br>ต้องการทำอะไรวันนี้?',
  isReadOnly: true,
};

const OCR_DATA_INV8834 = {
  invoiceNo: 'INV-2024-8834', invoiceDate: '05/06/2568', quantity: '250 กิโลกรัม',
  importer: 'บริษัท เฮลท์ฟาร์มา จำกัด', port: 'ท่าเรือแหลมฉบัง',
  hsCode: '2941.10.00', countryOrigin: 'อินเดีย', lotNo: 'LOT-2024-567', uNo: 'U-2568-00123',
};

const HS_FDA = {
  hsCode: '2941.10.00', goodsName: 'ยาปฏิชีวนะ / วัตถุดิบยา',
  description: 'จัดเป็นวัตถุดิบยาปฏิชีวนะ → ต้องขออนุญาตนำเข้าจาก อย.',
  requiresPermit: true, direction: 'import', agency: 'อย.',
  agencyFull: 'สำนักงานคณะกรรมการอาหารและยา', licenseType: 'RGoods',
  confidence: 96, agencies: [{ code: 'อย.', name: 'สำนักงานคณะกรรมการอาหารและยา', fee: false }],
};

const HS_DOA = {
  hsCode: '1001.19.00', goodsName: 'ข้าวสาลี / ผลิตภัณฑ์เกษตร',
  description: 'สินค้าเกษตรควบคุม → ต้องขออนุญาตนำเข้าจาก กษ.',
  requiresPermit: true, direction: 'import', agency: 'กษ.',
  agencyFull: 'กรมวิชาการเกษตร', licenseType: 'LPI',
  confidence: 91, agencies: [{ code: 'กษ.', name: 'กรมวิชาการเกษตร', fee: true }],
};

const d = (daysAgo: number) => Date.now() - daysAgo * 86_400_000;

// ── Session 1: INV-2024-8834 · ส่งกรมแล้ว อย. ────────────────────────────────
const sess1Messages: ChatMessage[] = [
  WELCOME_MSG,
  usr('s1u1', '09:01', 'เอกสารนำเข้าสินค้า'),
  usr('s1u2', '09:02', 'อัปโหลดเอกสารเอง'),
  usr('s1u3', '09:02', 'ใบขนสินค้า'),
  card('s1b1', '09:03', 'ocr-results', { ...OCR_DATA_INV8834, autoProceeded: false }),
  usr('s1u4', '09:04', 'ดำเนินการต่อ'),
  card('s1b2', '09:04', 'hs-analysis', HS_FDA),
  usr('s1u5', '09:05', 'เลือก อย.'),
  usr('s1u6', '09:06', 'ยืนยันโปรไฟล์และดำเนินการต่อ'),
  card('s1b3', '09:07', 'form-preview', {
    invoiceNo: 'INV-2024-8834', invoiceDate: '05/06/2568', quantity: '250 กิโลกรัม',
    importer: 'บริษัท เฮลท์ฟาร์มา จำกัด', port: 'ท่าเรือแหลมฉบัง',
    hsCode: '2941.10.00', countryOrigin: 'อินเดีย', goodsDesc: 'วัตถุดิบยาปฏิชีวนะ',
    ref: 'HTHM-2568-00412', lotNo: 'LOT-2024-567', uNo: 'U-2568-00123',
  }),
  usr('s1u7', '09:08', 'ดำเนินการต่อ'),
  usr('s1u8', '09:09', 'ยืนยันส่งกรม'),
  card('s1b4', '09:09', 'status-card', {
    refNo: 'RG-2568-32104', customsRef: 'INV-2024-8834',
    submittedAt: '5 มิ.ย. 2568', isPending: false,
  }),
];

// ── Session 2: RG-2568-19203 · รอชำระ กษ. ────────────────────────────────────
const sess2Messages: ChatMessage[] = [
  WELCOME_MSG,
  usr('s2u1', '10:15', 'เอกสารนำเข้าสินค้า'),
  usr('s2u2', '10:16', 'อัปโหลดเอกสารเอง'),
  usr('s2u3', '10:16', 'ใบ Invoice'),
  card('s2b1', '10:17', 'ocr-results', {
    invoiceNo: 'INV-2024-9012', invoiceDate: '01/06/2568', quantity: '5,000 กิโลกรัม',
    importer: 'บริษัท อะกริโปรดักส์ จำกัด', port: 'ท่าเรือแหลมฉบัง',
    hsCode: '1001.19.00', countryOrigin: 'ออสเตรเลีย', lotNo: 'LT-AU-0601', uNo: '',
  }),
  usr('s2u4', '10:18', 'ดำเนินการต่อ'),
  card('s2b2', '10:18', 'hs-analysis', HS_DOA),
  usr('s2u5', '10:19', 'เลือก กษ.'),
  usr('s2u6', '10:20', 'ยืนยันโปรไฟล์และดำเนินการต่อ'),
  card('s2b3', '10:22', 'form-preview', {
    invoiceNo: 'INV-2024-9012', invoiceDate: '01/06/2568', quantity: '5,000 กิโลกรัม',
    importer: 'บริษัท อะกริโปรดักส์ จำกัด', port: 'ท่าเรือแหลมฉบัง',
    hsCode: '1001.19.00', countryOrigin: 'ออสเตรเลีย', goodsDesc: 'ข้าวสาลี',
  }),
  usr('s2u7', '10:23', 'ดำเนินการต่อ'),
  usr('s2u8', '10:24', 'ยืนยันส่งกรม'),
  card('s2b4', '10:24', 'status-card', {
    refNo: 'RG-2568-19203', customsRef: 'INV-2024-9012',
    submittedAt: '1 มิ.ย. 2568', isPending: true,
  }),
  card('s2b5', '10:25', 'payment-qr', {
    agency: 'กษ.', amount: 500, refNo: 'PAY-887213', expiresAt: '10:40',
  }),
];

// ── Session 3: INV-2024-7201 · ตรวจสอบก่อนส่งกรม ─────────────────────────────
const sess3Messages: ChatMessage[] = [
  WELCOME_MSG,
  usr('s3u1', '14:00', 'เอกสารนำเข้าสินค้า'),
  usr('s3u2', '14:01', 'อัปโหลดเอกสารเอง'),
  usr('s3u3', '14:01', 'ใบขนสินค้า'),
  card('s3b1', '14:02', 'ocr-results', {
    invoiceNo: 'INV-2024-7201', invoiceDate: '28/05/2568', quantity: '120 กิโลกรัม',
    importer: 'บริษัท ไบโอเมด ซัพพลาย จำกัด', port: 'ท่าเรือกรุงเทพ',
    hsCode: '3002.15.00', countryOrigin: 'เยอรมนี', lotNo: 'BIO-DE-0528', uNo: 'U-2568-00089',
  }),
  usr('s3u4', '14:03', 'ดำเนินการต่อ'),
  card('s3b2', '14:03', 'hs-analysis', {
    ...HS_FDA, hsCode: '3002.15.00', goodsName: 'วัคซีน / ชีววัตถุ',
    description: 'ชีววัตถุทางการแพทย์ → ต้องขออนุญาตนำเข้าจาก อย.',
    confidence: 94,
  }),
  usr('s3u5', '14:04', 'เลือก อย.'),
  usr('s3u6', '14:05', 'ยืนยันโปรไฟล์และดำเนินการต่อ'),
  card('s3b3', '14:06', 'form-preview', {
    invoiceNo: 'INV-2024-7201', invoiceDate: '28/05/2568', quantity: '120 กิโลกรัม',
    importer: 'บริษัท ไบโอเมด ซัพพลาย จำกัด', port: 'ท่าเรือกรุงเทพ',
    hsCode: '3002.15.00', countryOrigin: 'เยอรมนี', goodsDesc: 'วัคซีน mRNA ชีววัตถุ',
    lotNo: 'BIO-DE-0528', uNo: 'U-2568-00089',
  }),
];

// ── Session 4: HTHM-2568-00412 · OCR เสร็จแล้ว ───────────────────────────────
const sess4Messages: ChatMessage[] = [
  WELCOME_MSG,
  usr('s4u1', '11:30', 'เอกสารนำเข้าสินค้า'),
  usr('s4u2', '11:31', 'อัปโหลดเอกสารเอง'),
  usr('s4u3', '11:31', 'ใบขนสินค้า'),
  card('s4b1', '11:33', 'ocr-results', {
    invoiceNo: 'INV-2024-6601', invoiceDate: '20/05/2568', quantity: '80 กิโลกรัม',
    importer: 'บริษัท เคมีวิทย์ จำกัด', port: 'ท่าอากาศยานสุวรรณภูมิ',
    hsCode: '2933.39.90', countryOrigin: 'สวิตเซอร์แลนด์', lotNo: 'CH-2024-0520', uNo: '',
  }),
];

// ── Session 5: INV-2024-6540 · ยืนยัน flags ──────────────────────────────────
const sess5Messages: ChatMessage[] = [
  WELCOME_MSG,
  usr('s5u1', '08:00', 'เอกสารนำเข้าสินค้า'),
  usr('s5u2', '08:01', 'อัปโหลดเอกสารเอง'),
  usr('s5u3', '08:01', 'เอกสารชุดสำหรับการขอใบอนุญาตนำเข้า'),
  card('s5b1', '08:04', 'ocr-results', {
    invoiceNo: 'INV-2024-6540', invoiceDate: '15/05/2568', quantity: '1,200 กิโลกรัม',
    importer: 'บริษัท ฟู้ดอิมพอร์ต จำกัด', port: 'ท่าเรือแหลมฉบัง',
    hsCode: '0402.10.00', countryOrigin: 'นิวซีแลนด์', lotNo: 'NZ-MILK-0515', uNo: '',
  }),
  usr('s5u4', '08:05', 'ดำเนินการต่อ'),
  card('s5b2', '08:05', 'hs-analysis', {
    ...HS_DOA, hsCode: '0402.10.00', goodsName: 'นมผง / ผลิตภัณฑ์นม',
    description: 'ผลิตภัณฑ์นมนำเข้า → ต้องขออนุญาตนำเข้าจาก กษ.', confidence: 88,
  }),
  usr('s5u5', '08:06', 'เลือก กษ.'),
  usr('s5u6', '08:07', 'ยืนยันโปรไฟล์และดำเนินการต่อ'),
  card('s5b3', '08:10', 'flag-card', {
    flags: [
      { id: 'f1', title: 'ปริมาณไม่ตรงกัน', detail: 'Invoice: 1,200 กก. / Packing List: 1,195.5 กก.', conf: 78, resolved: false, value: '' },
      { id: 'f2', title: 'วันหมดอายุสินค้าไม่ชัดเจน', detail: 'CoA ระบุ BB: 05/2025 — กรุณาตรวจสอบ', conf: 61, resolved: false, value: '' },
    ],
  }),
];

// ── Session 6: HS 2941.10.00 · วิเคราะห์ HS Code ─────────────────────────────
const sess6Messages: ChatMessage[] = [
  WELCOME_MSG,
  usr('s6u1', '16:45', 'เอกสารนำเข้าสินค้า'),
  usr('s6u2', '16:46', 'อัปโหลดเอกสารเอง'),
  usr('s6u3', '16:46', 'ใบขนสินค้า'),
  card('s6b1', '16:48', 'ocr-results', {
    invoiceNo: 'INV-2024-5320', invoiceDate: '10/05/2568', quantity: '500 กิโลกรัม',
    importer: 'บริษัท ฟาร์มาซัพ จำกัด', port: 'ท่าเรือแหลมฉบัง',
    hsCode: '2941.10.00', countryOrigin: 'จีน', lotNo: 'CN-AMX-0510', uNo: '',
  }),
  usr('s6u4', '16:49', 'ดำเนินการต่อ'),
  card('s6b2', '16:49', 'hs-analysis', { ...HS_FDA, confidence: 93 }),
];

// ── Session 7: อัปโหลดเอกสาร (ยังไม่ได้ upload file — ไม่มีเลขนำหน้าชื่อ) ─────
const sess7Messages: ChatMessage[] = [
  WELCOME_MSG,
  usr('s7u1', '13:10', 'เอกสารนำเข้าสินค้า'),
  usr('s7u2', '13:10', 'อัปโหลดเอกสารเอง'),
  usr('s7u3', '13:11', 'ใบ Invoice'),
  card('s7b1', '13:11', 'single-upload', { mode: 'invoice' }),
];

// ── Export ────────────────────────────────────────────────────────────────────
export const MOCK_SESSIONS: ChatHistorySession[] = [
  { id: 'sess_mock_1', baseRef: 'INV-2024-8834', title: 'INV-2024-8834 · ส่งกรมแล้ว อย.',       timestamp: d(0), messages: sess1Messages },
  { id: 'sess_mock_2', baseRef: 'RG-2568-19203', title: 'RG-2568-19203 · รอชำระ กษ.',            timestamp: d(1), messages: sess2Messages },
  { id: 'sess_mock_3', baseRef: 'INV-2024-7201', title: 'INV-2024-7201 · ตรวจสอบก่อนส่งกรม',    timestamp: d(2), messages: sess3Messages },
  { id: 'sess_mock_4', baseRef: 'HTHM-2568-00412', title: 'HTHM-2568-00412 · OCR เสร็จแล้ว',    timestamp: d(4), messages: sess4Messages },
  { id: 'sess_mock_5', baseRef: 'INV-2024-6540',  title: 'INV-2024-6540 · ยืนยัน flags',        timestamp: d(5), messages: sess5Messages },
  { id: 'sess_mock_6', baseRef: 'HS 2941.10.00',  title: 'HS 2941.10.00 · วิเคราะห์ HS Code',   timestamp: d(7), messages: sess6Messages },
  // ยังไม่ได้ upload file (inv/ใบขน/xml) เลย — title จึงเป็นแค่ชื่อ step ล่าสุด ไม่มีเลขนำหน้า
  { id: 'sess_mock_7', baseRef: '',               title: 'อัปโหลดเอกสาร',                       timestamp: d(3), messages: sess7Messages },
];
