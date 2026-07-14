import { ProductHsAnalysis, InvoiceLineItem } from '@app/core/models/types';

// Export-path equivalent of product-hs-analysis.mock.ts — product description (จาก export
// invoice OCR) → HS Code → Smart Tariff → กรมที่ต้องยื่นขอใบอนุญาตสำหรับการส่งออก (ถ้ามี).
//
// Item set mirrors the export-invoice OCR line items (export-invoice-ocr.mock.ts) so the
// AI-analysis box's item count/content matches the invoice OCR box, same as the import side.
// The 3 export-control agencies this build starts with: กรมควบคุมโรค (pathogen/biological
// diagnostic reagents), เชื้อเพลิง = กรมธุรกิจพลังงาน (fuel), การยาง = การยางแห่งประเทศไทย
// (rubber) — see CLAUDE.md 'Export path'. e4 (rubber compound sheet) is classified as a
// general processed-rubber good (not raw RSS3), demonstrating the "ไม่ต้องขอใบอนุญาต" group.
const EXPORT_PRODUCT_CLASSIFICATION: ProductHsAnalysis[] = [
  {
    id: 'e1', name: 'RSS3 Smoked Rubber Sheet (ยางแผ่นรมควันชั้น 3)',
    hsCode: '4001.21.00', tariffCode: '4001.21.00.001', requiresPermit: true,
    agency: 'การยาง', agencyFull: 'การยางแห่งประเทศไทย (RAOT)', licenseType: 'ใบอนุญาตค้ายาง (พ.ร.บ.ควบคุมยาง)',
    confidence: 92, dutyRate: 0,
    reason: 'จัดเป็นยางแผ่นรมควันดิบ (RSS3) ซึ่งอยู่ภายใต้การควบคุมของ พ.ร.บ.ควบคุมยาง พ.ศ. 2542 ต้องมีใบอนุญาตค้ายางจากการยางแห่งประเทศไทยก่อนส่งออก',
    candidates: [
      { hsCode: '4001.21.00', tariffCode: '4001.21.00.001', description: 'ยางแผ่นรมควัน (Smoked Sheets) ชั้น 1-5', dutyRate: 0, confidence: 92 },
      { hsCode: '4001.22.00', tariffCode: '4001.22.00.001', description: 'ยางแท่ง (Technically Specified Natural Rubber, TSNR)', dutyRate: 0, confidence: 70 },
      { hsCode: '4001.29.00', tariffCode: '4001.29.00.001', description: 'ยางธรรมชาติชนิดอื่นๆ ที่มิได้ระบุไว้เฉพาะ', dutyRate: 0, confidence: 58 },
      { hsCode: '4005.10.00', tariffCode: '4005.10.00.001', description: 'ยางแผ่นผสม (Compounded Rubber)', dutyRate: 0, confidence: 40, agency: '—', agencyFull: '—', requiresPermit: false },
      { hsCode: '4001.30.00', tariffCode: '4001.30.00.001', description: 'ยางบาลาตา/กัตตาเปอร์ชา/กัวยูล/ชิเคิล และยางธรรมชาติที่คล้ายกัน', dutyRate: 0, confidence: 25 },
    ],
  },
  {
    id: 'e2', name: 'Industrial Fuel Oil (น้ำมันเตาอุตสาหกรรม)',
    hsCode: '2710.19.51', tariffCode: '2710.19.51.001', requiresPermit: true,
    agency: 'เชื้อเพลิง', agencyFull: 'กรมธุรกิจพลังงาน (DOEB)', licenseType: 'ใบอนุญาตประกอบกิจการควบคุมประเภทที่ 3 (พ.ร.บ.ควบคุมน้ำมันเชื้อเพลิง)',
    confidence: 88, dutyRate: 0,
    reason: 'จัดเป็นน้ำมันเตาสำหรับใช้ในอุตสาหกรรม อยู่ภายใต้การควบคุมของ พ.ร.บ.ควบคุมน้ำมันเชื้อเพลิง พ.ศ. 2542 ต้องขอใบอนุญาตจากกรมธุรกิจพลังงานก่อนส่งออก',
    candidates: [
      { hsCode: '2710.19.51', tariffCode: '2710.19.51.001', description: 'น้ำมันเตา (Fuel Oil) สำหรับอุตสาหกรรม', dutyRate: 0, confidence: 88 },
      { hsCode: '2710.19.31', tariffCode: '2710.19.31.001', description: 'น้ำมันดีเซล (Diesel Fuel)', dutyRate: 0, confidence: 62 },
      { hsCode: '2710.12.11', tariffCode: '2710.12.11.001', description: 'น้ำมันเบนซิน (Motor Gasoline)', dutyRate: 0, confidence: 41 },
      { hsCode: '2710.19.90', tariffCode: '2710.19.90.001', description: 'น้ำมันปิโตรเลียมอื่นๆ ที่มิได้ระบุไว้เฉพาะ', dutyRate: 0, confidence: 30 },
    ],
  },
  {
    id: 'e3', name: 'Pathogen Diagnostic Reagent Kit (ชุดน้ำยาตรวจวินิจฉัยเชื้อโรค)',
    hsCode: '3822.00.00', tariffCode: '3822.00.00.001', requiresPermit: true,
    agency: 'กรมควบคุมโรค', agencyFull: 'กรมควบคุมโรค (DDC)', licenseType: 'ใบอนุญาตนำเข้า-ส่งออกเชื้อโรคและพิษจากสัตว์',
    confidence: 84, dutyRate: 0,
    reason: 'บรรจุสารเชื้อโรคอ้างอิง (reference pathogen material) ในชุดน้ำยาตรวจวินิจฉัย อยู่ภายใต้ พ.ร.บ.เชื้อโรคและพิษจากสัตว์ พ.ศ. 2558 ต้องขอใบอนุญาตจากกรมควบคุมโรคก่อนส่งออก',
    candidates: [
      { hsCode: '3822.00.00', tariffCode: '3822.00.00.001', description: 'น้ำยา/ชุดตรวจวินิจฉัยทางการแพทย์หรือห้องปฏิบัติการ ที่มีเชื้อโรคอ้างอิง', dutyRate: 0, confidence: 84 },
      { hsCode: '3002.15.00', tariffCode: '3002.15.00.001', description: 'ผลิตภัณฑ์วินิจฉัยทางภูมิคุ้มกันชนิดจัดเป็นชุด (ไม่มีเชื้อโรคอ้างอิง)', dutyRate: 0, confidence: 55, agency: '—', agencyFull: '—', requiresPermit: false },
      { hsCode: '3822.00.00', tariffCode: '3822.00.00.002', description: 'น้ำยา/ชุดตรวจวินิจฉัยทั่วไป (ไม่มีเชื้อโรคอ้างอิง)', dutyRate: 0, confidence: 46, agency: '—', agencyFull: '—', requiresPermit: false },
      { hsCode: '3006.30.00', tariffCode: '3006.30.00.001', description: 'สารทึบรังสี/สารช่วยวินิจฉัยทางการแพทย์อื่นๆ', dutyRate: 0, confidence: 28 },
    ],
  },
  {
    id: 'e4', name: 'Rubber Compound Sheet (ยางแผ่นผสม)',
    hsCode: '4005.10.00', tariffCode: '4005.10.00.001', requiresPermit: false,
    agency: '—', agencyFull: '—',
    confidence: 81, dutyRate: 0,
    reason: 'จัดเป็นยางแผ่นที่ผ่านการผสมสารเคมี (Compounded Rubber) แล้ว ไม่ใช่ยางดิบตามความหมายของ พ.ร.บ.ควบคุมยาง จึงไม่เข้าข่ายต้องขอใบอนุญาตค้ายางจากการยางแห่งประเทศไทย',
    candidates: [
      { hsCode: '4005.10.00', tariffCode: '4005.10.00.001', description: 'ยางผสมสารเคมี ยังไม่ได้ทำเป็นแผ่น/แท่ง/รูปทรงอื่น (Compounded Rubber)', dutyRate: 0, confidence: 81 },
      { hsCode: '4001.21.00', tariffCode: '4001.21.00.002', description: 'ยางแผ่นรมควันดิบ (ควบคุมโดยการยางแห่งประเทศไทย)', dutyRate: 0, confidence: 47, agency: 'การยาง', agencyFull: 'การยางแห่งประเทศไทย', requiresPermit: true, licenseType: 'ใบอนุญาตค้ายาง (พ.ร.บ.ควบคุมยาง)' },
      { hsCode: '4006.90.00', tariffCode: '4006.90.00.001', description: 'ผลิตภัณฑ์ยางกึ่งสำเร็จรูปชนิดอื่นๆ', dutyRate: 0, confidence: 33 },
    ],
  },
];

