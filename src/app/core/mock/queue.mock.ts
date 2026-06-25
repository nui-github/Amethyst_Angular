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
    email: { toName: 'คุณสมหญิง วัฒนกุล', to: 'somying@healthpharma.co.th',
      subject: 'ขอเอกสารประกอบ', body: '', attName: 'draft_license.pdf' },
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

  // ── 3. email_outbox: Surgical Gloves – รอส่งอีเมล ──────────────────────────
  {
    id: 'IMP-68-008920', customsNo: 'A012-25680617-00920', hthmRef: 'HTHM000000003',
    isNew: false, type: 'IMP',
    goods: 'Surgical Gloves (ถุงมือผ่าตัด ชนิดปราศจากเชื้อ)', hs: '4015.11.00',
    customer: 'บริษัท เฮลท์ฟาร์มา จำกัด', contact: 'คุณสมหญิง วัฒนกุล',
    contactEmail: 'somying@healthpharma.co.th',
    origin: 'มาเลเซีย', importedAt: '08:55 น. วันนี้', owner: 'ปวีณา ส.',
    agency: 'fda', permitNeeded: true, formCode: 'RGoods',
    formName: 'คำขออนุญาตนำเข้าเครื่องมือแพทย์ — อย.',
    conf: 88, stage: 6, statusKey: 'email_outbox',
    assess: { conf: 88, reason: 'ต้องใช้ใบอนุญาตเครื่องมือแพทย์' },
    classify: { agency: 'fda', conf: 88, reason: '', alt: [] },
    draft: { fields: [] }, flags: [
      { id: 'f4', title: 'เลข Lot ไม่ครบ', detail: 'แก้ไขแล้ว', conf: 95, resolved: true },
    ],
    audit: [{ time: '08:55', text: 'เข้าระบบ', by: 'ระบบ' }],
    email: { toName: 'คุณสมหญิง วัฒนกุล', to: 'somying@healthpharma.co.th',
      subject: 'ขอเอกสารเพิ่มเติม — ถุงมือผ่าตัด', body: 'เรียน คุณสมหญิง\n\nกรุณาส่งใบรับรองมาตรฐาน ISO 13485 เพิ่มเติมครับ',
      attName: 'request_docs.pdf' },
    messages: [
      bot('08:55', 'ใบขนสินค้า HTHM000000003 เข้าระบบแล้วครับ — Surgical Gloves จากมาเลเซีย'),
      t('08:56', 'bot', 'email-draft', undefined, {
        gen: 1, to: 'somying@healthpharma.co.th',
        subject: 'ขอเอกสารเพิ่มเติม — ถุงมือผ่าตัด',
        body: 'เรียน คุณสมหญิง\n\nกรุณาส่งใบรับรองมาตรฐาน ISO 13485 เพิ่มเติมครับ',
        isSent: false,
      }),
      bot('08:57', 'ร่างอีเมลพร้อมแล้วครับ — กรุณายืนยันก่อนส่งลูกค้า'),
    ],
  },

  // ── 4. await_customer: Glyphosate – รอลูกค้ายืนยัน ─────────────────────────
  {
    id: 'IMP-68-008923', customsNo: 'A012-25680617-00923', hthmRef: 'HTHM000000004',
    isNew: false, type: 'IMP',
    goods: 'Glyphosate Technical (สารกำจัดวัชพืช วัตถุอันตราย)', hs: '2931.39.00',
    customer: 'บริษัท เฮลท์ฟาร์มา จำกัด', contact: 'คุณมานะ รุ่งเรือง',
    contactEmail: 'mana@agriplus.co.th',
    origin: 'จีน', importedAt: '08:10 น. วันนี้', owner: 'ปวีณา ส.',
    agency: 'doa', permitNeeded: true, formCode: 'RGoods',
    formName: 'ใบอนุญาตนำเข้าวัตถุอันตราย — กษ.',
    conf: 82, stage: 7, statusKey: 'await_customer',
    assess: { conf: 82, reason: 'วัตถุอันตรายประเภท 3 ต้องขออนุญาต' },
    classify: { agency: 'doa', conf: 82, reason: '', alt: [] },
    draft: { fields: [] }, flags: [],
    audit: [{ time: '08:10', text: 'เข้าระบบ', by: 'ระบบ' }],
    email: { toName: 'คุณมานะ รุ่งเรือง', to: 'mana@agriplus.co.th',
      subject: 'ขอเอกสารประกอบ — Glyphosate Technical', body: '', attName: '' },
    messages: [
      bot('08:10', 'ใบขนสินค้า HTHM000000004 เข้าระบบแล้วครับ — Glyphosate Technical จากจีน'),
      usr('08:11', 'ส่งอีเมลหาลูกค้า'),
      bot('08:11', 'ส่งอีเมลถึง คุณมานะ รุ่งเรือง (mana@agriplus.co.th) เรียบร้อยแล้ว — รอลูกค้ายืนยันเอกสารครับ'),
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
];
