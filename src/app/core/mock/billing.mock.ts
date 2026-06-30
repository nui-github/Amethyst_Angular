// replace with real billing data → GET /billing/months + GET /billing/months/:monthKey

export interface BillingLicenseItem {
  id: string;
  refNo: string;       // เลขอ้างอิงใบอนุญาต
  goods: string;
  agency: string;       // display label e.g. "อย.", "กษ."
  formCode: string;     // RGoods
  submittedAt: string;  // display date dd/mm/yyyy
  fee: number;           // 0 = ฟรี
}

export interface BillingMonth {
  monthKey: string;     // "2569-06"
  monthLabel: string;   // "มิถุนายน 2569"
  items: BillingLicenseItem[];
}

export const MOCK_BILLING: BillingMonth[] = [
  {
    monthKey: '2569-06',
    monthLabel: 'มิถุนายน 2569',
    items: [
      { id: 'b1', refNo: 'RG-2568-20188', goods: 'Glyphosate Technical', agency: 'กษ.', formCode: 'RGoods', submittedAt: '29/06/2569', fee: 500 },
      { id: 'b2', refNo: 'RG-2568-31728', goods: 'Ethanol 99.5%', agency: 'วอ.', formCode: 'RGoods', submittedAt: '29/06/2569', fee: 0 },
      { id: 'b3', refNo: 'RG-2568-18820', goods: 'Zinc Oxide', agency: 'อย.', formCode: 'RGoods', submittedAt: '28/06/2569', fee: 0 },
      { id: 'b4', refNo: 'RG-2568-09005', goods: 'Magnesium Stearate', agency: 'อย.', formCode: 'RGoods', submittedAt: '28/06/2569', fee: 0 },
    ],
  },
  {
    monthKey: '2569-05',
    monthLabel: 'พฤษภาคม 2569',
    items: [
      { id: 'b5', refNo: 'RG-2568-04412', goods: 'Sodium Benzoate', agency: 'อย.', formCode: 'RGoods', submittedAt: '14/05/2569', fee: 0 },
      { id: 'b6', refNo: 'RG-2568-07733', goods: 'Paraquat Dichloride', agency: 'กษ.', formCode: 'RGoods', submittedAt: '08/05/2569', fee: 500 },
      { id: 'b7', refNo: 'RG-2568-02290', goods: 'Acetone (Industrial Grade)', agency: 'วอ.', formCode: 'RGoods', submittedAt: '02/05/2569', fee: 0 },
    ],
  },
  {
    monthKey: '2569-04',
    monthLabel: 'เมษายน 2569',
    items: [
      { id: 'b8', refNo: 'RG-2568-99102', goods: 'Vitamin B12 Powder', agency: 'อย.', formCode: 'RGoods', submittedAt: '21/04/2569', fee: 0 },
      { id: 'b9', refNo: 'RG-2568-88341', goods: 'Imidacloprid Technical', agency: 'กษ.', formCode: 'RGoods', submittedAt: '11/04/2569', fee: 500 },
    ],
  },
];

export function monthTotal(month: BillingMonth): number {
  return month.items.reduce((sum, i) => sum + i.fee, 0);
}

export function monthPaidCount(month: BillingMonth): number {
  return month.items.filter(i => i.fee > 0).length;
}

export function monthFreeCount(month: BillingMonth): number {
  return month.items.filter(i => i.fee === 0).length;
}
