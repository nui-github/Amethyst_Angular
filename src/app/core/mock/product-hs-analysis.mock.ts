import { ProductHsAnalysis } from '@app/core/models/types';

// AI usecase: product description (จาก invoice) → HS Code → Smart Tariff (พิกัดอัตราศุลกากรเต็ม)
// → กรมที่ต้องยื่นขอใบอนุญาตสำหรับสินค้าตัวนั้น (ถ้ามี)
const PRODUCT_HS_ANALYSIS: ProductHsAnalysis[] = [
  { id: 'p1',  name: 'Amoxicillin Trihydrate',            hsCode: '2941.10.00', tariffCode: '2941.10.00.001', requiresPermit: true,  agency: 'อย.', agencyFull: 'สำนักงานคณะกรรมการอาหารและยา', licenseType: 'RGoods', confidence: 96 },
  { id: 'p2',  name: 'Ampicillin Sodium',                 hsCode: '2941.10.00', tariffCode: '2941.10.00.002', requiresPermit: true,  agency: 'อย.', agencyFull: 'สำนักงานคณะกรรมการอาหารและยา', licenseType: 'RGoods', confidence: 94 },
  { id: 'p3',  name: 'Paracetamol Powder (API)',          hsCode: '3004.90.00', tariffCode: '3004.90.00.014', requiresPermit: true,  agency: 'อย.', agencyFull: 'สำนักงานคณะกรรมการอาหารและยา', licenseType: 'RGoods', confidence: 92 },
  { id: 'p4',  name: 'Ibuprofen Tablets',                 hsCode: '3004.90.00', tariffCode: '3004.90.00.021', requiresPermit: true,  agency: 'อย.', agencyFull: 'สำนักงานคณะกรรมการอาหารและยา', licenseType: 'RGoods', confidence: 90 },
  { id: 'p5',  name: 'Metformin HCl',                     hsCode: '2941.90.00', tariffCode: '2941.90.00.007', requiresPermit: true,  agency: 'อย.', agencyFull: 'สำนักงานคณะกรรมการอาหารและยา', licenseType: 'RGoods', confidence: 88 },
  { id: 'p6',  name: 'Chlorpyrifos (สารกำจัดแมลง)',        hsCode: '3808.91.00', tariffCode: '3808.91.00.003', requiresPermit: true,  agency: 'กษ.', agencyFull: 'กรมวิชาการเกษตร', licenseType: 'วัตถุอันตราย', confidence: 93 },
  { id: 'p7',  name: 'Glyphosate Technical',              hsCode: '3808.93.00', tariffCode: '3808.93.00.011', requiresPermit: true,  agency: 'กษ.', agencyFull: 'กรมวิชาการเกษตร', licenseType: 'วัตถุอันตราย', confidence: 95 },
  { id: 'p8',  name: 'Wheat Flour (แป้งสาลี)',             hsCode: '1101.00.00', tariffCode: '1101.00.00.000', requiresPermit: false, agency: '—',   agencyFull: 'ไม่ต้องขออนุญาตเพิ่มเติม', confidence: 85 },
  { id: 'p9',  name: 'Titanium Dioxide (เกรดอุตสาหกรรม)',  hsCode: '3206.11.00', tariffCode: '3206.11.00.005', requiresPermit: false, agency: '—',   agencyFull: 'ไม่ต้องขออนุญาตเพิ่มเติม', confidence: 81 },
  { id: 'p10', name: 'Vitamin C Powder (Food Grade)',      hsCode: '2936.27.00', tariffCode: '2936.27.00.009', requiresPermit: true,  agency: 'อย.', agencyFull: 'สำนักงานคณะกรรมการอาหารและยา', licenseType: 'อาหาร', confidence: 87 },
  { id: 'p11', name: 'Insulin (Human, สำเร็จรูป)',         hsCode: '3004.31.00', tariffCode: '3004.31.00.002', requiresPermit: true,  agency: 'อย.', agencyFull: 'สำนักงานคณะกรรมการอาหารและยา', licenseType: 'RGoods', confidence: 91 },
  { id: 'p12', name: 'Mancozeb (สารป้องกันเชื้อรา)',       hsCode: '3808.92.00', tariffCode: '3808.92.00.006', requiresPermit: true,  agency: 'กษ.', agencyFull: 'กรมวิชาการเกษตร', licenseType: 'วัตถุอันตราย', confidence: 89 },
  { id: 'p13', name: 'เครื่องวิเคราะห์ทางห้องปฏิบัติการ',  hsCode: '9027.80.90', tariffCode: '9027.80.90.012', requiresPermit: false, agency: '—',   agencyFull: 'ไม่ต้องขออนุญาตเพิ่มเติม', confidence: 83 },
  { id: 'p14', name: 'Sodium Benzoate (วัตถุกันเสียอาหาร)', hsCode: '2916.31.00', tariffCode: '2916.31.00.004', requiresPermit: true,  agency: 'อย.', agencyFull: 'สำนักงานคณะกรรมการอาหารและยา', licenseType: 'อาหาร', confidence: 86 },
  { id: 'p15', name: 'Microcrystalline Cellulose (Excipient)', hsCode: '3912.90.00', tariffCode: '3912.90.00.008', requiresPermit: false, agency: '—', agencyFull: 'ไม่ต้องขออนุญาตเพิ่มเติม', confidence: 80 },
];

export function getProductHsAnalysis(): ProductHsAnalysis[] {
  return PRODUCT_HS_ANALYSIS;
}

// ตัวเลือกกรมสำหรับแก้ไข ถ้า user เห็นว่า AI วิเคราะห์ผิด
export const AGENCY_CORRECTION_OPTIONS: { code: string; full: string }[] = [
  { code: 'อย.', full: 'สำนักงานคณะกรรมการอาหารและยา' },
  { code: 'กษ.', full: 'กรมวิชาการเกษตร' },
  { code: '—',   full: 'ไม่ต้องขอใบอนุญาต' },
];
