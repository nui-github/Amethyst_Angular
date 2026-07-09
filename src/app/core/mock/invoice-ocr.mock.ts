import { OcrLineItem, CustomsDeclarationItem, CustomsDeclarationData } from '@app/core/models/types';

// Mock OCR result for the invoice-upload path — mirrors a real commercial invoice
// (medical device shipment, multiple HS codes/origins per line item)
export const INVOICE_LINE_ITEMS: OcrLineItem[] = [
  { id: 'l1', name: 'Stent Graft (ETBF2313C145EE)',        hsCode: '9021.39.00', origin: 'ไอร์แลนด์ (IE)', qty: '1',   unit: 'ชิ้น' },
  { id: 'l2', name: 'Coronary Stent (TRCR30015X)',         hsCode: '9018.90.90', origin: 'ไอร์แลนด์ (IE)', qty: '39',  unit: 'ชิ้น' },
  { id: 'l3', name: 'Introducer Sheath (SENSH1628W)',      hsCode: '9018.39.90', origin: 'ไอร์แลนด์ (IE)', qty: '29',  unit: 'ชิ้น' },
  { id: 'l4', name: 'Balloon Catheter (SPL20015X)',        hsCode: '9018.39.90', origin: 'เม็กซิโก (MX)',  qty: '189', unit: 'ชิ้น' },
  { id: 'l5', name: 'Drug-Coated Balloon (SBI06012013P)',  hsCode: '9018.39.90', origin: 'ไอร์แลนด์ (IE)', qty: '1',   unit: 'ชิ้น' },
  { id: 'l6', name: 'Balloon Catheter Packaging Accessory (SPL30020X)', hsCode: '3926.90.99', origin: 'เม็กซิโก (MX)', qty: '1', unit: 'ชิ้น' },
];

