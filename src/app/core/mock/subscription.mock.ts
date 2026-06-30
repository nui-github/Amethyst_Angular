// replace with real subscription data → GET /subscription/plan, GET /subscription/payment-method, GET /subscription/invoices

export interface SubscriptionPlan {
  name: string;
  priceMonthly: number;
  billingCycle: 'monthly' | 'yearly';
  licenseQuota: number;     // ใบอนุญาตที่รวมอยู่ในแพ็กเกจต่อเดือน
  licenseUsed: number;
  features: string[];
}

export const CURRENT_PLAN: SubscriptionPlan = {
  name: 'Business',
  priceMonthly: 2900,
  billingCycle: 'monthly',
  licenseQuota: 20,
  licenseUsed: 9,
  features: [
    'ขอใบอนุญาตได้ไม่จำกัดประเภท',
    'OCR วิเคราะห์เอกสารอัตโนมัติ',
    'เชื่อมต่อ ShippingNet ได้ไม่จำกัดจำนวนบัญชี',
    'ทีมงาน 5 ผู้ใช้',
  ],
};

export interface PaymentMethod {
  type: 'credit_card' | 'bank_transfer';
  brand?: string;     // 'Visa' | 'Mastercard'
  last4?: string;
  expiry?: string;     // MM/YY
  bankName?: string;
}

export const PAYMENT_METHOD: PaymentMethod = {
  type: 'credit_card',
  brand: 'Visa',
  last4: '4242',
  expiry: '08/27',
};

export interface BillingAddress {
  companyName: string;
  taxId: string;          // เลขประจำตัวผู้เสียภาษี
  branch: string;         // สำนักงานใหญ่ / สาขาที่ xxx
  address: string;
  subDistrict: string;    // แขวง/ตำบล
  district: string;       // เขต/อำเภอ
  province: string;
  postalCode: string;
}

export const BILLING_ADDRESS: BillingAddress = {
  companyName: 'บริษัท เฮลท์ฟาร์มา จำกัด',
  taxId: '0105561000123',
  branch: 'สำนักงานใหญ่',
  address: '123/45 อาคารเนทเบย์ ชั้น 8 ถนนสุขุมวิท',
  subDistrict: 'คลองตันเหนือ',
  district: 'วัฒนา',
  province: 'กรุงเทพมหานคร',
  postalCode: '10110',
};

export interface TokenUsage {
  monthLabel: string;     // "มิถุนายน 2569"
  quota: number;          // โควต้า token ต่อเดือนตามแพ็กเกจ เช่น 1,000,000
  used: number;           // ใช้ไปแล้วในเดือนนี้
  resetsAt: string;       // วันที่โควต้ารีเซ็ตรอบถัดไป dd/mm/yyyy
}

export const TOKEN_USAGE: TokenUsage = {
  monthLabel: 'มิถุนายน 2569',
  quota: 1_000_000,
  used: 612_400,
  resetsAt: '01/07/2569',
};

export interface InvoiceRecord {
  id: string;
  invoiceNo: string;
  period: string;       // "มิถุนายน 2569"
  issuedAt: string;      // dd/mm/yyyy
  amount: number;
  status: 'paid' | 'pending';
}

export const MOCK_INVOICES: InvoiceRecord[] = [
  { id: 'inv1', invoiceNo: 'INV-2569-06', period: 'มิถุนายน 2569', issuedAt: '01/07/2569', amount: 3400, status: 'paid' },
  { id: 'inv2', invoiceNo: 'INV-2569-05', period: 'พฤษภาคม 2569', issuedAt: '01/06/2569', amount: 3400, status: 'paid' },
  { id: 'inv3', invoiceNo: 'INV-2569-04', period: 'เมษายน 2569', issuedAt: '01/05/2569', amount: 3400, status: 'paid' },
];
