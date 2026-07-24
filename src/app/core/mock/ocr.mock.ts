import { INVOICE_LINE_ITEMS, INVOICE_CUSTOMS_ITEMS } from '@mock/invoice-ocr.mock';
import { CustomsDeclarationData } from '@app/core/models/types';

// Customs-declaration OCR pass reads the "เลข U" (license/permit reference number) off the
// document too — it maps to Authority[].LicenseNumber per item, not a separate top-level field.
// The invoice-only OCR pass (invoice-ocr.mock.ts) happens before this doc exists, so its items
// have no `authorities` yet; only add it here, scoped to the customs-docs path.
const CUSTOMS_DECLARATION_ITEMS = INVOICE_CUSTOMS_ITEMS.map(item => ({
  ...item,
  authorities: [{ licenseNumber: 'U-2568-00123' }],
}));

// Customs-declaration / full-upload OCR mock — shares the same per-item breakdown as the
// invoice-upload path (invoice-ocr.mock.ts) so item counts stay consistent across every flow.
// `customsDeclaration` mirrors the real LPI submission payload (DocumentControl + GoodsShipment);
// fields the OCR engine couldn't read off this particular document are simply left blank.
export const MOCK_CUSTOMS_DECLARATION: CustomsDeclarationData = {
  declarationNo:          '0110256800234567',
  referenceNumber:        '2568061000891',
  requestFactName:        'บริษัท เฮลท์ฟาร์มา จำกัด',
  controlAgencyOfficeCode: '00501',
  companyTaxNumber:       '0105558012345',
  companyBranch:          '0',
  companyName:            'บริษัท เฮลท์ฟาร์มา จำกัด (HealthPharma Co., Ltd.)',
  attorneyIdCard:         '1102003456789',
  arrivalDate:            '2025-06-10',
  departureDate:          '',              // ไม่พบในเอกสาร — ทิ้งว่างไว้
  licenseType:            'I',
  vesselName:             '',              // ไม่พบในใบขน — ทิ้งว่างไว้
  consignmentCountry:     'IE',
  destinationCountry:     'TH',
  portDischargeCode:      '1001',
  portLoadCode:           '2010',
  controlDischargePort:   'THLCH',
  controlReleasePort:     'THLCH',
  informantIdCard:        '1102003456789',
  informantName:          'นายสมชาย ใจดี',
  registrationId:         'REG-LPI-0105558012345',
  items: CUSTOMS_DECLARATION_ITEMS,
};

export const MOCK_OCR_RESULT = {
  invoiceNo:       'INV-2024-8834',
  invoiceDate:     '05/06/2568',
  importDate:      '10/06/2568',
  declarationDate: '10/06/2568',
  quantity:        '260',
  qtyUnit:         'ชิ้น',
  lotNo:           'LOT-2024-567',
  uNo:             'U-2568-00123',
  importer:        'บริษัท เฮลท์ฟาร์มา จำกัด',
  declarant:       'บริษัท ไทยเทรด โลจิสติกส์ จำกัด',
  goodsDesc:       'อุปกรณ์การแพทย์และอุปกรณ์กิจการปิโตรเลียม (Medical Devices & Petroleum Equipment) — Wellhead Valve / Coronary Stent / Drill Bit / Balloon Catheter',
  port:            'ท่าเรือแหลมฉบัง',
  hsCode:          '9018.39.90',
  countryOrigin:   'นอร์เวย์ (NO) / ไอร์แลนด์ (IE) / สหรัฐอเมริกา (US) / เม็กซิโก (MX)',
  licenseType:     'เครื่องมือแพทย์',
  drugRegNo:       '',
  lineItems:       INVOICE_LINE_ITEMS,
  customsDeclaration: MOCK_CUSTOMS_DECLARATION,
};

export type OcrResult = typeof MOCK_OCR_RESULT;