// Same 6 line items, but shaped like a real GoodsShipment entry from the LPI submission
// payload — richer per-item detail (net weight/packages/value/production lot/etc.), used by
// the ocr-results card's structured display + per-item detail modal. Fields the OCR engine
// couldn't read off the invoice (dangerous-goods info, license source, issuing authority) are
// left undefined — they only get filled in later, once classification/agency selection happens.
export const INVOICE_CUSTOMS_ITEMS: CustomsDeclarationItem[] = [
  {
    itemNumber: 1, invoiceNo: 'INVNO0004', invoiceDate: '2025-04-22', invoiceItemNumber: 1, declarationLineNumber: 1,
    nameTh: 'สเตนต์กราฟท์หลอดเลือด', nameEn: 'Stent Graft (ETBF2313C145EE)',
    tariffCode: '9021390000', quantity: '1', quantityUnit: 'ชิ้น',
    netWeight: '0.450', netWeightUnit: 'KGM', packageAmount: '1', packageUnit: 'BOX',
    originCountry: 'ไอร์แลนด์ (IE)', purchaseCountry: 'ไอร์แลนด์ (IE)',
    invoiceAmountForeign: '18500.00', currencyCode: 'EUR', invoiceAmountBaht: '712400.00',
    manufacture: 'Ethos Vascular Devices Ltd., Dublin, Ireland',
    remark: 'นำเข้าเพื่อจำหน่ายในโรงพยาบาลเอกชน',
    certificateAnalysis: 'COA-ETBF2313-C145EE-2568',
    location: {
      goodsCode: 'WH-HLTH-01', goodsName: 'คลังสินค้าเฮลท์ฟาร์มา (สาขาบางนา)',
      streetAndNumber: '99/1 ถนนสุขุมวิท', district: 'บางนาเหนือ', subProvince: 'บางนา',
      province: 'กรุงเทพมหานคร', postcode: '10260', phoneNumber: '02-123-4567', faxNumber: '02-123-4568',
    },
    productions: [{ lotNo: 'ETBF-2313-C145EE', mfgDate: '01-02-2568', expDate: '01-02-2571', measurement: '1', measurementUnit: 'ชิ้น', quantity: '1', quantityUnit: 'ชิ้น' }],
  },
  {
    itemNumber: 2, invoiceNo: 'INVNO0004', invoiceDate: '2025-04-22', invoiceItemNumber: 2, declarationLineNumber: 2,
    nameTh: 'ขดลวดค้ำยันหลอดเลือดหัวใจ', nameEn: 'Coronary Stent (TRCR30015X)',
    tariffCode: '9018909090', quantity: '39', quantityUnit: 'ชิ้น',
    netWeight: '3.900', netWeightUnit: 'KGM', packageAmount: '2', packageUnit: 'BOX',
    originCountry: 'ไอร์แลนด์ (IE)', purchaseCountry: 'ไอร์แลนด์ (IE)',
    invoiceAmountForeign: '429060.45', currencyCode: 'USD', invoiceAmountBaht: '15330900.00',
    manufacture: 'CardioTech Manufacturing Ltd., Cork, Ireland',
    certificateAnalysis: 'COA-TRCR30015X-2568',
    productions: [{ lotNo: 'TRCR30015X', mfgDate: '15-01-2568', expDate: '15-01-2571', measurement: '39', measurementUnit: 'ชิ้น', quantity: '39', quantityUnit: 'ชิ้น' }],
  },
  {
    itemNumber: 3, invoiceNo: 'INVNO0004', invoiceDate: '2025-04-22', invoiceItemNumber: 3, declarationLineNumber: 3,
    nameTh: 'อุปกรณ์นำสายสวนหลอดเลือด', nameEn: 'Introducer Sheath (SENSH1628W)',
    tariffCode: '9018399090', quantity: '29', quantityUnit: 'ชิ้น',
    netWeight: '2.100', netWeightUnit: 'KGM', packageAmount: '2', packageUnit: 'BOX',
    originCountry: 'ไอร์แลนด์ (IE)', purchaseCountry: 'ไอร์แลนด์ (IE)',
    invoiceAmountForeign: '84300.00', currencyCode: 'USD', invoiceAmountBaht: '3011300.00',
    manufacture: 'Ethos Vascular Devices Ltd., Dublin, Ireland',
    certificateAnalysis: 'COA-SENSH1628W-2568',
    productions: [{ lotNo: 'SENSH1628W', mfgDate: '20-01-2568', expDate: '20-01-2571', measurement: '29', measurementUnit: 'ชิ้น', quantity: '29', quantityUnit: 'ชิ้น' }],
  },
  {
    itemNumber: 4, invoiceNo: 'INVNO0004', invoiceDate: '2025-04-22', invoiceItemNumber: 4, declarationLineNumber: 4,
    nameTh: 'สายสวนขยายหลอดเลือดด้วยบอลลูน', nameEn: 'Balloon Catheter (SPL20015X)',
    tariffCode: '9018399090', quantity: '189', quantityUnit: 'ชิ้น',
    netWeight: '18.900', netWeightUnit: 'KGM', packageAmount: '8', packageUnit: 'BOX',
    originCountry: 'เม็กซิโก (MX)', purchaseCountry: 'เม็กซิโก (MX)',
    invoiceAmountForeign: '371625.03', currencyCode: 'USD', invoiceAmountBaht: '13268400.00',
    manufacture: 'MedFlow Manufacturing S.A., Tijuana, Mexico',
    certificateAnalysis: 'COA-SPL20015X-2568',
    productions: [{ lotNo: 'SPL20015X', mfgDate: '10-02-2568', expDate: '10-02-2571', measurement: '189', measurementUnit: 'ชิ้น', quantity: '189', quantityUnit: 'ชิ้น' }],
  },
  {
    itemNumber: 5, invoiceNo: 'INVNO0004', invoiceDate: '2025-04-22', invoiceItemNumber: 5, declarationLineNumber: 5,
    nameTh: 'บอลลูนเคลือบยาขยายหลอดเลือด', nameEn: 'Drug-Coated Balloon (SBI06012013P)',
    tariffCode: '9018399090', quantity: '1', quantityUnit: 'ชิ้น',
    netWeight: '0.100', netWeightUnit: 'KGM', packageAmount: '1', packageUnit: 'BOX',
    originCountry: 'ไอร์แลนด์ (IE)', purchaseCountry: 'ไอร์แลนด์ (IE)',
    invoiceAmountForeign: '5246.59', currencyCode: 'USD', invoiceAmountBaht: '187300.00',
    manufacture: 'Ethos Vascular Devices Ltd., Dublin, Ireland',
    certificateAnalysis: 'COA-SBI06012013P-2568',
    productions: [{ lotNo: 'SBI06012013P', mfgDate: '05-02-2568', expDate: '05-02-2571', measurement: '1', measurementUnit: 'ชิ้น', quantity: '1', quantityUnit: 'ชิ้น' }],
  },
  {
    itemNumber: 6, invoiceNo: 'INVNO0004', invoiceDate: '2025-04-22', invoiceItemNumber: 6, declarationLineNumber: 6,
    nameTh: 'อุปกรณ์บรรจุภัณฑ์เสริมสำหรับสายสวนบอลลูน', nameEn: 'Balloon Catheter Packaging Accessory (SPL30020X)',
    tariffCode: '3926909914', quantity: '1', quantityUnit: 'ชิ้น',
    netWeight: '0.050', netWeightUnit: 'KGM', packageAmount: '1', packageUnit: 'BOX',
    originCountry: 'เม็กซิโก (MX)', purchaseCountry: 'เม็กซิโก (MX)',
    invoiceAmountForeign: '620.00', currencyCode: 'USD', invoiceAmountBaht: '22100.00',
    manufacture: 'MedFlow Manufacturing S.A., Tijuana, Mexico',
  },
];

