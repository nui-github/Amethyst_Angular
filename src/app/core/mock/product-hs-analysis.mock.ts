import { ProductHsAnalysis } from '@app/core/models/types';

// AI usecase: product description (จาก invoice OCR) → HS Code → Smart Tariff (พิกัดอัตราศุลกากรเต็ม)
// → กรมที่ต้องยื่นขอใบอนุญาตสำหรับสินค้าตัวนั้น (ถ้ามี)
//
// Item set mirrors the invoice OCR line items (invoice-ocr.mock.ts) — all are medical devices,
// which require an import license from อย. (เครื่องมือแพทย์) under the Medical Device Act.
// Used as the single shared dataset for item-hs-analysis across every flow (invoice, SPN, customs).
const PRODUCT_HS_ANALYSIS: ProductHsAnalysis[] = [
  { id: 'p1', name: 'Stent Graft (ETBF2313C145EE)',       hsCode: '9021.39.00', tariffCode: '9021.39.00.001', requiresPermit: true, agency: 'อย.', agencyFull: 'สำนักงานคณะกรรมการอาหารและยา', licenseType: 'เครื่องมือแพทย์', confidence: 95 },
  { id: 'p2', name: 'Coronary Stent (TRCR30015X)',        hsCode: '9018.90.90', tariffCode: '9018.90.90.002', requiresPermit: true, agency: 'อย.', agencyFull: 'สำนักงานคณะกรรมการอาหารและยา', licenseType: 'เครื่องมือแพทย์', confidence: 93 },
  { id: 'p3', name: 'Introducer Sheath (SENSH1628W)',     hsCode: '9018.39.90', tariffCode: '9018.39.90.003', requiresPermit: true, agency: 'อย.', agencyFull: 'สำนักงานคณะกรรมการอาหารและยา', licenseType: 'เครื่องมือแพทย์', confidence: 91 },
  { id: 'p4', name: 'Balloon Catheter (SPL20015X)',       hsCode: '9018.39.90', tariffCode: '9018.39.90.004', requiresPermit: true, agency: 'อย.', agencyFull: 'สำนักงานคณะกรรมการอาหารและยา', licenseType: 'เครื่องมือแพทย์', confidence: 90 },
  { id: 'p5', name: 'Drug-Coated Balloon (SBI06012013P)', hsCode: '9018.39.90', tariffCode: '9018.39.90.005', requiresPermit: true, agency: 'อย.', agencyFull: 'สำนักงานคณะกรรมการอาหารและยา', licenseType: 'เครื่องมือแพทย์', confidence: 94 },
  { id: 'p6', name: 'Balloon Catheter (SPL30020X)',       hsCode: '9018.39.90', tariffCode: '9018.39.90.006', requiresPermit: true, agency: 'อย.', agencyFull: 'สำนักงานคณะกรรมการอาหารและยา', licenseType: 'เครื่องมือแพทย์', confidence: 89 },
];

export function getProductHsAnalysis(): ProductHsAnalysis[] {
  return PRODUCT_HS_ANALYSIS;
}
