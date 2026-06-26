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
};

export type OcrResult = typeof MOCK_OCR_RESULT;
