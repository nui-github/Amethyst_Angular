import { OcrLineItem } from '@app/core/models/types';

// Mock OCR result for the invoice-upload path — mirrors a real commercial invoice
// (medical device shipment, multiple HS codes/origins per line item)
const INVOICE_LINE_ITEMS: OcrLineItem[] = [
  { id: 'l1', name: 'Stent Graft (ETBF2313C145EE)',        hsCode: '9021.39.00', origin: 'ไอร์แลนด์ (IE)', qty: '1',   unit: 'ชิ้น' },
  { id: 'l2', name: 'Coronary Stent (TRCR30015X)',         hsCode: '9018.90.90', origin: 'ไอร์แลนด์ (IE)', qty: '39',  unit: 'ชิ้น' },
  { id: 'l3', name: 'Introducer Sheath (SENSH1628W)',      hsCode: '9018.39.90', origin: 'ไอร์แลนด์ (IE)', qty: '29',  unit: 'ชิ้น' },
  { id: 'l4', name: 'Balloon Catheter (SPL20015X)',        hsCode: '9018.39.90', origin: 'เม็กซิโก (MX)',  qty: '189', unit: 'ชิ้น' },
  { id: 'l5', name: 'Drug-Coated Balloon (SBI06012013P)',  hsCode: '9018.39.90', origin: 'ไอร์แลนด์ (IE)', qty: '1',   unit: 'ชิ้น' },
  { id: 'l6', name: 'Balloon Catheter (SPL30020X)',        hsCode: '9018.39.90', origin: 'เม็กซิโก (MX)',  qty: '1',   unit: 'ชิ้น' },
];

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
};

export type InvoiceOcrResult = typeof MOCK_INVOICE_OCR_RESULT;
