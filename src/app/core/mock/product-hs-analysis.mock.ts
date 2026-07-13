import { ProductHsAnalysis, InvoiceLineItem } from '@app/core/models/types';

// AI usecase: product description (จาก invoice OCR) → HS Code → Smart Tariff (พิกัดอัตราศุลกากรเต็ม)
// → กรมที่ต้องยื่นขอใบอนุญาตสำหรับสินค้าตัวนั้น (ถ้ามี)
//
// Item set mirrors the invoice OCR line items (invoice-ocr.mock.ts) — all are medical devices or
// device accessories. Real invoices from users typically carry no HS Code at all, so the AI
// classifies purely from the product description — there is no "compare against invoice's HS
// Code" step. Each item carries its own `reason` (why AI chose this heading), `dutyRate`, and up
// to 5 `candidates` so the user can manually re-classify a single item if the AI's pick looks
// wrong (see ItemHsAnalysisComponent's edit/candidate-picker UI).
//
// p1/p3 (gamma-sterilized implantable devices) additionally require ปส. (สำนักงานปรมาณูเพื่อสันติภาพ)
// clearance on top of อย. — this intentionally gives the flow 2 permit-required agencies so the
// "ขอใบอนุญาตเพิ่ม" (next-agency LPI) step is reachable from every flow (invoice, SPN, customs).
// p6 is classified as a general plastic accessory (not a controlled medical device), demonstrating
// the "ไม่ต้องขอใบอนุญาต" group that also renders in item-hs-analysis.
// Used as the single shared dataset for item-hs-analysis across every flow.
const PRODUCT_HS_ANALYSIS: ProductHsAnalysis[] = [
  {
    id: 'p1', name: 'Stent Graft (ETBF2313C145EE)',
    hsCode: '9021.39.00', tariffCode: '9021.39.00.001', requiresPermit: true,
    agency: 'ปส.', agencyFull: 'สำนักงานปรมาณูเพื่อสันติภาพ', licenseType: 'ผ่านการฆ่าเชื้อด้วยรังสีแกมมา',
    confidence: 95, dutyRate: 0,
    reason: 'จัดเป็นอุปกรณ์ปลูกถ่ายหลอดเลือด (Stent Graft) ที่ใช้ฝังในร่างกายถาวร ตรงตามพิกัดเครื่องมือแพทย์ประเภทอุปกรณ์เทียม และผ่านการฆ่าเชื้อด้วยรังสีแกมมาก่อนส่งมอบ',
    candidates: [
      { hsCode: '9021.39.00', tariffCode: '9021.39.00.001', description: 'อุปกรณ์เทียมชนิดอื่นๆ ที่ใช้ฝังในร่างกาย (Stent Graft)', dutyRate: 0, confidence: 95 },
      { hsCode: '9021.39.00', tariffCode: '9021.39.00.002', description: 'ข้อต่อเทียม/อวัยวะเทียมอื่นๆ', dutyRate: 0, confidence: 78 },
      { hsCode: '9018.39.90', tariffCode: '9018.39.90.010', description: 'สายสวนและอุปกรณ์การแพทย์ประเภทท่อ/สาย', dutyRate: 5, confidence: 65 },
      { hsCode: '9021.90.90', tariffCode: '9021.90.90.005', description: 'อุปกรณ์ทางออร์โธปิดิกส์อื่นๆ', dutyRate: 0, confidence: 55 },
      { hsCode: '9018.90.90', tariffCode: '9018.90.90.099', description: 'เครื่องมือแพทย์อื่นๆ ที่มิได้ระบุไว้เฉพาะ', dutyRate: 5, confidence: 40 },
    ],
  },
  {
    id: 'p2', name: 'Coronary Stent (TRCR30015X)',
    hsCode: '9018.90.90', tariffCode: '9018.90.90.002', requiresPermit: true,
    agency: 'อย.', agencyFull: 'สำนักงานคณะกรรมการอาหารและยา', licenseType: 'เครื่องมือแพทย์',
    confidence: 93, dutyRate: 5,
    reason: 'จัดเป็นขดลวดค้ำยันหลอดเลือดหัวใจ (Coronary Stent) ซึ่งเป็นเครื่องมือแพทย์เฉพาะทางที่ใช้รักษาโรคหลอดเลือดหัวใจตีบ',
    candidates: [
      { hsCode: '9018.90.90', tariffCode: '9018.90.90.002', description: 'เครื่องมือแพทย์ประเภทขดลวดค้ำยันหลอดเลือด (Stent)', dutyRate: 5, confidence: 93 },
      { hsCode: '9021.39.00', tariffCode: '9021.39.00.003', description: 'อุปกรณ์เทียมที่ใช้ฝังในหลอดเลือด', dutyRate: 0, confidence: 71 },
      { hsCode: '9018.39.90', tariffCode: '9018.39.90.011', description: 'สายสวนหลอดเลือดหัวใจ', dutyRate: 5, confidence: 58 },
      { hsCode: '9018.90.90', tariffCode: '9018.90.90.050', description: 'เครื่องมือแพทย์สำหรับการผ่าตัดหลอดเลือด', dutyRate: 5, confidence: 47 },
      { hsCode: '9019.90.00', tariffCode: '9019.90.00.001', description: 'อุปกรณ์กายภาพบำบัด/เครื่องช่วยพยุงอื่นๆ', dutyRate: 10, confidence: 30 },
    ],
  },
  {
    id: 'p3', name: 'Introducer Sheath (SENSH1628W)',
    hsCode: '9018.39.90', tariffCode: '9018.39.90.003', requiresPermit: true,
    agency: 'ปส.', agencyFull: 'สำนักงานปรมาณูเพื่อสันติภาพ', licenseType: 'ผ่านการฆ่าเชื้อด้วยรังสีแกมมา',
    confidence: 91, dutyRate: 5,
    reason: 'จัดเป็นปลอกนำสาย (Introducer Sheath) ที่ใช้ร่วมกับสายสวนในหัตถการหลอดเลือด เป็นอุปกรณ์ใช้ครั้งเดียวที่ผ่านการฆ่าเชื้อด้วยรังสีแกมมา',
    candidates: [
      { hsCode: '9018.39.90', tariffCode: '9018.39.90.003', description: 'ปลอกนำสาย/สายสวนใช้ครั้งเดียว (Introducer Sheath)', dutyRate: 5, confidence: 91 },
      { hsCode: '9018.39.90', tariffCode: '9018.39.90.012', description: 'สายสวนหลอดเลือดทั่วไป', dutyRate: 5, confidence: 74 },
      { hsCode: '9018.90.90', tariffCode: '9018.90.90.060', description: 'อุปกรณ์เสริมสำหรับหัตถการหลอดเลือด', dutyRate: 5, confidence: 62 },
      { hsCode: '9021.39.00', tariffCode: '9021.39.00.004', description: 'อุปกรณ์เทียมที่ฝังร่วมกับสายสวน', dutyRate: 0, confidence: 44 },
      { hsCode: '4015.19.00', tariffCode: '4015.19.00.001', description: 'ผลิตภัณฑ์ยางสำหรับการแพทย์ทั่วไป', dutyRate: 10, confidence: 28 },
    ],
  },
  {
    id: 'p4', name: 'Balloon Catheter (SPL20015X)',
    hsCode: '9018.39.90', tariffCode: '9018.39.90.004', requiresPermit: true,
    agency: 'อย.', agencyFull: 'สำนักงานคณะกรรมการอาหารและยา', licenseType: 'เครื่องมือแพทย์',
    confidence: 90, dutyRate: 5,
    reason: 'จัดเป็นสายสวนบอลลูนขยายหลอดเลือด (Balloon Catheter) ที่ใช้ในหัตถการขยายหลอดเลือดตีบ ตรงตามพิกัดสายสวนทางการแพทย์',
    candidates: [
      { hsCode: '9018.39.90', tariffCode: '9018.39.90.004', description: 'สายสวนบอลลูนขยายหลอดเลือด (Balloon Catheter)', dutyRate: 5, confidence: 90 },
      { hsCode: '9021.10.00', tariffCode: '9021.10.00.002', description: 'อุปกรณ์กระดูกและข้อเทียม', dutyRate: 0, confidence: 68 },
      { hsCode: '9018.39.90', tariffCode: '9018.39.90.013', description: 'สายสวนหลอดเลือดชนิดไม่มีบอลลูน', dutyRate: 5, confidence: 55 },
      { hsCode: '9018.90.90', tariffCode: '9018.90.90.070', description: 'เครื่องมือแพทย์สำหรับหัตถการขยายหลอดเลือด', dutyRate: 5, confidence: 49 },
      { hsCode: '4015.19.00', tariffCode: '4015.19.00.002', description: 'ผลิตภัณฑ์ยางสำหรับการแพทย์ทั่วไป', dutyRate: 10, confidence: 25 },
    ],
  },
  {
    id: 'p5', name: 'Drug-Coated Balloon (SBI06012013P)',
    hsCode: '9018.39.90', tariffCode: '9018.39.90.005', requiresPermit: true,
    agency: 'อย.', agencyFull: 'สำนักงานคณะกรรมการอาหารและยา', licenseType: 'เครื่องมือแพทย์',
    confidence: 94, dutyRate: 5,
    reason: 'จัดเป็นสายสวนบอลลูนเคลือบยา (Drug-Coated Balloon) ซึ่งเป็นสายสวนทางการแพทย์ที่มีการเคลือบสารออกฤทธิ์เพื่อป้องกันหลอดเลือดตีบซ้ำ',
    candidates: [
      { hsCode: '9018.39.90', tariffCode: '9018.39.90.005', description: 'สายสวนบอลลูนเคลือบยา (Drug-Coated Balloon)', dutyRate: 5, confidence: 94 },
      { hsCode: '3004.90.90', tariffCode: '3004.90.90.001', description: 'ผลิตภัณฑ์ยาสำเร็จรูปอื่นๆ', dutyRate: 10, confidence: 60 },
      { hsCode: '9018.39.90', tariffCode: '9018.39.90.004', description: 'สายสวนบอลลูนขยายหลอดเลือดทั่วไป (ไม่เคลือบยา)', dutyRate: 5, confidence: 52 },
      { hsCode: '9021.39.00', tariffCode: '9021.39.00.005', description: 'อุปกรณ์เทียมที่มีการเคลือบสารออกฤทธิ์', dutyRate: 0, confidence: 45 },
      { hsCode: '9018.90.90', tariffCode: '9018.90.90.080', description: 'เครื่องมือแพทย์เฉพาะทางหัวใจและหลอดเลือดอื่นๆ', dutyRate: 5, confidence: 33 },
    ],
  },
  {
    id: 'p6', name: 'Balloon Catheter Packaging Accessory (SPL30020X)',
    hsCode: '3926.90.99', tariffCode: '3926.90.99.014', requiresPermit: false,
    agency: '—', agencyFull: '—',
    confidence: 89, dutyRate: 10,
    reason: 'จัดเป็นบรรจุภัณฑ์พลาสติกเสริมสำหรับชุดสายสวน ไม่ใช่ส่วนที่สัมผัสหรือใช้รักษาผู้ป่วยโดยตรง จึงไม่เข้าข่ายเครื่องมือแพทย์ควบคุมที่ต้องขออนุญาตจาก อย.',
    candidates: [
      { hsCode: '3926.90.99', tariffCode: '3926.90.99.014', description: 'ผลิตภัณฑ์พลาสติกอื่นๆ ที่มิได้ระบุไว้เฉพาะ (บรรจุภัณฑ์เสริม)', dutyRate: 10, confidence: 89 },
      { hsCode: '9018.39.90', tariffCode: '9018.39.90.014', description: 'ส่วนประกอบของสายสวนทางการแพทย์', dutyRate: 5, confidence: 62 },
      { hsCode: '3923.90.00', tariffCode: '3923.90.00.002', description: 'ภาชนะบรรจุพลาสติกทั่วไป', dutyRate: 10, confidence: 54 },
      { hsCode: '9018.90.90', tariffCode: '9018.90.90.090', description: 'อุปกรณ์เสริมเครื่องมือแพทย์อื่นๆ', dutyRate: 5, confidence: 41 },
      { hsCode: '4819.50.00', tariffCode: '4819.50.00.001', description: 'บรรจุภัณฑ์กระดาษ/เยื่อกระดาษอื่นๆ', dutyRate: 10, confidence: 22 },
    ],
  },
  {
    id: 'p7', name: 'Advanced Wound Care Patch (AWC-9942X)',
    hsCode: '', tariffCode: '', requiresPermit: false,
    agency: '?', agencyFull: 'ยังไม่สามารถระบุได้',
    confidence: 38, dutyRate: 0,
    reason: 'AI ไม่สามารถระบุพิกัด HS Code ที่ตรงกับคำอธิบายสินค้าได้อย่างมั่นใจ (แผ่นแปะรักษาแผลที่มีทั้งคุณสมบัติทางการแพทย์และวัสดุสิ้นเปลืองทั่วไปปนกัน) กรุณาตรวจสอบเอกสารและระบุ HS Code ด้วยตนเอง',
    candidates: [
      { hsCode: '9018.90.90', tariffCode: '9018.90.90.095', description: 'เครื่องมือแพทย์สำหรับปิดแผล/วัสดุสิ้นเปลืองทางการแพทย์ควบคุม', dutyRate: 5, confidence: 52,
        agency: 'อย.', agencyFull: 'สำนักงานคณะกรรมการอาหารและยา', requiresPermit: true, licenseType: 'เครื่องมือแพทย์' },
      { hsCode: '3005.90.90', tariffCode: '3005.90.90.020', description: 'ผ้าพันแผล/วัสดุปิดแผลทั่วไป (ไม่ควบคุม)', dutyRate: 10, confidence: 45,
        agency: '—', agencyFull: '—', requiresPermit: false },
      { hsCode: '9021.39.00', tariffCode: '9021.39.00.009', description: 'วัสดุปิดแผลที่มีส่วนประกอบฝังตัว/ผ่านการฆ่าเชื้อพิเศษ', dutyRate: 0, confidence: 33,
        agency: 'ปส.', agencyFull: 'สำนักงานปรมาณูเพื่อสันติภาพ', requiresPermit: true, licenseType: 'ผ่านการฆ่าเชื้อด้วยรังสีแกมมา' },
    ],
  },
];

