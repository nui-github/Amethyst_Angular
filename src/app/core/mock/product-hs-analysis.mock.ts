import { ProductHsAnalysis, InvoiceLineItem } from '@app/core/models/types';

// AI usecase: product description (จาก invoice OCR) → HS Code → Smart Tariff (พิกัดอัตราศุลกากรเต็ม)
// → กรมที่ต้องยื่นขอใบอนุญาตสำหรับสินค้าตัวนั้น (ถ้ามี)
//
// Item set mirrors the invoice OCR line items (invoice-ocr.mock.ts) — all are medical devices.
// Most require an import license from อย. (เครื่องมือแพทย์) under the Medical Device Act; the two
// disposable/implantable items (gamma-sterilized) additionally require ปส. (สำนักงานปรมาณูเพื่อสันติภาพ)
// clearance — this intentionally gives the flow 2 agencies so the "ขอใบอนุญาตเพิ่ม" (next-agency LPI)
// step is reachable from every flow (invoice, SPN, customs).
// Used as the single shared dataset for item-hs-analysis across every flow.
//
// p4 (Balloon Catheter) demonstrates the invoice/AI HS Code mismatch usecase: the product
// description is correct, but the invoice's own declared HS Code (invoiceHsCode) disagrees with
// what the AI classifies from that description (hsCode) — the user must pick which one to file
// under before confirming the อย. group (see ItemHsAnalysisComponent's hsResolutions).
const PRODUCT_HS_ANALYSIS: ProductHsAnalysis[] = [
  { id: 'p1', name: 'Stent Graft (ETBF2313C145EE)',       hsCode: '9021.39.00', tariffCode: '9021.39.00.001', requiresPermit: true, agency: 'ปส.', agencyFull: 'สำนักงานปรมาณูเพื่อสันติภาพ', licenseType: 'ผ่านการฆ่าเชื้อด้วยรังสีแกมมา', confidence: 95 },
  { id: 'p2', name: 'Coronary Stent (TRCR30015X)',        hsCode: '9018.90.90', tariffCode: '9018.90.90.002', requiresPermit: true, agency: 'อย.', agencyFull: 'สำนักงานคณะกรรมการอาหารและยา', licenseType: 'เครื่องมือแพทย์', confidence: 93 },
  { id: 'p3', name: 'Introducer Sheath (SENSH1628W)',     hsCode: '9018.39.90', tariffCode: '9018.39.90.003', requiresPermit: true, agency: 'ปส.', agencyFull: 'สำนักงานปรมาณูเพื่อสันติภาพ', licenseType: 'ผ่านการฆ่าเชื้อด้วยรังสีแกมมา', confidence: 91 },
  { id: 'p4', name: 'Balloon Catheter (SPL20015X)',       hsCode: '9018.39.90', tariffCode: '9018.39.90.004', requiresPermit: true, agency: 'อย.', agencyFull: 'สำนักงานคณะกรรมการอาหารและยา', licenseType: 'เครื่องมือแพทย์', confidence: 90,
    invoiceHsCode: '9021.10.00', hsMismatch: true },
  { id: 'p5', name: 'Drug-Coated Balloon (SBI06012013P)', hsCode: '9018.39.90', tariffCode: '9018.39.90.005', requiresPermit: true, agency: 'อย.', agencyFull: 'สำนักงานคณะกรรมการอาหารและยา', licenseType: 'เครื่องมือแพทย์', confidence: 94 },
  { id: 'p6', name: 'Balloon Catheter (SPL30020X)',       hsCode: '9018.39.90', tariffCode: '9018.39.90.006', requiresPermit: true, agency: 'อย.', agencyFull: 'สำนักงานคณะกรรมการอาหารและยา', licenseType: 'เครื่องมือแพทย์', confidence: 89 },
];

export function getProductHsAnalysis(): ProductHsAnalysis[] {
  return PRODUCT_HS_ANALYSIS;
}

// Commercial data (qty/unit/price) per item — reconstructed from the same real invoice
// (invoice-ocr.mock.ts) so the customs/SPN item-selection step shows realistic figures.
const ITEM_COMMERCIAL: Record<string, { quantity: string; unit: string; unitPrice: number; amount: number; lotNo: string }> = {
  p1: { quantity: '1',   unit: 'ชิ้น', unitPrice: 85326.74, amount: 85326.74,  lotNo: 'ETBF2313C145EE' },
  p2: { quantity: '39',  unit: 'ชิ้น', unitPrice: 11001.55, amount: 429060.45, lotNo: 'TRCR30015X' },
  p3: { quantity: '29',  unit: 'ชิ้น', unitPrice: 3864.14,  amount: 112060.06, lotNo: 'SENSH1628W' },
  p4: { quantity: '189', unit: 'ชิ้น', unitPrice: 1966.27,  amount: 371625.03, lotNo: 'SPL20015X' },
  p5: { quantity: '1',   unit: 'ชิ้น', unitPrice: 5246.59,  amount: 5246.59,   lotNo: 'SBI06012013P' },
  p6: { quantity: '1',   unit: 'ชิ้น', unitPrice: 1962.24,  amount: 1962.24,   lotNo: 'SPL30020X' },
};

/** Convert confirmed item-hs-analysis rows into the InvoiceLineItem shape used by the
 *  invoice-items selection step (SPN / customs paths — selecting which of the AI-analyzed,
 *  agency-grouped items to actually submit). */
export function mapToInvoiceLineItems(items: ProductHsAnalysis[]): InvoiceLineItem[] {
  return items.map(p => {
    const c = ITEM_COMMERCIAL[p.id] ?? { quantity: '1', unit: 'ชิ้น', unitPrice: 0, amount: 0, lotNo: p.id };
    return { id: p.id, name: p.name, hsCode: p.hsCode, quantity: c.quantity, unit: c.unit, unitPrice: c.unitPrice, amount: c.amount, lotNo: c.lotNo };
  });
}
