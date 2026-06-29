import { Shipment, ShipmentStatus, AgencyKey, ChatMessage } from '@app/core/models/types';

export const AGENCY_LABEL: Record<AgencyKey, string> = {
  dld: 'กรมปศุสัตว์', fda: 'อย.', dft: 'กรมการค้าต่างประเทศ',
  doa: 'กษ.', diw: 'วอ.', none: 'ไม่ระบุ',
};
export const AGENCY_SHORT: Record<AgencyKey, string> = {
  dld: 'ปศ.', fda: 'อย.', dft: 'กค.', doa: 'กษ.', diw: 'วอ.', none: '—',
};

export const STATUS_META: Record<ShipmentStatus, { label: string; bg: string; text: string; dot: string }> = {
  needs_you:      { label: 'รอคุณยืนยัน',         bg: '#FFFBEB', text: '#B45309', dot: '#F59E0B' },
  no_permit:      { label: 'ไม่ต้องขอใบอนุญาต',   bg: '#F3F4F6', text: '#6B7280', dot: '#9CA3AF' },
  email_outbox:   { label: 'ร่างอีเมลรอส่ง',      bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6' },
  await_customer: { label: 'รอลูกค้ายืนยัน',      bg: '#F5F3FF', text: '#6D28D9', dot: '#7C3AED' },
  submitted:      { label: 'ยื่นแล้ว',              bg: '#ECFDF5', text: '#065F46', dot: '#10B981' },
};

const t = (time: string, role: 'bot'|'user', type: ChatMessage['type'], content?: string, data?: unknown): ChatMessage => ({
  id: `mock_${Math.random().toString(36).slice(2)}`,
  role, type, content, data, time, isReadOnly: true,
} as ChatMessage);

const bot = (time: string, content: string): ChatMessage => t(time, 'bot', 'text', content);
const usr = (time: string, content: string): ChatMessage => t(time, 'user', 'text', content);

export const MOCK_QUEUE: Shipment[] = [
  // ── 1. needs_you: Amoxicillin – ค้างที่ form-preview รอยืนยัน ─────────────
  {
    id: 'IMP-68-008912', customsNo: 'A012-25680617-00891', hthmRef: 'HTHM000000001',
    isNew: true, type: 'IMP',
    goods: 'Amoxicillin Trihydrate (วัตถุดิบยาปฏิชีวนะ)', hs: '2941.10.00',
    customer: 'บริษัท เฮลท์ฟาร์มา จำกัด', contact: 'คุณสมหญิง วัฒนกุล',
    contactEmail: 'somying@healthpharma.co.th',
    origin: 'อินเดีย', importedAt: '09:42 น. วันนี้', owner: 'ปวีณา ส.',
    agency: 'fda', permitNeeded: true, formCode: 'RGoods',
    formName: 'คำขออนุญาตนำเข้าวัตถุดิบยา (RGoods) — อย.',
    conf: 96, stage: 4, statusKey: 'needs_you',
    assess: { conf: 96, reason: 'ตรงตามเงื่อนไขการนำเข้า' },
    classify: { agency: 'fda', conf: 96, reason: '', alt: [] },
    draft: { fields: [] }, flags: [
      { id: 'f1', title: 'ปริมาณไม่ตรง', detail: 'Invoice: 250 กก. / Packing List: 248.5 กก.', conf: 72, resolved: false },
      { id: 'f2', title: 'เลข GMP อ่านไม่ชัด', detail: '3 ตัวท้ายไม่ชัดเจน', conf: 65, resolved: false },
    ],
    audit: [{ time: '09:42', text: 'เข้าระบบ', by: 'ระบบ' }],
    email: { toName: '', to: '', subject: '', body: '', attName: '' },
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
      bot('09:44', 'ร่างคำขออนุญาต RGoods อัตโนมัติเสร็จแล้ว — พบ 2 จุดที่ควรตรวจสอบก่อนส่งกรมครับ'),
      t('09:44', 'bot', 'flag-card', undefined, {
        gen: 1, flags: [
          { id: 'f1', title: 'ปริมาณไม่ตรง', detail: 'Invoice ระบุ 250 กก. แต่ Packing List ระบุ 248.5 กก.', conf: 72, resolved: false },
          { id: 'f2', title: 'เลข GMP อ่านไม่ชัด', detail: '3 ตัวท้ายของเลข GMP ไม่ชัดเจน — AI มั่นใจ 65%', conf: 65, resolved: false },
        ],
      }),
      bot('09:45', 'กรุณาตรวจสอบและยืนยันข้อมูลก่อนส่งกรมครับ'),
      t('09:45', 'bot', 'form-preview', undefined, {
        fields: [
          { label: 'ผู้นำเข้า', value: 'บริษัท เฮลท์ฟาร์มา จำกัด' },
          { label: 'HS Code', value: '2941.10.00' },
          { label: 'สินค้า', value: 'Amoxicillin Trihydrate' },
          { label: 'ปริมาณ', value: '250 กก.', flag: 'ไม่ตรงกับ Packing List' },
          { label: 'ประเทศต้นกำเนิด', value: 'อินเดีย' },
          { label: 'ท่านำเข้า', value: 'ท่าเรือแหลมฉบัง' },
        ],
      }),
    ],
  },

  // ── 2. needs_you: Human Insulin – ค้างที่ form-preview ──────────────────────
  {
    id: 'IMP-68-008915', customsNo: 'A012-25680617-00915', hthmRef: 'HTHM000000002',
    isNew: true, type: 'IMP',
    goods: 'Human Insulin (มาตรฐานอินซูลิน สำเร็จรูป)', hs: '2941.10.00',
    customer: 'บริษัท เฮลท์ฟาร์มา จำกัด', contact: 'คุณสมหญิง วัฒนกุล',
    contactEmail: 'somying@healthpharma.co.th',
    origin: 'เยอรมนี', importedAt: '09:31 น. วันนี้', owner: 'ปวีณา ส.',
    agency: 'fda', permitNeeded: true, formCode: 'RGoods',
    formName: 'คำขออนุญาตนำเข้าวัตถุดิบยา (RGoods) — อย.',
    conf: 91, stage: 4, statusKey: 'needs_you',
    assess: { conf: 91, reason: 'ตรงตามเงื่อนไขการนำเข้า' },
    classify: { agency: 'fda', conf: 91, reason: '', alt: [] },
    draft: { fields: [] }, flags: [
      { id: 'f3', title: 'วันหมดอายุต่างกัน', detail: 'CoA vs Label ต่างกัน 1 วัน', conf: 78, resolved: false },
    ],
    audit: [{ time: '09:31', text: 'เข้าระบบ', by: 'ระบบ' }],
    email: { toName: '', to: '', subject: '', body: '', attName: '' },
    messages: [
      bot('09:31', 'ใบขนสินค้า HTHM000000002 เข้าระบบแล้วครับ — Human Insulin 100 ไวอัล จากเยอรมนี'),
      t('09:31', 'bot', 'ocr-results', undefined, {
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
          { id: 'f3', title: 'วันหมดอายุต่างกัน', detail: 'ใบ CoA ระบุ Exp. 12/2025 แต่ Label ระบุ 11/2025', conf: 78, resolved: false },
        ],
      }),
      t('09:33', 'bot', 'form-preview', undefined, {
        fields: [
          { label: 'ผู้นำเข้า', value: 'บริษัท เฮลท์ฟาร์มา จำกัด' },
          { label: 'HS Code', value: '2941.10.00' },
          { label: 'สินค้า', value: 'Human Insulin 100IU/mL' },
          { label: 'ปริมาณ', value: '100 ไวอัล' },
          { label: 'วันหมดอายุ (CoA)', value: '12/2025', flag: 'ไม่ตรงกับ Label (11/2025)' },
        ],
      }),
    ],
  },

  // ── 3. needs_you: Surgical Gloves – รอยืนยัน form-preview ───────────────────
  {
    id: 'IMP-68-008920', customsNo: 'A012-25680617-00920', hthmRef: 'HTHM000000003',
    isNew: false, type: 'IMP',
    goods: 'Surgical Gloves (ถุงมือผ่าตัด ชนิดปราศจากเชื้อ)', hs: '4015.11.00',
    customer: 'บริษัท เฮลท์ฟาร์มา จำกัด', contact: 'คุณสมหญิง วัฒนกุล',
    contactEmail: 'somying@healthpharma.co.th',
    origin: 'มาเลเซีย', importedAt: '08:55 น. วันนี้', owner: 'ปวีณา ส.',
    agency: 'fda', permitNeeded: true, formCode: 'RGoods',
    formName: 'คำขออนุญาตนำเข้าเครื่องมือแพทย์ — อย.',
    conf: 88, stage: 4, statusKey: 'needs_you',
    assess: { conf: 88, reason: 'ต้องใช้ใบอนุญาตเครื่องมือแพทย์' },
    classify: { agency: 'fda', conf: 88, reason: '', alt: [] },
    draft: { fields: [] }, flags: [
      { id: 'f4', title: 'เลข Lot ไม่ครบ', detail: 'ตัวเลขท้ายอ่านไม่ออก — กรุณาตรวจสอบ', conf: 80, resolved: false },
    ],
    audit: [{ time: '08:55', text: 'เข้าระบบ', by: 'ระบบ' }],
    email: { toName: '', to: '', subject: '', body: '', attName: '' },
    messages: [
      bot('08:55', 'ใบขนสินค้า HTHM000000003 เข้าระบบแล้วครับ — Surgical Gloves จากมาเลเซีย'),
      t('08:56', 'bot', 'ocr-results', undefined, {
        invoiceNo: 'MY-2024-0312', invoiceDate: '01/06/2568', quantity: '5,000 ชิ้น',
        importer: 'บริษัท เฮลท์ฟาร์มา จำกัด', port: 'ท่าเรือแหลมฉบัง',
        hsCode: '4015.11.00', countryOrigin: 'มาเลเซีย', lotNo: 'GLV-MY-312', uNo: '',
      }),
      t('08:57', 'bot', 'flag-card', undefined, {
        gen: 1, flags: [
          { id: 'f4', title: 'เลข Lot ไม่ครบ', detail: 'ตัวเลขท้าย Lot ไม่ชัดเจน — AI มั่นใจ 80%', conf: 80, resolved: false },
        ],
      }),
      t('08:58', 'bot', 'form-preview', undefined, {
        invoiceNo: 'MY-2024-0312', quantity: '5,000 ชิ้น',
        importer: 'บริษัท เฮลท์ฟาร์มา จำกัด', port: 'ท่าเรือแหลมฉบัง',
        hsCode: '4015.11.00', countryOrigin: 'มาเลเซีย', goodsDesc: 'ถุงมือผ่าตัดปราศจากเชื้อ',
      }),
    ],
  },

  // ── 4. submitted: Glyphosate – ยื่นกรมแล้ว ──────────────────────────────────
  {
    id: 'IMP-68-008923', customsNo: 'A012-25680617-00923', hthmRef: 'HTHM000000004',
    isNew: false, type: 'IMP',
    goods: 'Glyphosate Technical (สารกำจัดวัชพืช วัตถุอันตราย)', hs: '2931.39.00',
    customer: 'บริษัท อะกริพลัส จำกัด', contact: 'คุณมานะ รุ่งเรือง',
    contactEmail: 'mana@agriplus.co.th',
    origin: 'จีน', importedAt: '08:10 น. วันนี้', owner: 'ปวีณา ส.',
    agency: 'doa', permitNeeded: true, formCode: 'RGoods',
    formName: 'ใบอนุญาตนำเข้าวัตถุอันตราย — กษ.',
    conf: 82, stage: 8, statusKey: 'submitted',
    assess: { conf: 82, reason: 'วัตถุอันตรายประเภท 3 ต้องขออนุญาต' },
    classify: { agency: 'doa', conf: 82, reason: '', alt: [] },
    draft: { fields: [] }, flags: [],
    audit: [
      { time: '08:10', text: 'เข้าระบบ', by: 'ระบบ' },
      { time: '08:45', text: 'ยื่นกรมสำเร็จ', by: 'ระบบ' },
    ],
    email: { toName: '', to: '', subject: '', body: '', attName: '' },
    messages: [
      bot('08:10', 'ใบขนสินค้า HTHM000000004 เข้าระบบแล้วครับ — Glyphosate Technical จากจีน'),
      t('08:20', 'bot', 'ocr-results', undefined, {
        invoiceNo: 'CN-2024-0601', quantity: '1,000 ลิตร', hsCode: '2931.39.00', countryOrigin: 'จีน',
        importer: 'บริษัท อะกริพลัส จำกัด', port: 'ท่าเรือแหลมฉบัง',
      }),
      t('08:45', 'bot', 'status-card', undefined, {
        refNo: 'RG-2568-20188', customsRef: 'CN-2024-0601',
        submittedAt: new Date().toLocaleDateString('th-TH'), isPending: false,
      }),
    ],
  },

  // ── 5. no_permit: HPLC Column – ไม่ต้องขอใบอนุญาต ─────────────────────────
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
    draft: { fields: [] }, flags: [],
    audit: [{ time: '08:02', text: 'เข้าระบบ', by: 'ระบบ' }],
    email: { toName: '', to: '', subject: '', body: '', attName: '' },
    messages: [
      bot('08:02', 'ใบขนสินค้า HTHM000000005 เข้าระบบแล้วครับ — HPLC Column จากสหรัฐอเมริกา'),
      t('08:02', 'bot', 'hs-analysis', undefined, {
        hsCode: '9027.90.90', goodsName: 'ส่วนประกอบเครื่องมือวิเคราะห์',
        description: 'อุปกรณ์ห้องปฏิบัติการ — ไม่อยู่ในบัญชีสินค้าควบคุม ผ่านพิธีการปกติได้เลยครับ',
        requiresPermit: false, direction: 'import', agency: 'none', agencyFull: '—',
        confidence: 94,
      }),
      bot('08:03', 'HS Code 9027.90.90 — ไม่ต้องขออนุญาตนำเข้า ความมั่นใจ 94% ครับ ผ่านพิธีการศุลกากรปกติได้เลย'),
    ],
  },

  // ── 6. submitted: Ethanol – ยื่นแล้ว ────────────────────────────────────────
  {
    id: 'IMP-68-008931', customsNo: 'A012-25680617-00931', hthmRef: 'HTHM000000006',
    isNew: false, type: 'IMP',
    goods: 'Ethanol 99.5% (Absolute Ethanol) สำหรับอุตสาหกรรม', hs: '2207.10.00',
    customer: 'บริษัท เฮลท์ฟาร์มา จำกัด', contact: '',
    contactEmail: '', origin: 'ยุโรป', importedAt: '07:30 น. วันนี้', owner: 'ปวีณา ส.',
    agency: 'diw', permitNeeded: true, formCode: 'RGoods',
    formName: 'ใบอนุญาตนำเข้าวัตถุอันตราย — วอ.',
    conf: 97, stage: 8, statusKey: 'submitted',
    assess: { conf: 97, reason: 'แอลกอฮอล์เข้มข้นสูง ต้องขออนุญาต วอ.' },
    classify: { agency: 'diw', conf: 97, reason: '', alt: [] },
    draft: { fields: [] }, flags: [],
    audit: [{ time: '07:30', text: 'เข้าระบบ', by: 'ระบบ' }, { time: '07:35', text: 'ยื่นกรมเรียบร้อย', by: 'ระบบ' }],
    email: { toName: '', to: '', subject: '', body: '', attName: '' },
    messages: [
      bot('07:30', 'ใบขนสินค้า HTHM000000006 เข้าระบบแล้วครับ — Ethanol 99.5% จากยุโรป'),
      t('07:31', 'bot', 'hs-analysis', undefined, {
        hsCode: '2207.10.00', goodsName: 'เอทิลแอลกอฮอล์ ความบริสุทธิ์ ≥99%',
        description: 'แอลกอฮอล์เข้มข้นสูง → ต้องขออนุญาตนำเข้าจาก วอ. (กรมโรงงานอุตสาหกรรม)',
        requiresPermit: true, direction: 'import', agency: 'วอ.', agencyFull: 'กรมโรงงานอุตสาหกรรม',
        licenseType: 'ใบอนุญาตวัตถุอันตราย', confidence: 97,
      }),
      t('07:32', 'bot', 'status-card', undefined, {
        refNo: 'RG-2568-31728', customsRef: 'HTHM000000006',
        submittedAt: new Date().toLocaleDateString('th-TH'),
        isPending: false,
      }),
    ],
  },
  // ── 7. needs_you: Vitamin C – รอยืนยันฟอร์ม ───────────────────────────────
  {
    id: 'IMP-68-007010', customsNo: 'A012-25680617-00701', hthmRef: 'HTHM000000007',
    isNew: true, type: 'IMP',
    goods: 'Ascorbic Acid (Vitamin C Powder) วัตถุดิบเสริมอาหาร', hs: '2936.27.00',
    customer: 'บริษัท นูทริเฟรช จำกัด', contact: 'คุณนภา ตันสกุล',
    contactEmail: 'napa@nutrifresh.co.th',
    origin: 'จีน', importedAt: '11:15 น. วันนี้', owner: 'ปวีณา ส.',
    agency: 'fda', permitNeeded: true, formCode: 'RGoods',
    formName: 'คำขออนุญาตนำเข้าวัตถุเสริมอาหาร — อย.',
    conf: 89, stage: 3, statusKey: 'needs_you',
    assess: { conf: 89, reason: 'วิตามิน C ในรูป Ascorbic Acid ที่ใช้เป็นวัตถุดิบผลิตภัณฑ์เสริมอาหาร ต้องขออนุญาต อย.' },
    classify: { agency: 'fda', conf: 89, reason: '', alt: [] },
    draft: { fields: [] }, flags: [
      { id: 'f1', title: 'COA ไม่ครบ', detail: 'Certificate of Analysis ขาด Heavy Metal Test', conf: 70, resolved: false },
    ],
    audit: [
      { time: '11:15', text: 'เข้าระบบ', by: 'ระบบ' },
      { time: '11:18', text: 'OCR อ่านเอกสารสำเร็จ', by: 'AI' },
    ],
    email: { toName: '', to: '', subject: '', body: '', attName: '' },
    messages: [
      bot('11:15', 'ใบขนสินค้า HTHM000000007 เข้าระบบแล้ว — Vitamin C Powder 500 กก. จากจีน'),
      t('11:18', 'bot', 'ocr-results', undefined, {
        invoiceNo: 'INV-2024-0701', quantity: '500 กก.', hsCode: '2936.27.00', countryOrigin: 'จีน',
      }),
      t('11:19', 'bot', 'hs-analysis', undefined, {
        hsCode: '2936.27.00', goodsName: 'Ascorbic Acid (Vitamin C)',
        requiresPermit: true, agency: 'อย.', licenseType: 'RGoods', confidence: 89,
      }),
    ],
  },
  // ── 8. submitted: Zinc Oxide – ยื่นกรมแล้ว ───────────────────────────────────
  {
    id: 'IMP-68-008002', customsNo: 'A012-25680617-00800', hthmRef: 'HTHM000000008',
    isNew: false, type: 'IMP',
    goods: 'Zinc Oxide (วัตถุดิบเครื่องสำอาง)', hs: '2817.00.00',
    customer: 'บริษัท บิวตี้แล็บ จำกัด', contact: 'คุณพิมพ์ชนก ศรีไทย',
    contactEmail: 'pimchanok@beautylab.co.th',
    origin: 'เกาหลีใต้', importedAt: '08:00 น. เมื่อวาน', owner: 'สรวิศ ก.',
    agency: 'fda', permitNeeded: true, formCode: 'RGoods',
    formName: 'คำขออนุญาตนำเข้าวัตถุดิบเครื่องสำอาง — อย.',
    conf: 91, stage: 8, statusKey: 'submitted',
    assess: { conf: 91, reason: 'Zinc Oxide ระดับ Nano ใช้ในเครื่องสำอาง ต้องขออนุญาต อย.' },
    classify: { agency: 'fda', conf: 91, reason: '', alt: [] },
    draft: { fields: [] }, flags: [],
    audit: [
      { time: '08:00', text: 'เข้าระบบ', by: 'ระบบ' },
      { time: '08:30', text: 'ยื่นกรมสำเร็จ', by: 'ระบบ' },
    ],
    email: { toName: '', to: '', subject: '', body: '', attName: '' },
    messages: [
      bot('08:00', 'ใบขนสินค้า Zinc Oxide เข้าระบบแล้ว — Zinc Oxide Nano Grade จากเกาหลีใต้'),
      t('08:15', 'bot', 'ocr-results', undefined, {
        invoiceNo: 'KR-2024-0520', quantity: '200 กก.', hsCode: '2817.00.00',
        importer: 'บริษัท บิวตี้แล็บ จำกัด', port: 'ท่าอากาศยานสุวรรณภูมิ', countryOrigin: 'เกาหลีใต้',
      }),
      t('08:30', 'bot', 'status-card', undefined, {
        refNo: 'RG-2568-18820', customsRef: 'KR-2024-0520',
        submittedAt: new Date(Date.now() - 86400000).toLocaleDateString('th-TH'), isPending: false,
      }),
    ],
  },
  // ── 9. submitted: Magnesium Stearate ──────────────────────────────────────
  {
    id: 'IMP-68-009005', customsNo: 'A012-25680617-00900', hthmRef: 'HTHM000000009',
    isNew: false, type: 'IMP',
    goods: 'Magnesium Stearate (วัตถุดิบยาเม็ด)', hs: '2915.70.21',
    customer: 'บริษัท ฟาร์มาโกลด์ จำกัด', contact: 'คุณธีรพงษ์ บุญมี',
    contactEmail: 'theerapong@pharmagold.co.th',
    origin: 'สหรัฐอเมริกา', importedAt: '14:30 น. เมื่อวาน', owner: 'สรวิศ ก.',
    agency: 'fda', permitNeeded: true, formCode: 'RGoods',
    formName: 'คำขออนุญาตนำเข้าวัตถุดิบยา (RGoods) — อย.',
    conf: 95, stage: 8, statusKey: 'submitted',
    assess: { conf: 95, reason: 'วัตถุดิบที่ใช้ในการผลิตยาเม็ด ต้องขออนุญาตนำเข้าจาก อย.' },
    classify: { agency: 'fda', conf: 95, reason: '', alt: [] },
    draft: { fields: [] }, flags: [],
    audit: [
      { time: '14:30', text: 'เข้าระบบ', by: 'ระบบ' },
      { time: '14:45', text: 'ยื่นกรมสำเร็จ', by: 'ระบบ' },
    ],
    email: { toName: '', to: '', subject: '', body: '', attName: '' },
    messages: [
      bot('14:30', 'ใบขนสินค้า Magnesium Stearate เข้าระบบแล้ว'),
      t('14:45', 'bot', 'status-card', undefined, { refNo: 'A012-25680617-00900', isPending: false }),
    ],
  },
  // ── 10. no_permit: Sodium Chloride ────────────────────────────────────────
  {
    id: 'IMP-68-010001', customsNo: 'A012-25680617-01000', hthmRef: 'HTHM000000010',
    isNew: false, type: 'IMP',
    goods: 'Sodium Chloride (เกลือบริสุทธิ์ระดับอุตสาหกรรม)', hs: '2501.00.10',
    customer: 'บริษัท เคมีไทย จำกัด', contact: 'คุณวิชัย ประสพโชค',
    contactEmail: 'wichai@chemthai.co.th',
    origin: 'ออสเตรเลีย', importedAt: '10:00 น. เมื่อวาน', owner: 'ปวีณา ส.',
    agency: 'none', permitNeeded: false, formCode: '',
    formName: 'ผ่านพิธีการปกติ',
    conf: 98, stage: 8, statusKey: 'no_permit',
    assess: { conf: 98, reason: 'เกลือบริสุทธิ์ระดับอุตสาหกรรมไม่อยู่ในข่ายที่ต้องขออนุญาตนำเข้า' },
    classify: { agency: 'none', conf: 98, reason: '', alt: [] },
    draft: { fields: [] }, flags: [],
    audit: [
      { time: '10:00', text: 'เข้าระบบ', by: 'ระบบ' },
      { time: '10:02', text: 'ตรวจสอบแล้ว — ไม่ต้องขอใบอนุญาต', by: 'AI' },
    ],
    email: { toName: '', to: '', subject: '', body: '', attName: '' },
    messages: [
      bot('10:00', 'ใบขนสินค้า Sodium Chloride เข้าระบบแล้ว — ไม่ต้องขอใบอนุญาต'),
    ],
  },
  // ── 11. needs_you: Calcium Carbonate ─────────────────────────────────────
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
    draft: { fields: [] }, flags: [],
    audit: [{ time: '13:20', text: 'เข้าระบบ', by: 'ระบบ' }],
    email: { toName: '', to: '', subject: '', body: '', attName: '' },
    messages: [
      bot('13:20', 'ใบขนสินค้า Calcium Carbonate เข้าระบบแล้ว'),
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
    conf: 87, stage: 4, statusKey: 'needs_you',
    assess: { conf: 87, reason: 'Titanium Dioxide ใช้เป็นสีในเครื่องสำอาง ต้องขออนุญาต อย.' },
    classify: { agency: 'fda', conf: 87, reason: '', alt: [] },
    draft: { fields: [] }, flags: [],
    audit: [
      { time: '09:00', text: 'เข้าระบบ', by: 'ระบบ' },
      { time: '09:30', text: 'OCR และวิเคราะห์สำเร็จ', by: 'AI' },
    ],
    email: { toName: '', to: '', subject: '', body: '', attName: '' },
    messages: [
      bot('09:00', 'ใบขนสินค้า HTHM000000012 เข้าระบบแล้ว — Titanium Dioxide จากเยอรมนี'),
      t('09:20', 'bot', 'ocr-results', undefined, {
        invoiceNo: 'DE-2024-0820', invoiceDate: '30/05/2568', quantity: '300 กก.',
        importer: 'บริษัท คัลเลอร์แพ็ค จำกัด', port: 'ท่าเรือแหลมฉบัง',
        hsCode: '3206.11.00', countryOrigin: 'เยอรมนี', lotNo: 'TiO2-DE-0530', uNo: '',
      }),
      t('09:30', 'bot', 'form-preview', undefined, {
        invoiceNo: 'DE-2024-0820', quantity: '300 กก.',
        importer: 'บริษัท คัลเลอร์แพ็ค จำกัด', port: 'ท่าเรือแหลมฉบัง',
        hsCode: '3206.11.00', countryOrigin: 'เยอรมนี', goodsDesc: 'Titanium Dioxide สำหรับเครื่องสำอาง',
      }),
    ],
  },
];
