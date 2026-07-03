import { InvoiceLineItem } from '@app/core/models/types';

// รายการสินค้าใน Invoice — mock ผูกกับ MOCK_OCR_RESULT (INV-2024-8834)
// field ที่ใช้ยื่นประกอบคำขอนำเข้าจริงต่อกรม (อย./กษ.): ชื่อสินค้า, ปริมาณ/หน่วย,
// ราคาต่อหน่วย, มูลค่ารวม, Lot/Batch No., HS Code ต่อรายการ (invoice หนึ่งใบมีได้หลายรายการ)
const MOCK_INVOICE_ITEMS: InvoiceLineItem[] = [
  { id: 'item1', name: 'Amoxicillin Trihydrate (Lot AMX-2024-0617)', quantity: '150', unit: 'กิโลกรัม', unitPrice: 420, amount: 63000, lotNo: 'AMX-2024-0617', hsCode: '2941.10.00' },
  { id: 'item2', name: 'Amoxicillin Trihydrate (Lot AMX-2024-0618)', quantity: '100', unit: 'กิโลกรัม', unitPrice: 420, amount: 42000, lotNo: 'AMX-2024-0618', hsCode: '2941.10.00' },
  { id: 'item3', name: 'Clavulanic Acid Potassium Salt',              quantity: '50',  unit: 'กิโลกรัม', unitPrice: 980, amount: 49000, lotNo: 'CLA-2024-0091', hsCode: '2941.90.00' },
  { id: 'item4', name: 'Microcrystalline Cellulose (Excipient)',      quantity: '200', unit: 'กิโลกรัม', unitPrice: 45,  amount: 9000,  lotNo: 'MCC-2024-0210', hsCode: '3912.90.00' },
];

export function getInvoiceLineItems(_invoiceNo?: string): InvoiceLineItem[] {
  return MOCK_INVOICE_ITEMS;
}
