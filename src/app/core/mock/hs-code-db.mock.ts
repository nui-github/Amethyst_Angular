import { HsCandidate } from '@app/core/models/types';

// Stand-in for the real พิกัดอัตราศุลกากร (HS Code) lookup database — used when a user types
// in an HS Code by hand instead of picking one of the AI-suggested candidates. Keyed by a
// normalized (digits-only) HS Code; a real backend would query the actual tariff schedule.
const HS_CODE_DB: Record<string, HsCandidate> = {
  '90189090': { hsCode: '9018.90.90', tariffCode: '9018.90.90.002', description: 'เครื่องมือแพทย์ประเภทขดลวดค้ำยันหลอดเลือด (Stent)', dutyRate: 5, confidence: 0 },
  '90213900': { hsCode: '9021.39.00', tariffCode: '9021.39.00.003', description: 'อุปกรณ์เทียมที่ใช้ฝังในหลอดเลือด', dutyRate: 0, confidence: 0 },
  '90183990': { hsCode: '9018.39.90', tariffCode: '9018.39.90.011', description: 'สายสวนหลอดเลือดหัวใจ', dutyRate: 5, confidence: 0 },
  '90199000': { hsCode: '9019.90.00', tariffCode: '9019.90.00.001', description: 'อุปกรณ์กายภาพบำบัด/เครื่องช่วยพยุงอื่นๆ', dutyRate: 10, confidence: 0 },
  '29411000': { hsCode: '2941.10.00', tariffCode: '2941.10.00.001', description: 'ยาปฏิชีวนะกลุ่มเพนิซิลลิน (วัตถุดิบ)', dutyRate: 0, confidence: 0 },
  '29419000': { hsCode: '2941.90.00', tariffCode: '2941.90.00.005', description: 'ยาปฏิชีวนะอื่นๆ (วัตถุดิบ)', dutyRate: 0, confidence: 0 },
  '39269099': { hsCode: '3926.90.99', tariffCode: '3926.90.99.014', description: 'ผลิตภัณฑ์พลาสติกอื่นๆ ที่มิได้ระบุไว้เฉพาะ', dutyRate: 10, confidence: 0 },
  // These two carry an explicit `agency` — mainly used to resolve items in the "ไม่สามารถระบุ HS
  // Code" group (item-hs-analysis.component.ts), so typing one of these in by hand also moves the
  // item into the matching department's group, not just updates its HS Code display.
  '90189095': { hsCode: '9018.90.90', tariffCode: '9018.90.90.095', description: 'เครื่องมือแพทย์สำหรับปิดแผล/วัสดุสิ้นเปลืองทางการแพทย์ควบคุม', dutyRate: 5, confidence: 0,
    agency: 'อย.', agencyFull: 'สำนักงานคณะกรรมการอาหารและยา', requiresPermit: true, licenseType: 'เครื่องมือแพทย์' },
  '30059090': { hsCode: '3005.90.90', tariffCode: '3005.90.90.020', description: 'ผ้าพันแผล/วัสดุปิดแผลทั่วไป (ไม่ควบคุม)', dutyRate: 10, confidence: 0,
    agency: '—', agencyFull: '—', requiresPermit: false },
};

/** Normalize user input (e.g. "9018.90.90", "9018 90 90", "901890 90") to a digits-only key. */
function normalize(input: string): string {
  return input.replace(/[^0-9]/g, '');
}

/** Look up an HS Code the user typed in by hand. Returns undefined if not found in the DB —
 *  in a real integration this would be a live API call to the customs tariff schedule. */
export function lookupHsCode(input: string): HsCandidate | undefined {
  const key = normalize(input);
  if (!key) return undefined;
  return HS_CODE_DB[key];
}
