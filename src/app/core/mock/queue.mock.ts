import { Shipment, ShipmentStatus, AgencyKey, ChatMessage, ShipmentDocument } from '@app/core/models/types';

// sample public PDF for mock — swap to signed URLs from GET /shipments/:id/documents in production
const SAMPLE_PDF = 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/PDF1.pdf';

const doc = (
  id: string, name: string,
  category: ShipmentDocument['category'],
  fileType: ShipmentDocument['fileType'] = 'pdf',
  agencyKey?: AgencyKey,
  uploadedAt = '29/6/2569 09:43',
): ShipmentDocument => ({ id, name, fileType, category, url: SAMPLE_PDF, uploadedAt, agencyKey });

export const AGENCY_LABEL: Record<AgencyKey, string> = {
  dld: 'กรมปศุสัตว์', fda: 'อย.', dft: 'กรมการค้าต่างประเทศ',
  doa: 'กษ.', diw: 'วอ.', none: 'ไม่ระบุ',
};
export const AGENCY_SHORT: Record<AgencyKey, string> = {
  dld: 'ปศ.', fda: 'อย.', dft: 'กค.', doa: 'กษ.', diw: 'วอ.', none: '—',
};

export const STATUS_META: Record<ShipmentStatus, { label: string; bg: string; text: string; dot: string }> = {
  needs_you: { label: 'รอดำเนินการ',        bg: '#FFFBEB', text: '#B45309', dot: '#F59E0B' },
  no_permit: { label: 'ไม่ต้องขอใบอนุญาต', bg: '#F3F4F6', text: '#6B7280', dot: '#9CA3AF' },
  submitted:  { label: 'ยื่นแล้ว',           bg: '#ECFDF5', text: '#065F46', dot: '#10B981' },
};

const t = (time: string, role: 'bot'|'user', type: ChatMessage['type'], content?: string, data?: unknown): ChatMessage => ({
  id: `mock_${Math.random().toString(36).slice(2)}`,
  role, type, content, data, time, isReadOnly: true,
} as ChatMessage);

const bot = (time: string, content: string): ChatMessage => t(time, 'bot', 'text', content);
const usr = (time: string, content: string): ChatMessage => t(time, 'user', 'text', content);

