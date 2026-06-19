import { LicenseFormData, SPNEntry } from '@app/core/models/types';

export const KNOWN_REFS = [
  'HTHM000000001', 'HTHM000000002', 'HTHM000000003',
  'HTHM000000004', 'HTHM000000005',
];

export const MOCK_FORM_DATA: Omit<LicenseFormData, 'ref'> = {
  declarant:       'บริษัท ไทยเทรด จำกัด',
  importer:        'บริษัท เฮลท์ฟาร์มา จำกัด',
  port:            'ท่าเรือแหลมฉบัง',
  declarationDate: '10/06/2568',
  goodsDesc:       'วัตถุดิบยา (Active Pharmaceutical Ingredient)',
  hsCode:          '2941.10.00',
  countryOrigin:   'อินเดีย',
  quantity:        '',
  unit:            'กิโลกรัม',
  licenseType:     'RGoods',
  invoiceNo:       '',
  invoiceDate:     '',
  lotNo:           '',
  uNo:             '',
};

export const MOCK_SPN_LIST: SPNEntry[] = Array.from({ length: 12 }, (_, i) => ({
  ref:       `HTHM${String(i + 1).padStart(9, '0')}`,
  customsNo: `A012-2568061${i}-0089${i + 1}`,
  importer:  i % 3 === 0 ? 'บริษัท เฮลท์ฟาร์มา จำกัด' : i % 3 === 1 ? 'บริษัท ไบโอฟาร์ม จำกัด' : 'บริษัท เมดิไทย จำกัด',
  goods:     ['Amoxicillin Trihydrate', 'Insulin (Human)', 'Paracetamol API', 'Ibuprofen', 'Metformin HCl', 'Omeprazole', 'Atorvastatin', 'Amlodipine', 'Losartan', 'Ciprofloxacin', 'Azithromycin', 'Dexamethasone'][i],
  hs:        '2941.10.00',
  origin:    ['อินเดีย', 'จีน', 'เยอรมนี'][i % 3],
  date:      `0${(i % 9) + 1}/06/2568`,
  inQueue:   false,
}));
