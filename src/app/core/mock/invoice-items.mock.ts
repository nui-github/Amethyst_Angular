import { InvoiceLineItem, CustomsDeclarationItem } from '@app/core/models/types';

// รายการสินค้าใน Invoice — mock ผูกกับ MOCK_OCR_RESULT (INV-2024-8834)
// field ที่ใช้ยื่นประกอบคำขอนำเข้าจริงต่อกรม (อย./กษ.): ชื่อสินค้า, ปริมาณ/หน่วย,
// ราคาต่อหน่วย, มูลค่ารวม, Lot/Batch No., HS Code ต่อรายการ (invoice หนึ่งใบมีได้หลายรายการ)
//
// itemNumber 101-104 (not 1-6, which belong to the medical-device INVOICE_CUSTOMS_ITEMS shared by
// ocr-results/item-hs-analysis) — this is a separate shipment (pharma raw materials), so its
// CustomsDeclarationItem records get merged alongside, not on top of, the medical-device ones.
export const INVOICE_ITEMS_DECLARATION: CustomsDeclarationItem[] = [
  {
    itemNumber: 101, invoiceNo: 'INV-2024-8834', invoiceDate: '05-06-2568', invoiceItemNumber: 1, declarationLineNumber: 1,
    nameTh: 'อะม็อกซีซิลลิน ไตรไฮเดรต (วัตถุดิบยา)', nameEn: 'Amoxicillin Trihydrate (Lot AMX-2024-0617)',
    tariffCode: '2941100000', quantity: '150', quantityUnit: 'KGM',
    netWeight: '150.000', netWeightUnit: 'KGM', packageAmount: '6', packageUnit: 'DR',
    originCountry: 'อินเดีย', purchaseCountry: 'อินเดีย',
    invoiceAmountForeign: '63000.00', currencyCode: 'THB', invoiceAmountBaht: '63000.00',
    manufacture: 'Sanpharm Laboratories Pvt. Ltd., Gujarat, India',
    certificateAnalysis: 'COA-AMX-2024-0617',
    productions: [{ lotNo: 'AMX-2024-0617', mfgDate: '10-03-2568', expDate: '10-03-2570', measurement: '150', measurementUnit: 'กิโลกรัม', quantity: '150', quantityUnit: 'กิโลกรัม' }],
  },
  {
    itemNumber: 102, invoiceNo: 'INV-2024-8834', invoiceDate: '05-06-2568', invoiceItemNumber: 2, declarationLineNumber: 2,
    nameTh: 'อะม็อกซีซิลลิน ไตรไฮเดรต (วัตถุดิบยา)', nameEn: 'Amoxicillin Trihydrate (Lot AMX-2024-0618)',
    tariffCode: '2941100000', quantity: '100', quantityUnit: 'KGM',
    netWeight: '100.000', netWeightUnit: 'KGM', packageAmount: '4', packageUnit: 'DR',
    originCountry: 'อินเดีย', purchaseCountry: 'อินเดีย',
    invoiceAmountForeign: '42000.00', currencyCode: 'THB', invoiceAmountBaht: '42000.00',
    manufacture: 'Sanpharm Laboratories Pvt. Ltd., Gujarat, India',
    certificateAnalysis: 'COA-AMX-2024-0618',
    productions: [{ lotNo: 'AMX-2024-0618', mfgDate: '15-03-2568', expDate: '15-03-2570', measurement: '100', measurementUnit: 'กิโลกรัม', quantity: '100', quantityUnit: 'กิโลกรัม' }],
  },
  {
    itemNumber: 103, invoiceNo: 'INV-2024-8834', invoiceDate: '05-06-2568', invoiceItemNumber: 3, declarationLineNumber: 3,
    nameTh: 'คลาวูลานิก แอซิด โพแทสเซียม ซอลต์ (วัตถุดิบยา)', nameEn: 'Clavulanic Acid Potassium Salt',
    tariffCode: '2941900000', quantity: '50', quantityUnit: 'KGM',
    netWeight: '50.000', netWeightUnit: 'KGM', packageAmount: '2', packageUnit: 'DR',
    originCountry: 'อินเดีย', purchaseCountry: 'อินเดีย',
    invoiceAmountForeign: '49000.00', currencyCode: 'THB', invoiceAmountBaht: '49000.00',
    manufacture: 'Sanpharm Laboratories Pvt. Ltd., Gujarat, India',
    certificateAnalysis: 'COA-CLA-2024-0091',
    productions: [{ lotNo: 'CLA-2024-0091', mfgDate: '05-03-2568', expDate: '05-03-2570', measurement: '50', measurementUnit: 'กิโลกรัม', quantity: '50', quantityUnit: 'กิโลกรัม' }],
  },
  {
    itemNumber: 104, invoiceNo: 'INV-2024-8834', invoiceDate: '05-06-2568', invoiceItemNumber: 4, declarationLineNumber: 4,
    nameTh: 'ไมโครคริสตัลไลน์เซลลูโลส (สารช่วย)', nameEn: 'Microcrystalline Cellulose (Excipient)',
    tariffCode: '3912900000', quantity: '200', quantityUnit: 'KGM',
    netWeight: '200.000', netWeightUnit: 'KGM', packageAmount: '4', packageUnit: 'BOX',
    originCountry: 'อินเดีย', purchaseCountry: 'อินเดีย',
    invoiceAmountForeign: '9000.00', currencyCode: 'THB', invoiceAmountBaht: '9000.00',
    manufacture: 'Sanpharm Laboratories Pvt. Ltd., Gujarat, India',
    productions: [{ lotNo: 'MCC-2024-0210', mfgDate: '01-03-2568', expDate: '01-03-2571', measurement: '200', measurementUnit: 'กิโลกรัม', quantity: '200', quantityUnit: 'กิโลกรัม' }],
  },
];

const MOCK_INVOICE_ITEMS: InvoiceLineItem[] = [
  { id: 'item1', name: 'Amoxicillin Trihydrate (Lot AMX-2024-0617)', quantity: '150', unit: 'กิโลกรัม', unitPrice: 420, amount: 63000, lotNo: 'AMX-2024-0617', hsCode: '2941.10.00', origin: 'อินเดีย', mfgDate: '10-03-2568', expDate: '10-03-2570', declarationItemNumber: 101 },
  { id: 'item2', name: 'Amoxicillin Trihydrate (Lot AMX-2024-0618)', quantity: '100', unit: 'กิโลกรัม', unitPrice: 420, amount: 42000, lotNo: 'AMX-2024-0618', hsCode: '2941.10.00', origin: 'อินเดีย', mfgDate: '15-03-2568', expDate: '15-03-2570', declarationItemNumber: 102 },
  { id: 'item3', name: 'Clavulanic Acid Potassium Salt',              quantity: '50',  unit: 'กิโลกรัม', unitPrice: 980, amount: 49000, lotNo: 'CLA-2024-0091', hsCode: '2941.90.00', origin: 'อินเดีย', mfgDate: '05-03-2568', expDate: '05-03-2570', declarationItemNumber: 103 },
  { id: 'item4', name: 'Microcrystalline Cellulose (Excipient)',      quantity: '200', unit: 'กิโลกรัม', unitPrice: 45,  amount: 9000,  lotNo: 'MCC-2024-0210', hsCode: '3912.90.00', origin: 'อินเดีย', mfgDate: '01-03-2568', expDate: '01-03-2571', declarationItemNumber: 104 },
];

export function getInvoiceLineItems(_invoiceNo?: string): InvoiceLineItem[] {
  return MOCK_INVOICE_ITEMS;
}