export const MOCK_QUEUE: Shipment[] = [
  // ── 1. needs_you: Amoxicillin – รอยืนยัน flags ──────────────────────────────
  {
    id: 'IMP-68-008912', customsNo: 'A012-25680617-00891', hthmRef: 'HTHM000000001',
    isNew: true, type: 'IMP',
    goods: 'Amoxicillin Trihydrate (วัตถุดิบยาปฏิชีวนะ)', hs: '2941.10.00',
    customer: 'บริษัท เฮลท์ฟาร์มา จำกัด', contact: 'คุณสมหญิง วัฒนกุล',
    contactEmail: 'somying@healthpharma.co.th',
    origin: 'อินเดีย', importedAt: '09:42 น. วันนี้', owner: 'ปวีณา ส.',
    agency: 'fda', permitNeeded: true, formCode: 'RGoods',
    formName: 'คำขออนุญาตนำเข้าวัตถุดิบยา (RGoods) — อย.',
    conf: 96, stage: 5, statusKey: 'needs_you',
    assess: { conf: 96, reason: 'ตรงตามเงื่อนไขการนำเข้า' },
    classify: { agency: 'fda', conf: 96, reason: '', alt: [] },
    draft: { fields: [] },
    flags: [
      { id: 'f1', title: 'ปริมาณไม่ตรง', detail: 'Invoice: 250 กก. / Packing List: 248.5 กก.', conf: 72, resolved: false },
      { id: 'f2', title: 'เลข GMP อ่านไม่ชัด', detail: '3 ตัวท้ายไม่ชัดเจน', conf: 65, resolved: false },
    ],
    audit: [
      { time: '09:42', text: 'เข้าระบบ', by: 'ระบบ' },
      { time: '09:43', text: 'OCR สำเร็จ', by: 'AI' },
      { time: '09:43', text: 'วิเคราะห์ HS Code: 2941.10.00 → อย. (96%)', by: 'AI' },
      { time: '09:44', text: 'พบ 2 จุดต้องตรวจสอบ รอยืนยัน', by: 'AI' },
    ],
    messages: [
      bot('09:42', 'ใบขนสินค้า HTHM000000001 เข้าระบบแล้วครับ — Amoxicillin Trihydrate 250 กก. จากอินเดีย ท่าเรือแหลมฉบัง'),
      usr('09:42', 'อัปโหลดเอกสารเรียบร้อยแล้ว'),
      t('09:43', 'bot', 'ocr-results', undefined, {
        invoiceNo: 'INV-2024-8834', invoiceDate: '15/06/2568', quantity: '250 กก.',
        importer: 'บริษัท เฮลท์ฟาร์มา จำกัด', port: 'ท่าเรือแหลมฉบัง',
        hsCode: '2941.10.00', countryOrigin: 'อินเดีย', lotNo: 'AMX-2024-0617', uNo: '',
      }),
      t('09:43', 'bot', 'hs-analysis', undefined, {
        hsCode: '2941.10.00', goodsName: 'ยาปฏิชีวนะ / วัตถุดิบยา',
        description: 'จัดเป็นวัตถุดิบยาปฏิชีวนะ → ต้องขออนุญาตนำเข้าจาก อย. (ใบอนุญาตวัตถุดิบยา RGoods)',
        requiresPermit: true, direction: 'import', agency: 'อย.', agencyFull: 'สำนักงานคณะกรรมการอาหารและยา',
        licenseType: 'RGoods', confidence: 96,
      }),
      bot('09:44', 'พบ 2 จุดที่ควรตรวจสอบก่อนดำเนินการต่อครับ — กรุณายืนยันข้อมูลแต่ละจุด'),
      t('09:44', 'bot', 'flag-card', undefined, {
        gen: 1, flags: [
          { id: 'f1', title: 'ปริมาณไม่ตรง', detail: 'Invoice ระบุ 250 กก. แต่ Packing List ระบุ 248.5 กก.', conf: 72, resolved: false },
          { id: 'f2', title: 'เลข GMP อ่านไม่ชัด', detail: '3 ตัวท้ายของเลข GMP ไม่ชัดเจน — AI มั่นใจ 65%', conf: 65, resolved: false },
        ],
      }),
    ],
    documents: [
      doc('d1a', 'Invoice INV-2024-8834', 'invoice'),
      doc('d1b', 'Packing List', 'packing_list'),
    ],
  },

  // ── 2. needs_you: Human Insulin – รอยืนยัน flag + form-preview ───────────────
  {
    id: 'IMP-68-008915', customsNo: 'A012-25680617-00915', hthmRef: 'HTHM000000002',
    isNew: true, type: 'IMP',
    goods: 'Human Insulin (มาตรฐานอินซูลิน สำเร็จรูป)', hs: '2941.10.00',
    customer: 'บริษัท เฮลท์ฟาร์มา จำกัด', contact: 'คุณสมหญิง วัฒนกุล',
    contactEmail: 'somying@healthpharma.co.th',
    origin: 'เยอรมนี', importedAt: '09:31 น. วันนี้', owner: 'ปวีณา ส.',
    agency: 'fda', permitNeeded: true, formCode: 'RGoods',
    formName: 'คำขออนุญาตนำเข้าวัตถุดิบยา (RGoods) — อย.',
    conf: 91, stage: 6, statusKey: 'needs_you',
    assess: { conf: 91, reason: 'ตรงตามเงื่อนไขการนำเข้า' },
    classify: { agency: 'fda', conf: 91, reason: '', alt: [] },
    draft: { fields: [] },
    flags: [
      { id: 'f3', title: 'วันหมดอายุต่างกัน', detail: 'CoA vs Label ต่างกัน 1 วัน', conf: 78, resolved: true },
    ],
    audit: [
      { time: '09:31', text: 'เข้าระบบ', by: 'ระบบ' },
      { time: '09:32', text: 'OCR สำเร็จ', by: 'AI' },
      { time: '09:32', text: 'วิเคราะห์ HS Code: 2941.10.00 → อย. (91%)', by: 'AI' },
      { time: '09:33', text: 'พบ 1 จุดต้องตรวจสอบ', by: 'AI' },
      { time: '09:35', text: 'ยืนยัน flag แล้ว', by: 'ปวีณา ส.' },
    ],
    messages: [
      bot('09:31', 'ใบขนสินค้า HTHM000000002 เข้าระบบแล้วครับ — Human Insulin 100 ไวอัล จากเยอรมนี'),
      t('09:32', 'bot', 'ocr-results', undefined, {
        invoiceNo: 'DE-2024-0615', invoiceDate: '10/06/2568', quantity: '100 ไวอัล',
        importer: 'บริษัท เฮลท์ฟาร์มา จำกัด', port: 'สุวรรณภูมิ',
        hsCode: '2941.10.00', countryOrigin: 'เยอรมนี', lotNo: 'INS-2024-DE001', uNo: '',
      }),
      t('09:32', 'bot', 'hs-analysis', undefined, {
        hsCode: '2941.10.00', goodsName: 'ฮอร์โมนอินซูลิน / ยาสำเร็จรูป',
        description: 'จัดเป็นยาสำเร็จรูปประเภทฮอร์โมน → ต้องขออนุญาตนำเข้าจาก อย.',
        requiresPermit: true, direction: 'import', agency: 'อย.', agencyFull: 'สำนักงานคณะกรรมการอาหารและยา',
        licenseType: 'RGoods', confidence: 91,
      }),
      t('09:33', 'bot', 'flag-card', undefined, {
        gen: 1, flags: [
          { id: 'f3', title: 'วันหมดอายุต่างกัน', detail: 'ใบ CoA ระบุ Exp. 12/2025 แต่ Label ระบุ 11/2025', conf: 78, resolved: true },
        ],
      }),
      t('09:36', 'bot', 'form-preview', undefined, {
        invoiceNo: 'DE-2024-0615', quantity: '100 ไวอัล',
        importer: 'บริษัท เฮลท์ฟาร์มา จำกัด', port: 'สุวรรณภูมิ',
        hsCode: '2941.10.00', countryOrigin: 'เยอรมนี', goodsDesc: 'Human Insulin สำเร็จรูป',
      }),
    ],
    documents: [
      doc('d2a', 'Invoice DE-2024-0615', 'invoice'),
      doc('d2b', 'Packing List', 'packing_list'),
      doc('d2c', 'Certificate of Analysis (CoA)', 'coa'),
    ],
  },

  // ── 3. needs_you: Surgical Gloves – รอ agency-upload ──────────────────────────
  {
    id: 'IMP-68-008920', customsNo: 'A012-25680617-00920', hthmRef: 'HTHM000000003',
    isNew: true, type: 'IMP',
    goods: 'Surgical Gloves (ถุงมือผ่าตัด ชนิดปราศจากเชื้อ)', hs: '4015.11.00',
    customer: 'บริษัท เฮลท์ฟาร์มา จำกัด', contact: 'คุณสมหญิง วัฒนกุล',
    contactEmail: 'somying@healthpharma.co.th',
    origin: 'มาเลเซีย', importedAt: '08:55 น. วันนี้', owner: 'ปวีณา ส.',
    agency: 'fda', permitNeeded: true, formCode: 'RGoods',
    formName: 'คำขออนุญาตนำเข้าเครื่องมือแพทย์ — อย.',
    conf: 88, stage: 4, statusKey: 'needs_you',
    assess: { conf: 88, reason: 'ต้องใช้ใบอนุญาตเครื่องมือแพทย์' },
    classify: { agency: 'fda', conf: 88, reason: '', alt: [] },
    draft: { fields: [] },
    flags: [],
    audit: [
      { time: '08:55', text: 'เข้าระบบ', by: 'ระบบ' },
      { time: '08:56', text: 'OCR สำเร็จ', by: 'AI' },
      { time: '08:57', text: 'วิเคราะห์ HS Code: 4015.11.00 → อย. (88%)', by: 'AI' },
      { time: '08:57', text: 'รอแนบเอกสารรายกรม', by: 'AI' },
    ],
    messages: [
      bot('08:55', 'ใบขนสินค้า HTHM000000003 เข้าระบบแล้วครับ — Surgical Gloves จากมาเลเซีย'),
      t('08:56', 'bot', 'ocr-results', undefined, {
        invoiceNo: 'MY-2024-0312', invoiceDate: '01/06/2568', quantity: '5,000 ชิ้น',
        importer: 'บริษัท เฮลท์ฟาร์มา จำกัด', port: 'ท่าเรือแหลมฉบัง',
        hsCode: '4015.11.00', countryOrigin: 'มาเลเซีย', lotNo: 'GLV-MY-312', uNo: '',
      }),
      t('08:57', 'bot', 'hs-analysis', undefined, {
        hsCode: '4015.11.00', goodsName: 'ถุงมือผ่าตัด / เครื่องมือแพทย์',
        description: 'เครื่องมือแพทย์ประเภทถุงมือปราศจากเชื้อ → ต้องขออนุญาตนำเข้าจาก อย.',
        requiresPermit: true, direction: 'import', agency: 'อย.', agencyFull: 'สำนักงานคณะกรรมการอาหารและยา',
        licenseType: 'RGoods', confidence: 88,
      }),
      t('08:58', 'bot', 'agency-upload', undefined, {
        agency: 'fda', agencyLabel: 'อย.',
        slots: [
          { id: 's1', label: 'ใบรับรองมาตรฐาน (ISO 13485)', required: true },
          { id: 's2', label: 'Certificate of Conformity', required: true },
          { id: 's3', label: 'Packing List', required: false },
        ],
      }),
    ],
    documents: [
      doc('d3a', 'Invoice MY-2024-0312', 'invoice'),
      doc('d3b', 'Packing List', 'packing_list'),
    ],
  },

  // ── 4. submitted: Glyphosate – ยื่น กษ. แล้ว ────────────────────────────────
  {
    id: 'IMP-68-008923', customsNo: 'A012-25680617-00923', hthmRef: 'HTHM000000004',
    isNew: false, type: 'IMP',
    goods: 'Glyphosate Technical (สารกำจัดวัชพืช วัตถุอันตราย)', hs: '2931.39.00',
    customer: 'บริษัท อะกริพลัส จำกัด', contact: 'คุณมานะ รุ่งเรือง',
    contactEmail: 'mana@agriplus.co.th',
    origin: 'จีน', importedAt: '08:10 น. วันนี้', owner: 'ปวีณา ส.',
    agency: 'doa', permitNeeded: true, formCode: 'RGoods',
    formName: 'ใบอนุญาตนำเข้าวัตถุอันตราย — กษ.',
    conf: 82, stage: 7, statusKey: 'submitted',
    assess: { conf: 82, reason: 'วัตถุอันตรายประเภท 3 ต้องขออนุญาต' },
    classify: { agency: 'doa', conf: 82, reason: '', alt: [] },
    draft: { fields: [] },
    flags: [],
    audit: [
      { time: '08:10', text: 'เข้าระบบ', by: 'ระบบ' },
      { time: '08:20', text: 'OCR สำเร็จ', by: 'AI' },
      { time: '08:20', text: 'วิเคราะห์ HS Code: 2931.39.00 → กษ. (82%)', by: 'AI' },
      { time: '08:35', text: 'ตรวจสอบ flag แล้ว', by: 'ปวีณา ส.' },
      { time: '08:40', text: 'ยืนยันฟอร์มแล้ว', by: 'ปวีณา ส.' },
      { time: '08:45', text: 'ยื่นกรม กษ. สำเร็จ', by: 'ระบบ' },
    ],
    messages: [
      bot('08:10', 'ใบขนสินค้า HTHM000000004 เข้าระบบแล้วครับ — Glyphosate Technical จากจีน'),
      t('08:20', 'bot', 'ocr-results', undefined, {
        invoiceNo: 'CN-2024-0601', quantity: '1,000 ลิตร', hsCode: '2931.39.00', countryOrigin: 'จีน',
        importer: 'บริษัท อะกริพลัส จำกัด', port: 'ท่าเรือแหลมฉบัง',
      }),
      t('08:22', 'bot', 'hs-analysis', undefined, {
        hsCode: '2931.39.00', goodsName: 'สารกำจัดวัชพืช / วัตถุอันตราย',
        description: 'วัตถุอันตรายประเภท 3 → ต้องขออนุญาตนำเข้าจาก กษ.',
        requiresPermit: true, direction: 'import', agency: 'กษ.', agencyFull: 'กรมวิชาการเกษตร',
        licenseType: 'ใบอนุญาตวัตถุอันตราย', confidence: 82,
      }),
      t('08:45', 'bot', 'status-card', undefined, {
        refNo: 'RG-2568-20188', customsRef: 'CN-2024-0601',
        submittedAt: new Date().toLocaleDateString('th-TH'), isPending: false,
        feeNote: 'ค่าธรรมเนียมกรม ฿500 จะรวมในบิลรายเดือน',
      }),
    ],
    documents: [
      doc('d4a', 'Invoice CN-2024-0601', 'invoice'),
      doc('d4b', 'Packing List', 'packing_list'),
      doc('d4c', 'Material Safety Data Sheet (MSDS)', 'other', 'pdf', 'doa'),
    ],
  },

  // ── 5. no_permit: HPLC Column – ไม่ต้องขอใบอนุญาต ──────────────────────────
  {
    id: 'IMP-68-008928', customsNo: 'A012-25680617-00928', hthmRef: 'HTHM000000005',
    isNew: false, type: 'IMP',
    goods: 'HPLC Column (คอลัมน์วิเคราะห์สำหรับห้องปฏิบัติการ)', hs: '9027.90.90',
    customer: 'บริษัท เฮลท์ฟาร์มา จำกัด', contact: '',
    contactEmail: '', origin: 'สหรัฐอเมริกา', importedAt: '08:02 น. วันนี้', owner: 'ปวีณา ส.',
    agency: 'none', permitNeeded: false, formCode: '—',
    formName: 'ผ่านพิธีการปกติ',
    conf: 94, stage: 2, statusKey: 'no_permit',
    assess: { conf: 94, reason: 'ไม่อยู่ในบัญชีสินค้าควบคุม' },
    classify: { agency: 'none', conf: 94, reason: '', alt: [] },
    draft: { fields: [] },
    flags: [],
    audit: [
      { time: '08:02', text: 'เข้าระบบ', by: 'ระบบ' },
      { time: '08:02', text: 'วิเคราะห์ HS Code: 9027.90.90 → ไม่ต้องขออนุญาต (94%)', by: 'AI' },
    ],
    messages: [
      bot('08:02', 'ใบขนสินค้า HTHM000000005 เข้าระบบแล้วครับ — HPLC Column จากสหรัฐอเมริกา'),
      t('08:02', 'bot', 'hs-analysis', undefined, {
        hsCode: '9027.90.90', goodsName: 'ส่วนประกอบเครื่องมือวิเคราะห์',
        description: 'อุปกรณ์ห้องปฏิบัติการ — ไม่อยู่ในบัญชีสินค้าควบคุม ผ่านพิธีการปกติได้เลยครับ',
        requiresPermit: false, direction: 'import', agency: 'none', agencyFull: '—', confidence: 94,
      }),
      bot('08:03', 'HS Code 9027.90.90 — ไม่ต้องขออนุญาตนำเข้า ความมั่นใจ 94% ครับ ผ่านพิธีการศุลกากรปกติได้เลย'),
    ],
  },

  // ── 6. submitted: Ethanol – ยื่น วอ. แล้ว ───────────────────────────────────
  {
    id: 'IMP-68-008931', customsNo: 'A012-25680617-00931', hthmRef: 'HTHM000000006',
    isNew: false, type: 'IMP',
    goods: 'Ethanol 99.5% (Absolute Ethanol) สำหรับอุตสาหกรรม', hs: '2207.10.00',
    customer: 'บริษัท เฮลท์ฟาร์มา จำกัด', contact: '',
    contactEmail: '', origin: 'ยุโรป', importedAt: '07:30 น. วันนี้', owner: 'ปวีณา ส.',
    agency: 'diw', permitNeeded: true, formCode: 'RGoods',
    formName: 'ใบอนุญาตนำเข้าวัตถุอันตราย — วอ.',
    conf: 97, stage: 7, statusKey: 'submitted',
    assess: { conf: 97, reason: 'แอลกอฮอล์เข้มข้นสูง ต้องขออนุญาต วอ.' },
    classify: { agency: 'diw', conf: 97, reason: '', alt: [] },
    draft: { fields: [] },
    flags: [],
    audit: [
      { time: '07:30', text: 'เข้าระบบ', by: 'ระบบ' },
      { time: '07:31', text: 'OCR สำเร็จ', by: 'AI' },
      { time: '07:31', text: 'วิเคราะห์ HS Code: 2207.10.00 → วอ. (97%)', by: 'AI' },
      { time: '07:33', text: 'ยืนยันฟอร์มแล้ว', by: 'ปวีณา ส.' },
      { time: '07:35', text: 'ยื่นกรม วอ. สำเร็จ', by: 'ระบบ' },
    ],
    messages: [
      bot('07:30', 'ใบขนสินค้า HTHM000000006 เข้าระบบแล้วครับ — Ethanol 99.5% จากยุโรป'),
      t('07:31', 'bot', 'hs-analysis', undefined, {
        hsCode: '2207.10.00', goodsName: 'เอทิลแอลกอฮอล์ ความบริสุทธิ์ ≥99%',
        description: 'แอลกอฮอล์เข้มข้นสูง → ต้องขออนุญาตนำเข้าจาก วอ. (กรมโรงงานอุตสาหกรรม)',
        requiresPermit: true, direction: 'import', agency: 'วอ.', agencyFull: 'กรมโรงงานอุตสาหกรรม',
        licenseType: 'ใบอนุญาตวัตถุอันตราย', confidence: 97,
      }),
      t('07:35', 'bot', 'status-card', undefined, {
        refNo: 'RG-2568-31728', customsRef: 'HTHM000000006',
        submittedAt: new Date().toLocaleDateString('th-TH'), isPending: false,
      }),
    ],
    documents: [
      doc('d6a', 'Invoice EU-2024-0730', 'invoice'),
      doc('d6b', 'Certificate of Analysis (CoA)', 'coa'),
      doc('d6c', 'MSDS — Ethanol 99.5%', 'other', 'pdf', 'diw'),
    ],
  },

  // ── 7. needs_you: Vitamin C – รอ agency-upload + OCR ─────────────────────────
  {
    id: 'IMP-68-007010', customsNo: 'A012-25680617-00701', hthmRef: 'HTHM000000007',
    isNew: true, type: 'IMP',
    goods: 'Ascorbic Acid (Vitamin C Powder) วัตถุดิบเสริมอาหาร', hs: '2936.27.00',
    customer: 'บริษัท นูทริเฟรช จำกัด', contact: 'คุณนภา ตันสกุล',
    contactEmail: 'napa@nutrifresh.co.th',
    origin: 'จีน', importedAt: '11:15 น. วันนี้', owner: 'ปวีณา ส.',
    agency: 'fda', permitNeeded: true, formCode: 'RGoods',
    formName: 'คำขออนุญาตนำเข้าวัตถุเสริมอาหาร — อย.',
    conf: 89, stage: 4, statusKey: 'needs_you',
    assess: { conf: 89, reason: 'วิตามิน C วัตถุดิบผลิตภัณฑ์เสริมอาหาร ต้องขออนุญาต อย.' },
    classify: { agency: 'fda', conf: 89, reason: '', alt: [] },
    draft: { fields: [] },
    flags: [],
    audit: [
      { time: '11:15', text: 'เข้าระบบ', by: 'ระบบ' },
      { time: '11:18', text: 'OCR สำเร็จ', by: 'AI' },
      { time: '11:19', text: 'วิเคราะห์ HS Code: 2936.27.00 → อย. (89%)', by: 'AI' },
      { time: '11:19', text: 'รอแนบเอกสารรายกรม', by: 'AI' },
    ],
    messages: [
      bot('11:15', 'ใบขนสินค้า HTHM000000007 เข้าระบบแล้วครับ — Vitamin C Powder 500 กก. จากจีน'),
      t('11:18', 'bot', 'ocr-results', undefined, {
        invoiceNo: 'INV-2024-0701', quantity: '500 กก.', hsCode: '2936.27.00', countryOrigin: 'จีน',
        importer: 'บริษัท นูทริเฟรช จำกัด', port: 'ท่าเรือแหลมฉบัง',
      }),
      t('11:19', 'bot', 'hs-analysis', undefined, {
        hsCode: '2936.27.00', goodsName: 'Ascorbic Acid (Vitamin C)',
        description: 'วิตามิน C รูป Ascorbic Acid วัตถุดิบผลิตภัณฑ์เสริมอาหาร → ต้องขออนุญาตนำเข้าจาก อย.',
        requiresPermit: true, direction: 'import', agency: 'อย.', agencyFull: 'สำนักงานคณะกรรมการอาหารและยา',
        licenseType: 'RGoods', confidence: 89,
      }),
      t('11:20', 'bot', 'agency-upload', undefined, {
        agency: 'fda', agencyLabel: 'อย.',
        slots: [
          { id: 's1', label: 'Certificate of Analysis (COA)', required: true },
          { id: 's2', label: 'ใบรับรองแหล่งกำเนิดสินค้า (COO)', required: true },
          { id: 's3', label: 'Specification Sheet', required: false },
        ],
      }),
    ],
    documents: [
      doc('d7a', 'Invoice INV-2024-0701', 'invoice'),
      doc('d7b', 'Packing List', 'packing_list'),
    ],
  },

  // ── 8. submitted: Zinc Oxide – ยื่น อย. แล้ว ─────────────────────────────────
  {
    id: 'IMP-68-008002', customsNo: 'A012-25680617-00800', hthmRef: 'HTHM000000008',
    isNew: false, type: 'IMP',
    goods: 'Zinc Oxide (วัตถุดิบเครื่องสำอาง)', hs: '2817.00.00',
    customer: 'บริษัท บิวตี้แล็บ จำกัด', contact: 'คุณพิมพ์ชนก ศรีไทย',
    contactEmail: 'pimchanok@beautylab.co.th',
    origin: 'เกาหลีใต้', importedAt: '08:00 น. เมื่อวาน', owner: 'สรวิศ ก.',
    agency: 'fda', permitNeeded: true, formCode: 'RGoods',
    formName: 'คำขออนุญาตนำเข้าวัตถุดิบเครื่องสำอาง — อย.',
    conf: 91, stage: 7, statusKey: 'submitted',
    assess: { conf: 91, reason: 'Zinc Oxide ระดับ Nano ใช้ในเครื่องสำอาง ต้องขออนุญาต อย.' },
    classify: { agency: 'fda', conf: 91, reason: '', alt: [] },
    draft: { fields: [] },
    flags: [],
    audit: [
      { time: '08:00', text: 'เข้าระบบ', by: 'ระบบ' },
      { time: '08:15', text: 'OCR สำเร็จ', by: 'AI' },
      { time: '08:15', text: 'วิเคราะห์ HS Code: 2817.00.00 → อย. (91%)', by: 'AI' },
      { time: '08:25', text: 'ยืนยันฟอร์มแล้ว', by: 'สรวิศ ก.' },
      { time: '08:30', text: 'ยื่นกรม อย. สำเร็จ', by: 'ระบบ' },
    ],
    messages: [
      bot('08:00', 'ใบขนสินค้า HTHM000000008 เข้าระบบแล้วครับ — Zinc Oxide Nano Grade จากเกาหลีใต้'),
      t('08:15', 'bot', 'ocr-results', undefined, {
        invoiceNo: 'KR-2024-0520', quantity: '200 กก.', hsCode: '2817.00.00',
        importer: 'บริษัท บิวตี้แล็บ จำกัด', port: 'ท่าอากาศยานสุวรรณภูมิ', countryOrigin: 'เกาหลีใต้',
      }),
      t('08:30', 'bot', 'status-card', undefined, {
        refNo: 'RG-2568-18820', customsRef: 'KR-2024-0520',
        submittedAt: new Date(Date.now() - 86400000).toLocaleDateString('th-TH'), isPending: false,
      }),
    ],
    documents: [
      doc('d8a', 'Invoice KR-2024-0520', 'invoice'),
      doc('d8b', 'Certificate of Analysis (CoA)', 'coa', 'pdf', 'fda'),
      doc('d8c', 'ใบรับรองแหล่งกำเนิดสินค้า (COO)', 'coo', 'pdf', 'fda'),
    ],
  },

  // ── 9. submitted: Magnesium Stearate – ยื่น อย. แล้ว ─────────────────────────
  {
    id: 'IMP-68-009005', customsNo: 'A012-25680617-00900', hthmRef: 'HTHM000000009',
    isNew: false, type: 'IMP',
    goods: 'Magnesium Stearate (วัตถุดิบยาเม็ด)', hs: '2915.70.21',
    customer: 'บริษัท ฟาร์มาโกลด์ จำกัด', contact: 'คุณธีรพงษ์ บุญมี',
    contactEmail: 'theerapong@pharmagold.co.th',
    origin: 'สหรัฐอเมริกา', importedAt: '14:30 น. เมื่อวาน', owner: 'สรวิศ ก.',
    agency: 'fda', permitNeeded: true, formCode: 'RGoods',
    formName: 'คำขออนุญาตนำเข้าวัตถุดิบยา (RGoods) — อย.',
    conf: 95, stage: 7, statusKey: 'submitted',
    assess: { conf: 95, reason: 'วัตถุดิบใช้ผลิตยาเม็ด ต้องขออนุญาตนำเข้าจาก อย.' },
    classify: { agency: 'fda', conf: 95, reason: '', alt: [] },
    draft: { fields: [] },
    flags: [],
    audit: [
      { time: '14:30', text: 'เข้าระบบ', by: 'ระบบ' },
      { time: '14:32', text: 'OCR สำเร็จ', by: 'AI' },
      { time: '14:33', text: 'วิเคราะห์ HS Code: 2915.70.21 → อย. (95%)', by: 'AI' },
      { time: '14:40', text: 'ยืนยันฟอร์มแล้ว', by: 'สรวิศ ก.' },
      { time: '14:45', text: 'ยื่นกรม อย. สำเร็จ', by: 'ระบบ' },
    ],
    messages: [
      bot('14:30', 'ใบขนสินค้า HTHM000000009 เข้าระบบแล้วครับ — Magnesium Stearate จากสหรัฐอเมริกา'),
      t('14:45', 'bot', 'status-card', undefined, {
        refNo: 'RG-2568-09005', customsRef: 'A012-25680617-00900', isPending: false,
        submittedAt: new Date(Date.now() - 86400000).toLocaleDateString('th-TH'),
      }),
    ],
    documents: [
      doc('d9a', 'Invoice US-2024-1430', 'invoice'),
      doc('d9b', 'Certificate of Analysis (CoA)', 'coa', 'pdf', 'fda'),
    ],
  },

  // ── 10. no_permit: Sodium Chloride – ไม่ต้องขออนุญาต ───────────────────────
  {
    id: 'IMP-68-010001', customsNo: 'A012-25680617-01000', hthmRef: 'HTHM000000010',
    isNew: false, type: 'IMP',
    goods: 'Sodium Chloride (เกลือบริสุทธิ์ระดับอุตสาหกรรม)', hs: '2501.00.10',
    customer: 'บริษัท เคมีไทย จำกัด', contact: 'คุณวิชัย ประสพโชค',
    contactEmail: 'wichai@chemthai.co.th',
    origin: 'ออสเตรเลีย', importedAt: '10:00 น. เมื่อวาน', owner: 'ปวีณา ส.',
    agency: 'none', permitNeeded: false, formCode: '',
    formName: 'ผ่านพิธีการปกติ',
    conf: 98, stage: 2, statusKey: 'no_permit',
    assess: { conf: 98, reason: 'เกลือบริสุทธิ์อุตสาหกรรมไม่อยู่ในข่ายที่ต้องขออนุญาต' },
    classify: { agency: 'none', conf: 98, reason: '', alt: [] },
    draft: { fields: [] },
    flags: [],
    audit: [
      { time: '10:00', text: 'เข้าระบบ', by: 'ระบบ' },
      { time: '10:01', text: 'OCR สำเร็จ', by: 'AI' },
      { time: '10:02', text: 'วิเคราะห์ HS Code: 2501.00.10 → ไม่ต้องขออนุญาต (98%)', by: 'AI' },
    ],
    messages: [
      bot('10:00', 'ใบขนสินค้า HTHM000000010 เข้าระบบแล้วครับ — Sodium Chloride จากออสเตรเลีย'),
      t('10:02', 'bot', 'hs-analysis', undefined, {
        hsCode: '2501.00.10', goodsName: 'เกลือบริสุทธิ์อุตสาหกรรม',
        description: 'เกลือบริสุทธิ์ระดับอุตสาหกรรม ไม่อยู่ในบัญชีสินค้าควบคุม ผ่านพิธีการปกติได้เลยครับ',
        requiresPermit: false, direction: 'import', agency: 'none', agencyFull: '—', confidence: 98,
      }),
      bot('10:02', 'HS Code 2501.00.10 — ไม่ต้องขออนุญาตนำเข้า ความมั่นใจ 98% ครับ'),
    ],
  },

  // ── 11. needs_you: Calcium Carbonate – รอ OCR + hs-analysis ──────────────────
  {
    id: 'IMP-68-011003', customsNo: 'A012-25680617-01100', hthmRef: 'HTHM000000011',
    isNew: true, type: 'IMP',
    goods: 'Calcium Carbonate (วัตถุดิบยาเม็ดแคลเซียม)', hs: '2836.50.00',
    customer: 'บริษัท เฮลท์ฟาร์มา จำกัด', contact: 'คุณสมหญิง วัฒนกุล',
    contactEmail: 'somying@healthpharma.co.th',
    origin: 'มาเลเซีย', importedAt: '13:20 น. วันนี้', owner: 'ปวีณา ส.',
    agency: 'fda', permitNeeded: true, formCode: 'RGoods',
    formName: 'คำขออนุญาตนำเข้าวัตถุดิบยา — อย.',
    conf: 93, stage: 3, statusKey: 'needs_you',
    assess: { conf: 93, reason: 'Calcium Carbonate เกรด Pharmaceutical ต้องขออนุญาต อย.' },
    classify: { agency: 'fda', conf: 93, reason: '', alt: [] },
    draft: { fields: [] },
    flags: [],
    audit: [
      { time: '13:20', text: 'เข้าระบบ', by: 'ระบบ' },
      { time: '13:22', text: 'OCR สำเร็จ', by: 'AI' },
      { time: '13:22', text: 'วิเคราะห์ HS Code: 2836.50.00 → อย. (93%)', by: 'AI' },
      { time: '13:22', text: 'รอเลือกกรมและยืนยันโปรไฟล์', by: 'AI' },
    ],
    messages: [
      bot('13:20', 'ใบขนสินค้า HTHM000000011 เข้าระบบแล้วครับ — Calcium Carbonate จากมาเลเซีย'),
      t('13:22', 'bot', 'ocr-results', undefined, {
        invoiceNo: 'MY-2024-1320', invoiceDate: '12/06/2568', quantity: '1,000 กก.',
        importer: 'บริษัท เฮลท์ฟาร์มา จำกัด', port: 'ท่าเรือแหลมฉบัง',
        hsCode: '2836.50.00', countryOrigin: 'มาเลเซีย', lotNo: 'CaCO3-MY-0612', uNo: '',
      }),
      t('13:22', 'bot', 'hs-analysis', undefined, {
        hsCode: '2836.50.00', goodsName: 'Calcium Carbonate เกรด Pharmaceutical',
        description: 'แคลเซียมคาร์บอเนตเกรดยา → ต้องขออนุญาตนำเข้าจาก อย.',
        requiresPermit: true, direction: 'import', agency: 'อย.', agencyFull: 'สำนักงานคณะกรรมการอาหารและยา',
        licenseType: 'RGoods', confidence: 93,
      }),
    ],
    documents: [
      doc('d11a', 'Invoice MY-2024-1320', 'invoice'),
      doc('d11b', 'Packing List', 'packing_list'),
    ],
  },

  // ── 12. needs_you: Titanium Dioxide – รอยืนยัน form-preview ─────────────────
  {
    id: 'IMP-68-012007', customsNo: 'A012-25680617-01200', hthmRef: 'HTHM000000012',
    isNew: false, type: 'IMP',
    goods: 'Titanium Dioxide (สี/วัตถุดิบเครื่องสำอาง)', hs: '3206.11.00',
    customer: 'บริษัท คัลเลอร์แพ็ค จำกัด', contact: 'คุณนิรมล สุขสม',
    contactEmail: 'niramol@colorpack.co.th',
    origin: 'เยอรมนี', importedAt: '09:00 น. เมื่อวาน', owner: 'สรวิศ ก.',
    agency: 'fda', permitNeeded: true, formCode: 'RGoods',
    formName: 'คำขออนุญาตนำเข้าวัตถุดิบเครื่องสำอาง — อย.',
    conf: 87, stage: 6, statusKey: 'needs_you',
    assess: { conf: 87, reason: 'Titanium Dioxide ใช้เป็นสีในเครื่องสำอาง ต้องขออนุญาต อย.' },
    classify: { agency: 'fda', conf: 87, reason: '', alt: [] },
    draft: { fields: [] },
    flags: [
      { id: 'f5', title: 'ชื่อสินค้าไม่ตรง', detail: 'Invoice ระบุ "TiO2 Anatase" แต่ COA ระบุ "Titanium Dioxide Rutile"', conf: 74, resolved: true },
    ],
    audit: [
      { time: '09:00', text: 'เข้าระบบ', by: 'ระบบ' },
      { time: '09:20', text: 'OCR สำเร็จ', by: 'AI' },
      { time: '09:30', text: 'วิเคราะห์ HS Code: 3206.11.00 → อย. (87%)', by: 'AI' },
      { time: '09:40', text: 'ยืนยัน flag แล้ว', by: 'สรวิศ ก.' },
    ],
    messages: [
      bot('09:00', 'ใบขนสินค้า HTHM000000012 เข้าระบบแล้วครับ — Titanium Dioxide จากเยอรมนี'),
      t('09:20', 'bot', 'ocr-results', undefined, {
        invoiceNo: 'DE-2024-0820', invoiceDate: '30/05/2568', quantity: '300 กก.',
        importer: 'บริษัท คัลเลอร์แพ็ค จำกัด', port: 'ท่าเรือแหลมฉบัง',
        hsCode: '3206.11.00', countryOrigin: 'เยอรมนี', lotNo: 'TiO2-DE-0530', uNo: '',
      }),
      t('09:30', 'bot', 'hs-analysis', undefined, {
        hsCode: '3206.11.00', goodsName: 'Titanium Dioxide (สีสำหรับเครื่องสำอาง)',
        description: 'Titanium Dioxide ใช้เป็นสีในเครื่องสำอาง → ต้องขออนุญาตนำเข้าจาก อย.',
        requiresPermit: true, direction: 'import', agency: 'อย.', agencyFull: 'สำนักงานคณะกรรมการอาหารและยา',
        licenseType: 'RGoods', confidence: 87,
      }),
      t('09:35', 'bot', 'flag-card', undefined, {
        gen: 1, flags: [
          { id: 'f5', title: 'ชื่อสินค้าไม่ตรง', detail: 'Invoice ระบุ "TiO2 Anatase" แต่ COA ระบุ "Titanium Dioxide Rutile"', conf: 74, resolved: true },
        ],
      }),
      t('09:42', 'bot', 'form-preview', undefined, {
        invoiceNo: 'DE-2024-0820', quantity: '300 กก.',
        importer: 'บริษัท คัลเลอร์แพ็ค จำกัด', port: 'ท่าเรือแหลมฉบัง',
        hsCode: '3206.11.00', countryOrigin: 'เยอรมนี', goodsDesc: 'Titanium Dioxide สำหรับเครื่องสำอาง',
      }),
    ],
    documents: [
      doc('d12a', 'Invoice DE-2024-0820', 'invoice'),
      doc('d12b', 'Certificate of Analysis (CoA)', 'coa', 'pdf', 'fda'),
      doc('d12c', 'ใบรับรองแหล่งกำเนิดสินค้า (COO)', 'coo', 'pdf', 'fda'),
    ],
  },
];
