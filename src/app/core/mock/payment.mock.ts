export interface AgencyPaymentConfig {
  requiresFee: boolean;
  amount: number;   // THB
  note?: string;    // display note e.g. "ต่อใบอนุญาต"
}

// อย. (FDA) — LPI ไม่มีค่าธรรมเนียม
// กษ. — ใบรับรองสุขอนามัยพืช มีค่าธรรมเนียมตรวจสอบ
// ปส. — ตรวจสอบเครื่องมือแพทย์ที่ผ่านการฉายรังสี มีค่าธรรมเนียมตรวจสอบ
// กรมประมง — มีค่าธรรมเนียมใบอนุญาตนำเข้า
// กรมปศุสัตว์ — มีค่าธรรมเนียมใบอนุญาต
export const AGENCY_PAYMENT: Record<string, AgencyPaymentConfig> = {
  'อย.':      { requiresFee: false, amount: 0,    note: 'ไม่มีค่าธรรมเนียม' },
  'กษ.':      { requiresFee: true,  amount: 500,  note: 'ค่าตรวจสอบสุขอนามัย' },
  'ปส.':      { requiresFee: true,  amount: 800,  note: 'ค่าตรวจสอบเครื่องกำเนิดรังสี' },
  'กรมประมง': { requiresFee: true,  amount: 200,  note: 'ต่อใบอนุญาตนำเข้า' },
  'กรมปศุสัตว์': { requiresFee: true, amount: 300, note: 'ต่อใบอนุญาต' },
};

export function getAgencyPayment(agency: string): AgencyPaymentConfig {
  return AGENCY_PAYMENT[agency] ?? { requiresFee: false, amount: 0 };
}
