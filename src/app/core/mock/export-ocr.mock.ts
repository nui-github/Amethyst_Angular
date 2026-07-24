import { EXPORT_INVOICE_LINE_ITEMS, EXPORT_INVOICE_CUSTOMS_ITEMS } from '@mock/export-invoice-ocr.mock';
import { CustomsDeclarationData } from '@app/core/models/types';

// ใบขนส่งออก (export declaration) OCR pass reads the full DocumentControl header a plain
// commercial invoice can't carry — mirrors ocr.mock.ts on the import side. Shares the same
// per-item breakdown as the export-invoice path so item counts stay consistent across flows.
const EXPORT_CUSTOMS_DECLARATION_ITEMS = EXPORT_INVOICE_CUSTOMS_ITEMS.map(item => ({
  ...item,
  authorities: [{ licenseNumber: 'EXU-2568-00456' }],
}));

export const MOCK_EXPORT_CUSTOMS_DECLARATION: CustomsDeclarationData = {
  declarationNo:          '0302256800198734',
  referenceNumber:        '2568051200734',
  requestFactName:        'บริษัท สยามอกริ เอ็กซ์ปอร์ต จำกัด',
  controlAgencyOfficeCode: '00302',
  companyTaxNumber:       '0105561234567',
  companyBranch:          '0',
  companyName:            'บริษัท สยามอกริ เอ็กซ์ปอร์ต จำกัด (Siam Agri Export Co., Ltd.)',
  attorneyIdCard:         '1103005678901',
  arrivalDate:            '',              // ไม่พบในเอกสาร — ทิ้งว่างไว้
  departureDate:          '2025-05-15',
  licenseType:             'E',
  vesselName:              'EVER GIVEN V.088E',
  consignmentCountry:     'TH',
  destinationCountry:     'CN',
  portDischargeCode:      '',
  portLoadCode:            '3040',
  controlDischargePort:   '',
  controlReleasePort:     'THLCH',
  informantIdCard:        '1103005678901',
  informantName:          'นางสาวพิมพ์ชนก ส่งดี',
  registrationId:         'REG-LPE-0105561234567',
  items: EXPORT_CUSTOMS_DECLARATION_ITEMS,
};

export const MOCK_EXPORT_OCR_RESULT = {
  invoiceNo:       'EXP-2025-3312',
  invoiceDate:     '12/05/2568',
  importDate:      '',
  declarationDate: '15/05/2568',
  quantity:        '28500',
  qtyUnit:         'กก.',
  lotNo:           'LOT-EXP-2568-090',
  uNo:             'EXU-2568-00456',
  importer:        'บริษัท สยามอกริ เอ็กซ์ปอร์ต จำกัด',
  declarant:       'บริษัท ไทยเทรด โลจิสติกส์ จำกัด',
  goodsDesc:       'ยางพารา / น้ำมันเชื้อเพลิง / ชุดตรวจวินิจฉัยทางการแพทย์ (Rubber / Fuel Oil / Diagnostic Reagents)',
  port:            'ท่าเรือแหลมฉบัง',
  hsCode:          '4001.21.00',
  countryOrigin:   'ไทย (TH)',
  licenseType:     'ยางพารา/เชื้อเพลิง/เวชภัณฑ์',
  drugRegNo:       '',
  lineItems:       EXPORT_INVOICE_LINE_ITEMS,
  customsDeclaration: MOCK_EXPORT_CUSTOMS_DECLARATION,
};

export type ExportOcrResult = typeof MOCK_EXPORT_OCR_RESULT;
