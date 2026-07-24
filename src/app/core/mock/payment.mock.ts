export interface AgencyPaymentConfig {
  requiresFee: boolean;
  amount: number;   // THB
  note?: string;    // display note e.g. "ต่อใบอนุญาต"
}

// อย. (FDA) — LPI ไม่มีค่าธรรมเนียม
// กษ. — ใบรับรองสุขอนามัยพืช มีค่าธรรมเนียมตรวจสอบ
// กรมประมง — มีค่าธรรมเนียมใบอนุญาตนำเข้า
// กรมปศุสัตว์ — มีค่าธรรมเนียมใบอนุญาต
export const AGENCY_PAYMENT: Record<string, AgencyPaymentConfig> = {
  'อย.':      { requiresFee: false, amount: 0,    note: 'ไม่มีค่าธรรมเนียม' },
  'กษ.':      { requiresFee: true,  amount: 500,  note: 'ค่าตรวจสอบสุขอนามัย' },
  'กรมประมง': { requiresFee: true,  amount: 200,  note: 'ต่อใบอนุญาตนำเข้า' },
  'กรมปศุสัตว์': { requiresFee: true, amount: 300, note: 'ต่อใบอนุญาต' },
  // Export-path agencies (see 'Export path' in CLAUDE.md)
  'กรมควบคุมโรค': { requiresFee: true,  amount: 1000, note: 'ค่าตรวจสอบเชื้อโรคและพิษจากสัตว์' },
  'การยาง':       { requiresFee: false, amount: 0,    note: 'ไม่มีค่าธรรมเนียม (ใบอนุญาตค้ายาง)' },
  // Petroleum duty-exemption path (both the import product-hs-analysis group and the standalone
  // customs-docs flow key off the same real DMF department) — ยกเว้นอากรตามมาตรา 70 พ.ร.บ.ปิโตรเลียม,
  // ไม่มีค่าธรรมเนียม LPI
  'เชื้อเพลิง':             { requiresFee: false, amount: 0, note: 'ยกเว้นอากรตามมาตรา 70 พ.ร.บ.ปิโตรเลียม — ไม่มีค่าธรรมเนียม' },
  'กรมเชื้อเพลิงธรรมชาติ': { requiresFee: false, amount: 0, note: 'ยกเว้นอากรตามมาตรา 70 พ.ร.บ.ปิโตรเลียม — ไม่มีค่าธรรมเนียม' },
};

export function getAgencyPayment(agency: string): AgencyPaymentConfig {
  return AGENCY_PAYMENT[agency] ?? { requiresFee: false, amount: 0 };
}
