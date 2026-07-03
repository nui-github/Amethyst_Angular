import { INVOICE_LINE_ITEMS } from '@mock/invoice-ocr.mock';

// Customs-declaration / full-upload OCR mock — shares the same per-item breakdown as the
// invoice-upload path (invoice-ocr.mock.ts) so item counts stay consistent across every flow
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
  goodsDesc:       'อุปกรณ์การแพทย์ (Medical Devices) — Stent / Balloon Catheter / Introducer Sheath',
  port:            'ท่าเรือแหลมฉบัง',
  hsCode:          '9018.39.90',
  countryOrigin:   'ไอร์แลนด์ (IE) / เม็กซิโก (MX)',
  licenseType:     'เครื่องมือแพทย์',
  drugRegNo:       '',
  lineItems:       INVOICE_LINE_ITEMS,
};

export type OcrResult = typeof MOCK_OCR_RESULT;
