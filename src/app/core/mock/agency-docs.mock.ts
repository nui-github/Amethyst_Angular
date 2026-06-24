export interface AgencyDoc {
  key: string;
  label: string;
  hint: string;
  required: boolean;
}

export const AGENCY_REQUIRED_DOCS: Record<string, AgencyDoc[]> = {
  'อย.': [
    { key: 'gmp',        label: 'ใบรับรอง GMP',                    hint: 'Good Manufacturing Practice Certificate จากผู้ผลิต', required: true },
    { key: 'coa',        label: 'Certificate of Analysis (COA)',    hint: 'ผลการวิเคราะห์คุณภาพและความบริสุทธิ์ของสินค้า',       required: true },
    { key: 'import_app', label: 'คำขออนุญาตนำเข้าวัตถุดิบยา',       hint: 'แบบฟอร์ม นย.1 จาก อย. — กรอกแล้วสแกนแนบ',          required: true },
    { key: 'msds',       label: 'Safety Data Sheet (MSDS/SDS)',     hint: 'เอกสารข้อมูลความปลอดภัยของสาร (ถ้ามี)',              required: false },
  ],
  'กษ.': [
    { key: 'phyto',  label: 'ใบรับรองสุขอนามัยพืช',    hint: 'Phytosanitary Certificate จากประเทศต้นทาง', required: true },
    { key: 'origin', label: 'หนังสือรับรองแหล่งกำเนิด', hint: 'Certificate of Origin (C/O)',               required: true },
    { key: 'permit', label: 'ใบอนุญาตนำเข้าพืช',       hint: 'กรมวิชาการเกษตรออกให้ก่อนนำเข้า',          required: true },
  ],
  'multi': [
    { key: 'license_app', label: 'คำขออนุญาตนำเข้า',      hint: 'แบบฟอร์มคำขอจากหน่วยงานที่เกี่ยวข้อง', required: true },
    { key: 'origin',      label: 'หนังสือรับรองแหล่งกำเนิด', hint: 'Certificate of Origin (C/O)',         required: true },
    { key: 'extra',       label: 'เอกสารอื่นๆ ที่เกี่ยวข้อง', hint: 'ตามที่แต่ละกรมกำหนดเพิ่มเติม',      required: false },
  ],
  '—': [
    { key: 'doc1', label: 'เอกสารประกอบการขออนุญาต', hint: 'ตามที่หน่วยงานที่เกี่ยวข้องกำหนด', required: true },
  ],
};

export function getAgencyDocs(agency: string): AgencyDoc[] {
  return AGENCY_REQUIRED_DOCS[agency] ?? AGENCY_REQUIRED_DOCS['—'];
}
