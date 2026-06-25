import { HsAnalysisData } from '@app/core/models/types';

// Mock HS Code rules — key: HS prefix, value: analysis
const HS_RULES: Record<string, Omit<HsAnalysisData, 'hsCode' | 'confidence'>> = {
  '2941': {
    goodsName: 'ยาปฏิชีวนะ / วัตถุดิบยา',
    description: 'จัดเป็นวัตถุดิบยาปฏิชีวนะ → ต้องขออนุญาตนำเข้าจาก 2 หน่วยงาน: อย. (ใบอนุญาตวัตถุดิบยา RGoods) และ กษ. (ใบรับรองสุขอนามัยพืช)',
    requiresPermit: true,
    direction: 'import',
    agency: 'อย.',
    agencyFull: 'สำนักงานคณะกรรมการอาหารและยา (อย.)',
    licenseType: 'RGoods',
    legalRef: 'พ.ร.บ. ยา พ.ศ. 2510 มาตรา 15',
    agencies: [
      { code: 'อย.', full: 'สำนักงานคณะกรรมการอาหารและยา', licenseType: 'RGoods', legalRef: 'พ.ร.บ. ยา พ.ศ. 2510 มาตรา 15' },
      { code: 'กษ.', full: 'กรมวิชาการเกษตร', licenseType: 'ใบรับรองสุขอนามัยพืช', legalRef: 'พ.ร.บ. กักพืช พ.ศ. 2507' },
    ],
  },
  '3004': {
    goodsName: 'ยาสำเร็จรูป',
    description: 'จัดเป็นยาสำเร็จรูป → ต้องขออนุญาตนำเข้าและขึ้นทะเบียนยา จาก อย.',
    requiresPermit: true,
    direction: 'import',
    agency: 'อย.',
    agencyFull: 'สำนักงานคณะกรรมการอาหารและยา (อย.)',
    licenseType: 'RGoods',
    legalRef: 'พ.ร.บ. ยา พ.ศ. 2510 มาตรา 72',
  },
  '3808': {
    goodsName: 'สารกำจัดแมลง / วัตถุอันตราย',
    description: 'จัดเป็นวัตถุอันตรายชนิดที่ 3 → ต้องขออนุญาตนำเข้า จาก กรมวิชาการเกษตร',
    requiresPermit: true,
    direction: 'import',
    agency: 'กษ.',
    agencyFull: 'กรมวิชาการเกษตร (กษ.)',
    licenseType: 'วัตถุอันตราย',
    legalRef: 'พ.ร.บ. วัตถุอันตราย พ.ศ. 2535 มาตรา 36',
  },
  '9027': {
    goodsName: 'เครื่องมือวิเคราะห์ทางวิทยาศาสตร์',
    description: 'จัดเป็นอุปกรณ์ห้องปฏิบัติการ → ไม่ต้องขออนุญาตนำเข้าเพิ่มเติม สามารถนำเข้าได้เลย',
    requiresPermit: false,
    direction: 'import',
    agency: '—',
    agencyFull: 'ไม่ต้องขออนุญาตเพิ่มเติม',
  },
};

export function analyzeHsCode(hsCode: string): HsAnalysisData {
  const prefix4 = hsCode.replace(/\./g, '').slice(0, 4);
  const rule = HS_RULES[prefix4];

  if (rule) {
    return { hsCode, confidence: 94 + Math.floor(Math.random() * 5), ...rule };
  }

  // Fallback for unknown HS codes
  return {
    hsCode,
    goodsName: 'สินค้านำเข้าทั่วไป',
    description: `HS Code ${hsCode} — AI ไม่พบข้อมูลเฉพาะสำหรับ HS นี้ กรุณาตรวจสอบกับกรมศุลกากรโดยตรง`,
    requiresPermit: false,
    direction: 'import',
    agency: '—',
    agencyFull: 'ควรตรวจสอบเพิ่มเติม',
    confidence: 60,
  };
}