export function getExportProductClassification(): ProductHsAnalysis[] {
  return EXPORT_PRODUCT_CLASSIFICATION;
}

// Commercial data (qty/unit/price/lot) per item — reconstructed from the same export invoice
// (export-invoice-ocr.mock.ts EXPORT_INVOICE_CUSTOMS_ITEMS) so form-preview's item modal can
// auto-fill Qty/Lot from OCR instead of asking the user to retype data already captured.
const EXPORT_ITEM_COMMERCIAL: Record<string, { quantity: string; unit: string; unitPrice: number; amount: number; lotNo: string; mfgDate?: string; expDate?: string }> = {
  e1: { quantity: '20000', unit: 'กก.',   unitPrice: 85.20,  amount: 1704000.00, lotNo: 'RSS3-2568-090' },
  e2: { quantity: '5000',  unit: 'ลิตร',  unitPrice: 22.78,  amount: 113900.00,  lotNo: 'FO-2568-021' },
  e3: { quantity: '500',   unit: 'กล่อง', unitPrice: 1067.20, amount: 533600.00, lotNo: 'BIO-2568-014', mfgDate: '10-05-2568', expDate: '10-05-2570' },
  e4: { quantity: '3000',  unit: 'กก.',   unitPrice: 53.27,  amount: 159800.00,  lotNo: 'SGL-2568-044' },
};

/** Convert confirmed item-hs-analysis rows into the InvoiceLineItem shape used as
 *  formData.selectedItems for the export path — same role as mapToInvoiceLineItems()
 *  (product-hs-analysis.mock.ts) on the import side. */
export function mapExportItemsToInvoiceLineItems(items: ProductHsAnalysis[]): InvoiceLineItem[] {
  return items.map(p => {
    const c = EXPORT_ITEM_COMMERCIAL[p.id] ?? { quantity: '1', unit: 'หน่วย', unitPrice: 0, amount: 0, lotNo: p.id };
    // e1..e4 map 1:1 (by construction) to CustomsDeclarationItem.itemNumber 1..4 in
    // EXPORT_INVOICE_CUSTOMS_ITEMS (export-invoice-ocr.mock.ts) — same export invoice, same order.
    const declarationItemNumber = Number(p.id.replace(/^e/, '')) || undefined;
    return {
      id: p.id, name: p.name, hsCode: p.hsCode, quantity: c.quantity, unit: c.unit,
      unitPrice: c.unitPrice, amount: c.amount, lotNo: c.lotNo, mfgDate: c.mfgDate, expDate: c.expDate,
      declarationItemNumber,
    };
  });
}
