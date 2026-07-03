import { OcrLineItem } from '@app/core/models/types';

const OCR_LINE_ITEMS: OcrLineItem[] = [
  { id: 'o1', name: 'Amoxicillin Trihydrate (Lot LOT-2024-567)', hsCode: '2941.10.00', origin: 'อินเดีย', qty: '150', unit: 'กิโลกรัม' },
  { id: 'o2', name: 'Ampicillin Sodium (Lot LOT-2024-568)',      hsCode: '2941.10.00', origin: 'อินเดีย', qty: '70',  unit: 'กิโลกรัม' },
  { id: 'o3', name: 'Clavulanic Acid Potassium Salt',            hsCode: '2941.90.00', origin: 'อินเดีย', qty: '30',  unit: 'กิโลกรัม' },
];

export const MOCK_OCR_RESULT = {
  invoiceNo:       'INV-2024-8834',
  invoiceDate:     '05/06/2568',
  importDate:      '10/06/2568',
  declarationDate: '10/06/2568',
  quantity:        '250',
  unit:            'กิโลกรัม',
  lotNo:           'LOT-2024-567',
  uNo:             'U-2568-00123',
  importer:        'บริษัท เฮลท์ฟาร์มา จำกัด',
  declarant:       'บริษัท ไทยเทรด โลจิสติกส์ จำกัด',
  goodsDesc:       'วัตถุดิบยา (Active Pharmaceutical Ingredient) — Amoxicillin Trihydrate',
  port:            'ท่าเรือแหลมฉบัง',
  hsCode:          '2941.10.00',
  countryOrigin:   'อินเดีย',
  licenseType:     'RGoods',
  drugRegNo:       'G 40/61 (N)',
  lineItems:       OCR_LINE_ITEMS,
};

export type OcrResult = typeof MOCK_OCR_RESULT;
