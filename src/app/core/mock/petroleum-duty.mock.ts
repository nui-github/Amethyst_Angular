import { InvoiceLineItem, PetroleumDutyDeclarationData, PetroleumEquipmentItem, PetroleumOcrResultsData } from '@app/core/models/types';

// วัสดุ/อุปกรณ์สำหรับกิจการปิโตรเลียม (ขุดเจาะ/ผลิต) — มาตรา 70 พ.ร.บ.ปิโตรเลียม พ.ศ. 2514 ยกเว้น
// อากรนำเข้าให้ผู้รับสัมปทาน โดยระหว่างรอหนังสือรับรองจากกรมเชื้อเพลิงธรรมชาติ (DMF) ต้องยื่น
// "คำร้องขอออกของไปก่อน" พร้อมหนังสือค้ำประกัน (privilege code 005) เพื่อรับของออกจากอารักขาศุลกากรก่อน
export const MOCK_PETROLEUM_EQUIPMENT_ITEMS: PetroleumEquipmentItem[] = [
  {
    itemNumber: 1,
    nameTh: 'ท่อกรุบ่อน้ำมัน (Casing Pipe)',
    nameEn: 'Well Casing Pipe, Seamless Steel',
    tariffCode: '7304.29.00',
    quantity: '850',
    quantityUnit: 'ท่อน',
    originCountry: 'JP',
    invoiceAmountBaht: '18,450,000',
  },
  {
    itemNumber: 2,
    nameTh: 'หัวเจาะสามง่าม (Tricone Drill Bit)',
    nameEn: 'Tricone Drill Bit',
    tariffCode: '8431.43.00',
    quantity: '24',
    quantityUnit: 'หัว',
    originCountry: 'US',
    invoiceAmountBaht: '6,120,000',
  },
  {
    itemNumber: 3,
    nameTh: 'ชุดวาล์วควบคุมหลุมเจาะ (Wellhead Christmas Tree)',
    nameEn: 'Wellhead Christmas Tree Valve Assembly',
    tariffCode: '8481.80.99',
    quantity: '6',
    quantityUnit: 'ชุด',
    originCountry: 'NO',
    invoiceAmountBaht: '24,800,000',
  },
  {
    itemNumber: 4,
    nameTh: 'ท่อผลิตปิโตรเลียม (Production Tubing)',
    nameEn: 'Production Tubing, Seamless Steel',
    tariffCode: '7304.23.00',
    quantity: '1,200',
    quantityUnit: 'ท่อน',
    originCountry: 'JP',
    invoiceAmountBaht: '14,300,000',
  },
];

// Only what a ใบขนขาเข้า OCR read could plausibly know already — เลขที่ใบขน is the one thing
// confirmed up front; the duty-exemption-specific fields (early-release request no., DMF cert,
// guarantee bond) genuinely don't exist on the customs document itself, so they're left blank for
// the user to fill in via PetroleumDeclarationEditorComponent.
export const MOCK_PETROLEUM_DUTY_DECLARATION: PetroleumDutyDeclarationData = {
  importDeclarationNo: '0109256800118842',
  importDate: '2026-07-18',
  customsHouseName: 'ท่าเรือแหลมฉบัง',
  declarationType: 'นำเข้า',

  companyName: 'บริษัท ไทยเอ็กซ์พลอเรชั่น ปิโตรเลียม จำกัด',
  companyTaxNumber: '0105568004421',
  concessionNumber: 'SW1/2568',

  // ยังไม่ทราบ ณ ตอนอัปโหลด — ต้องกรอกในหน้าต่างข้อมูลเพิ่มเติม
  earlyReleaseRequestNo: undefined,
  privilegeCode: '005',
  dmfCertificateNo: undefined,
  guaranteeNumber: undefined,
  guaranteeAmount: undefined,

  items: MOCK_PETROLEUM_EQUIPMENT_ITEMS,
};

export const MOCK_PETROLEUM_DUTY_OCR_RESULT: PetroleumOcrResultsData = {
  importDeclarationNo: MOCK_PETROLEUM_DUTY_DECLARATION.importDeclarationNo,
  companyName: MOCK_PETROLEUM_DUTY_DECLARATION.companyName,
  customsHouseName: MOCK_PETROLEUM_DUTY_DECLARATION.customsHouseName,
  itemCount: MOCK_PETROLEUM_EQUIPMENT_ITEMS.length,
  declaration: MOCK_PETROLEUM_DUTY_DECLARATION,
  declarationComplete: false,
  declarationGateRequired: true,
};

// ทั้งหมดในคำร้องนี้ยื่นให้กรมเชื้อเพลิงธรรมชาติ (DMF) เพียงกรมเดียว — ไม่มีขั้นตอนจัดกลุ่มหลายกรม
// เหมือน item-hs-analysis จึงแปลงตรงเป็น formData.selectedItems ได้เลย
export function getPetroleumEquipmentLineItems(): InvoiceLineItem[] {
  return MOCK_PETROLEUM_EQUIPMENT_ITEMS.map(i => ({
    id: `pet_${i.itemNumber}`,
    name: i.nameTh,
    quantity: i.quantity,
    unit: i.quantityUnit,
    unitPrice: 0,
    amount: Number(i.invoiceAmountBaht.replace(/,/g, '')) || 0,
    lotNo: '-',
    hsCode: i.tariffCode,
    origin: i.originCountry,
  }));
}
