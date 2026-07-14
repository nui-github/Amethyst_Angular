import { OcrLineItem, CustomsDeclarationItem, CustomsDeclarationData } from '@app/core/models/types';

// Mock OCR result for the export-upload "เริ่มจาก Invoice" path — mirrors invoice-ocr.mock.ts but
// for outbound goods. Item set spans the 3 export-control agencies this flow launches with
// (กรมควบคุมโรค / เชื้อเพลิง / การยาง — see export-product-classification.mock.ts, step 2), plus one
// item needing no permit, so item-hs-analysis has the same group variety as the import side.
export const EXPORT_INVOICE_LINE_ITEMS: OcrLineItem[] = [
  { id: 'e1', name: 'RSS3 Smoked Rubber Sheet (ยางแผ่นรมควันชั้น 3)', hsCode: '4001.21.00', origin: 'ระยอง (TH)', qty: '20000', unit: 'กก.' },
  { id: 'e2', name: 'Industrial Fuel Oil (น้ำมันเตาอุตสาหกรรม)',       hsCode: '2710.19.51', origin: 'ชลบุรี (TH)', qty: '5000',  unit: 'ลิตร' },
  { id: 'e3', name: 'Pathogen Diagnostic Reagent Kit (ชุดน้ำยาตรวจวินิจฉัยเชื้อโรค)', hsCode: '3822.00.00', origin: 'ปทุมธานี (TH)', qty: '500', unit: 'กล่อง' },
  { id: 'e4', name: 'Rubber Compound Sheet (ยางแผ่นผสม)',              hsCode: '4005.10.00', origin: 'สงขลา (TH)', qty: '3000',  unit: 'กก.' },
];

export const EXPORT_INVOICE_CUSTOMS_ITEMS: CustomsDeclarationItem[] = [
  {
    itemNumber: 1, invoiceNo: 'EXPINV0009', invoiceDate: '2025-05-12', invoiceItemNumber: 1, declarationLineNumber: 1,
    nameTh: 'ยางแผ่นรมควันชั้น 3', nameEn: 'RSS3 Smoked Rubber Sheet',
    tariffCode: '4001210000', quantity: '20000', quantityUnit: 'กก.',
    netWeight: '20000.000', netWeightUnit: 'KGM', packageAmount: '400', packageUnit: 'BALE',
    originCountry: 'ไทย (TH)', purchaseCountry: 'จีน (CN)',
    invoiceAmountForeign: '48000.00', currencyCode: 'USD', invoiceAmountBaht: '1704000.00',
    manufacture: 'สหกรณ์กองทุนสวนยางระยอง จำกัด, ระยอง',
    remark: 'ส่งออกเพื่อจำหน่ายในอุตสาหกรรมยางล้อ',
    productions: [{ lotNo: 'RSS3-2568-090', mfgDate: '01-05-2568', measurement: '20000', measurementUnit: 'กก.', quantity: '20000', quantityUnit: 'กก.' }],
  },
  {
    itemNumber: 2, invoiceNo: 'EXPINV0009', invoiceDate: '2025-05-12', invoiceItemNumber: 2, declarationLineNumber: 2,
    nameTh: 'น้ำมันเตาอุตสาหกรรม', nameEn: 'Industrial Fuel Oil',
    tariffCode: '2710195100', quantity: '5000', quantityUnit: 'ลิตร',
    netWeight: '4250.000', netWeightUnit: 'KGM', packageAmount: '1', packageUnit: 'TANK',
    originCountry: 'ไทย (TH)', purchaseCountry: 'สิงคโปร์ (SG)',
    invoiceAmountForeign: '3200.00', currencyCode: 'USD', invoiceAmountBaht: '113900.00',
    manufacture: 'โรงกลั่นน้ำมันศรีราชา, ชลบุรี',
    certificateAnalysis: 'COA-FUEL-2568-021',
    productions: [{ lotNo: 'FO-2568-021', mfgDate: '05-05-2568', measurement: '5000', measurementUnit: 'ลิตร', quantity: '5000', quantityUnit: 'ลิตร' }],
  },
  {
    itemNumber: 3, invoiceNo: 'EXPINV0009', invoiceDate: '2025-05-12', invoiceItemNumber: 3, declarationLineNumber: 3,
    nameTh: 'ชุดน้ำยาตรวจวินิจฉัยเชื้อโรค', nameEn: 'Pathogen Diagnostic Reagent Kit',
    tariffCode: '3822000000', quantity: '500', quantityUnit: 'กล่อง',
    netWeight: '250.000', netWeightUnit: 'KGM', packageAmount: '25', packageUnit: 'CTN',
    originCountry: 'ไทย (TH)', purchaseCountry: 'ญี่ปุ่น (JP)',
    invoiceAmountForeign: '15000.00', currencyCode: 'USD', invoiceAmountBaht: '533600.00',
    manufacture: 'บริษัท ไบโอเทค ไดแอกโนสติกส์ จำกัด, ปทุมธานี',
    certificateAnalysis: 'COA-BIO-2568-014',
    productions: [{ lotNo: 'BIO-2568-014', mfgDate: '10-05-2568', expDate: '10-05-2570', measurement: '500', measurementUnit: 'กล่อง', quantity: '500', quantityUnit: 'กล่อง' }],
  },
  {
    itemNumber: 4, invoiceNo: 'EXPINV0009', invoiceDate: '2025-05-12', invoiceItemNumber: 4, declarationLineNumber: 4,
    nameTh: 'ยางแผ่นผสม', nameEn: 'Rubber Compound Sheet',
    tariffCode: '4005100000', quantity: '3000', quantityUnit: 'กก.',
    netWeight: '3000.000', netWeightUnit: 'KGM', packageAmount: '60', packageUnit: 'BALE',
    originCountry: 'ไทย (TH)', purchaseCountry: 'จีน (CN)',
    invoiceAmountForeign: '4500.00', currencyCode: 'USD', invoiceAmountBaht: '159800.00',
    manufacture: 'บริษัท สงขลารับเบอร์ จำกัด, สงขลา',
  },
];

