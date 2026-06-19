import { Shipment, ShipmentStatus, AgencyKey } from '@app/core/models/types';

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

const base = (id: string, customsNo: string, hthmRef: string, goods: string,
  agency: AgencyKey, statusKey: ShipmentStatus, stage: number,
  conf: number, isNew: boolean, flags: Shipment['flags'],
  messages: Shipment['messages']): Shipment => ({
  id, hthmRef, customsNo, isNew, goods, agency, statusKey, stage, conf,
  flags, messages: messages ?? [],
  type: 'IMP',
  customer: 'บริษัท เฮลท์ฟาร์มา จำกัด',
  contact: 'คุณสมหญิง วัฒนกุล',
  contactEmail: 'somying@healthpharma.co.th',
  hs: '2941.10.00',
  origin: 'อินเดีย',
  importedAt: '09:42 น. วันนี้',
  owner: 'ปวีณา ส.',
  permitNeeded: true,
  formCode: 'RGoods',
  formName: 'คำขออนุญาตนำเข้าวัตถุดิบยา (RGoods) — อย.',
  assess: { conf, reason: 'ตรงตามเงื่อนไขการนำเข้า' },
  classify: { agency, conf, reason: '', alt: [] },
  draft: { fields: [] },
  audit: [{ time: '09:42', text: 'เข้าระบบ', by: 'ระบบ' }],
  email: {
    toName: 'คุณสมหญิง วัฒนกุล',
    to: 'somying@healthpharma.co.th',
    subject: 'ขอเอกสารประกอบการขออนุญาตนำเข้า',
    body: 'เรียน คุณสมหญิง\n\nกรุณาส่งเอกสารเพิ่มเติมดังนี้...',
    attName: 'draft_license.pdf',
  },
});

export const MOCK_QUEUE: Shipment[] = [
  base('IMP-68-008912', 'A012-25680617-00891', 'HTHM000000001',
    'Amoxicillin Trihydrate (วัตถุดิบยาปฏิชีวนะ)', 'fda', 'needs_you', 4, 96, true,
    [
      { id: 'f1', title: 'ปริมาณไม่ตรง', detail: 'Invoice: 250 กก. / Packing List: 248.5 กก.', conf: 72, resolved: false },
      { id: 'f2', title: 'เลข GMP อ่านไม่ชัด', detail: '3 ตัวท้ายไม่ชัดเจน', conf: 65, resolved: false },
    ],
    [
      { id: 'q1m1', role: 'bot', type: 'text', content: 'ใบขนสินค้า A012-25680617-00891 เข้าระบบแล้ว — Amoxicillin Trihydrate 250 กก. จากอินเดีย ท่าเรือแหลมฉบัง', time: '09:42' },
      { id: 'q1m2', role: 'bot', type: 'text', content: 'AI ตรวจสอบ HS Code 2941.10.00 → ต้องขออนุญาต RGoods จาก อย. ความมั่นใจ 96%', time: '09:42' },
      { id: 'q1m3', role: 'bot', type: 'text', content: 'ร่างคำขออนุญาตอัตโนมัติเสร็จแล้ว — พบ 2 จุดที่ต้องตรวจสอบ', time: '09:43' },
    ]),

  base('IMP-68-008915', 'A012-25680617-00915', 'HTHM000000002',
    'Human Insulin (มาตรฐานอินซูลิน สำเร็จรูป)', 'fda', 'needs_you', 4, 91, true,
    [{ id: 'f3', title: 'วันหมดอายุต่างกัน', detail: 'CoA vs Label ต่างกัน 1 วัน', conf: 78, resolved: false }],
    [
      { id: 'q2m1', role: 'bot', type: 'text', content: 'ใบขนสินค้า A012-25680617-00915 เข้าระบบแล้ว — Human Insulin จากเยอรมนี', time: '09:31' },
      { id: 'q2m2', role: 'bot', type: 'text', content: 'พบ 1 จุดที่ต้องตรวจสอบ: วันหมดอายุใน CoA กับ Label ต่างกัน 1 วัน', time: '09:31' },
    ]),

  base('IMP-68-008920', 'A012-25680617-00920', 'HTHM000000003',
    'Surgical Gloves (ถุงมือผ่าตัด ชนิดปราศจากเชื้อ)', 'fda', 'email_outbox', 6, 88, false,
    [{ id: 'f4', title: 'เลข Lot ไม่ครบ', detail: 'แก้ไขแล้ว', conf: 95, resolved: true }],
    [
      { id: 'q3m1', role: 'bot', type: 'text', content: 'ยืนยันแล้ว ✓ ร่างอีเมลถึง คุณสมหญิง พร้อมส่งแล้ว', time: '08:55' },
    ]),

  base('IMP-68-008923', 'A012-25680617-00923', 'HTHM000000004',
    'Glyphosate Technical (สารกำจัดวัชพืช วัตถุอันตราย)', 'doa', 'await_customer', 7, 82, false,
    [],
    [
      { id: 'q4m1', role: 'bot', type: 'text', content: 'ส่งอีเมลถึง คุณมานะ (mana@agriplus.co.th) เรียบร้อยแล้ว — รอลูกค้ายืนยัน', time: '08:10' },
    ]),

  base('IMP-68-008928', 'A012-25680617-00928', 'HTHM000000005',
    'HPLC Column (คอลัมน์วิเคราะห์สำหรับห้องปฏิบัติการ)', 'none', 'no_permit', 2, 94, false,
    [],
    [
      { id: 'q5m1', role: 'bot', type: 'text', content: 'AI ตรวจสอบ HS Code 9027.90.90 → ไม่ต้องขออนุญาตนำเข้า ความมั่นใจ 94%', time: '08:02' },
    ]),

  base('IMP-68-008931', 'A012-25680617-00931', 'HTHM000000005',
    'Ethanol 99.5% (Absolute Ethanol) สำหรับอุตสาหกรรม', 'diw', 'submitted', 8, 97, false,
    [],
    [
      { id: 'q6m1', role: 'bot', type: 'text', content: 'ยื่นเอกสารถึงกรมเรียบร้อยแล้ว ✓ แบบฟอร์ม RGoods — A012-25680617-00931', time: '07:30' },
    ]),
];