export function getProductHsAnalysis(): ProductHsAnalysis[] {
  return PRODUCT_HS_ANALYSIS;
}

// Commercial data (qty/unit/price/lot/production dates) per item — reconstructed from the same
// real invoice (invoice-ocr.mock.ts INVOICE_CUSTOMS_ITEMS) so the customs/SPN item-selection step
// shows realistic figures, and so form-preview's item modal can auto-fill Lot/Mfg/Exp/Qty from
// OCR instead of asking the user to retype data already captured.
const ITEM_COMMERCIAL: Record<string, { quantity: string; unit: string; unitPrice: number; amount: number; lotNo: string; mfgDate?: string; expDate?: string }> = {
  p1: { quantity: '1',   unit: 'ชิ้น', unitPrice: 85326.74, amount: 85326.74,  lotNo: 'ETBF2313C145EE', mfgDate: '01-02-2568', expDate: '01-02-2571' },
  p2: { quantity: '39',  unit: 'ชิ้น', unitPrice: 11001.55, amount: 429060.45, lotNo: 'TRCR30015X',     mfgDate: '15-01-2568', expDate: '15-01-2571' },
  p3: { quantity: '29',  unit: 'ชิ้น', unitPrice: 3864.14,  amount: 112060.06, lotNo: 'SENSH1628W',     mfgDate: '20-01-2568', expDate: '20-01-2571' },
  p4: { quantity: '189', unit: 'ชิ้น', unitPrice: 1966.27,  amount: 371625.03, lotNo: 'SPL20015X',      mfgDate: '10-02-2568', expDate: '10-02-2571' },
  p5: { quantity: '1',   unit: 'ชิ้น', unitPrice: 5246.59,  amount: 5246.59,   lotNo: 'SBI06012013P',   mfgDate: '05-02-2568', expDate: '05-02-2571' },
  p6: { quantity: '1',   unit: 'ชิ้น', unitPrice: 1962.24,  amount: 1962.24,   lotNo: 'SPL30020X' }, // no production details on file — left blank
};

/** Convert confirmed item-hs-analysis rows into the InvoiceLineItem shape used as
 *  formData.selectedItems (SPN / customs paths — every item AI grouped under the chosen
 *  agency during item-hs-analysis is the request, no separate re-selection step). */
export function mapToInvoiceLineItems(items: ProductHsAnalysis[]): InvoiceLineItem[] {
  return items.map(p => {
    const c = ITEM_COMMERCIAL[p.id] ?? { quantity: '1', unit: 'ชิ้น', unitPrice: 0, amount: 0, lotNo: p.id };
    // p1..p6 map 1:1 (by construction) to CustomsDeclarationItem.itemNumber 1..6 in
    // INVOICE_CUSTOMS_ITEMS (invoice-ocr.mock.ts) — same 6-item invoice, same order.
    const declarationItemNumber = Number(p.id.replace(/^p/, '')) || undefined;
    return {
      id: p.id, name: p.name, hsCode: p.hsCode, quantity: c.quantity, unit: c.unit,
      unitPrice: c.unitPrice, amount: c.amount, lotNo: c.lotNo, mfgDate: c.mfgDate, expDate: c.expDate,
      declarationItemNumber,
    };
  });
}