export const MOCK_INVOICE_CUSTOMS_DECLARATION: CustomsDeclarationData = {
  // A commercial invoice alone doesn't carry a customs-declaration header — only the
  // reference/company fields OCR can cross-read off the invoice itself get filled in;
  // the rest is left blank until a customs declaration is actually filed for this shipment.
  referenceNumber:        '',
  requestFactName:        'TEST COMPANY LIMITED',
  controlAgencyOfficeCode: '',
  companyTaxNumber:       '',
  companyBranch:          '',
  companyName:            'TEST COMPANY LIMITED',
  attorneyIdCard:         '',
  arrivalDate:            '',
  departureDate:          '',
  licenseType:            '',
  vesselName:             '',
  consignmentCountry:     'IE',
  destinationCountry:     'TH',
  portDischargeCode:      '',
  portLoadCode:           '',
  controlDischargePort:   'THBKK',
  controlReleasePort:     '',
  informantIdCard:        '',
  informantName:          '',
  registrationId:         '',
  items: INVOICE_CUSTOMS_ITEMS,
};

export const MOCK_INVOICE_OCR_RESULT = {
  invoiceNo:       'INVNO0004',
  invoiceDate:     '22/04/2025',
  importDate:      '',
  declarationDate: '',
  quantity:        '260',
  qtyUnit:         'ชิ้น',
  lotNo:           'HOUSE06002',
  uNo:             'MASTER20260605',
  importer:        'TEST COMPANY LIMITED',
  declarant:       'NETBAY PUBLIC COMPANY LIMITED',
  goodsDesc:       'อุปกรณ์การแพทย์ (Medical Devices) — Stent / Balloon Catheter / Introducer Sheath',
  port:            'ท่าเรือกรุงเทพ (BKK)',
  hsCode:          '9018.39.90',
  countryOrigin:   'ไอร์แลนด์ (IE) / เม็กซิโก (MX)',
  licenseType:     '',
  drugRegNo:       '',
  lineItems:       INVOICE_LINE_ITEMS,
  customsDeclaration: MOCK_INVOICE_CUSTOMS_DECLARATION,
};

export type InvoiceOcrResult = typeof MOCK_INVOICE_OCR_RESULT;