const MOCK_EXPORT_INVOICE_CUSTOMS_DECLARATION: CustomsDeclarationData = {
  // A commercial (export) invoice alone doesn't carry a customs-declaration header — only the
  // reference/company fields OCR can cross-read off the invoice itself get filled in; the rest is
  // left blank until an actual export declaration (ใบขนส่งออก) is filed for this shipment.
  referenceNumber:        '',
  requestFactName:        'บริษัท สยามอกริ เอ็กซ์ปอร์ต จำกัด',
  controlAgencyOfficeCode: '',
  companyTaxNumber:       '',
  companyBranch:          '',
  companyName:            'บริษัท สยามอกริ เอ็กซ์ปอร์ต จำกัด (Siam Agri Export Co., Ltd.)',
  attorneyIdCard:         '',
  arrivalDate:            '',
  departureDate:          '',
  licenseType:            '',
  consignmentCountry:     'TH',
  destinationCountry:     '',
  portDischargeCode:      '',
  portLoadCode:           '',
  controlDischargePort:   '',
  controlReleasePort:     '',
  informantIdCard:        '',
  informantName:          '',
  registrationId:         '',
  items: EXPORT_INVOICE_CUSTOMS_ITEMS,
};

export const MOCK_EXPORT_INVOICE_OCR_RESULT = {
  invoiceNo:       'EXPINV0009',
  invoiceDate:     '12/05/2025',
  importDate:      '',
  declarationDate: '',
  quantity:        '28500',
  qtyUnit:         'กก.',
  lotNo:           'HOUSE-EXP-0091',
  uNo:             '',
  importer:        'บริษัท สยามอกริ เอ็กซ์ปอร์ต จำกัด',
  declarant:       'NETBAY PUBLIC COMPANY LIMITED',
  goodsDesc:       'ยางพารา / น้ำมันเชื้อเพลิง / ชุดตรวจวินิจฉัยทางการแพทย์ (Rubber / Fuel Oil / Diagnostic Reagents)',
  port:            'ท่าเรือแหลมฉบัง (LCH)',
  hsCode:          '4001.21.00',
  countryOrigin:   'ไทย (TH)',
  licenseType:     '',
  drugRegNo:       '',
  lineItems:       EXPORT_INVOICE_LINE_ITEMS,
  customsDeclaration: MOCK_EXPORT_INVOICE_CUSTOMS_DECLARATION,
};

export type ExportInvoiceOcrResult = typeof MOCK_EXPORT_INVOICE_OCR_RESULT;
