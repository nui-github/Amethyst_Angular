export interface ManualField {
  key: string;
  label: string;
  placeholder: string;
}

export interface AgencyDoc {
  key: string;
  label: string;
  hint: string;
  required: boolean;
  manualFields: ManualField[];
  multiple?: boolean;
  accept?: string; // file input `accept` override — defaults to .pdf,.jpg,.jpeg,.png if unset
}

export const AGENCY_REQUIRED_DOCS: Record<string, AgencyDoc[]> = {
  // LPI (Local Product Inspection) ของ อย. ใช้แค่ COA และเอกสารเลข U — ไม่ต้องใช้ GMP/คำขอนำเข้า/MSDS
  'อย.': [
    {
      key: 'coa', label: 'Certificate of Analysis (COA)', required: true, multiple: true,
      hint: 'ผลการวิเคราะห์คุณภาพและความบริสุทธิ์ของสินค้า',
      manualFields: [
        { key: 'coaBatch',    label: 'Batch No.',        placeholder: 'เช่น LOT-2024-567' },
        { key: 'coaTestDate', label: 'วันที่ทดสอบ',      placeholder: 'dd/mm/yyyy' },
        { key: 'coaPurity',   label: 'ความบริสุทธิ์ (%)', placeholder: 'เช่น 99.5' },
      ],
    },
    {
      key: 'u_no', label: 'เอกสารเลข U', required: true, multiple: true,
      hint: 'เลขทะเบียน U ที่ออกโดย อย. สำหรับยื่นขอ LPI',
      manualFields: [
        { key: 'uNo',       label: 'เลข U',        placeholder: 'เช่น U-2568-00123' },
        { key: 'uNoIssued', label: 'วันที่ออกเลข', placeholder: 'dd/mm/yyyy' },
      ],
    },
  ],
  'กษ.': [
    {
      key: 'phyto', label: 'ใบรับรองสุขอนามัยพืช', required: true,
      hint: 'Phytosanitary Certificate จากประเทศต้นทาง',
      manualFields: [
        { key: 'phytoNo',   label: 'เลขที่ใบรับรอง', placeholder: 'Phytosanitary Certificate No.' },
        { key: 'phytoDate', label: 'วันที่ออก',       placeholder: 'dd/mm/yyyy' },
      ],
    },
    {
      key: 'origin', label: 'หนังสือรับรองแหล่งกำเนิด', required: true,
      hint: 'Certificate of Origin (C/O)',
      manualFields: [
        { key: 'originNo',      label: 'เลขที่ C/O',       placeholder: 'Certificate No.' },
        { key: 'originCountry', label: 'ประเทศต้นกำเนิด',   placeholder: 'เช่น อินเดีย' },
        { key: 'originDate',    label: 'วันที่ออกเอกสาร',  placeholder: 'dd/mm/yyyy' },
      ],
    },
    {
      key: 'permit', label: 'ใบอนุญาตนำเข้าพืช', required: true,
      hint: 'กรมวิชาการเกษตรออกให้ก่อนนำเข้า',
      manualFields: [
        { key: 'permitNo',   label: 'เลขที่ใบอนุญาต', placeholder: 'เช่น กษ.-2568-000789' },
        { key: 'permitDate', label: 'วันที่อนุมัติ',    placeholder: 'dd/mm/yyyy' },
      ],
    },
  ],
  'ปส.': [
    {
      key: 'irradiation_cert', label: 'ใบรับรองการฆ่าเชื้อด้วยรังสี', required: true,
      hint: 'Certificate of Irradiation/Sterilization จากผู้ผลิต',
      manualFields: [
        { key: 'irradiationNo',   label: 'เลขที่ใบรับรอง', placeholder: 'Certificate No.' },
        { key: 'irradiationDate', label: 'วันที่ออก',       placeholder: 'dd/mm/yyyy' },
      ],
    },
    {
      key: 'radiation_permit', label: 'ใบอนุญาตครอบครองเครื่องมือแพทย์ที่ผ่านการฉายรังสี', required: true,
      hint: 'ออกโดยสำนักงานปรมาณูเพื่อสันติภาพ (ปส.)',
      manualFields: [
        { key: 'radiationPermitNo',   label: 'เลขที่ใบอนุญาต', placeholder: 'เช่น ปส.-2568-000456' },
        { key: 'radiationPermitDate', label: 'วันที่อนุมัติ',    placeholder: 'dd/mm/yyyy' },
      ],
    },
  ],
  // Export-path agencies (see 'Export path' in CLAUDE.md)
  // กรมควบคุมโรค — DOA + ฉลากภาชนะบรรจุ (พ.ร.บ.เชื้อโรคและพิษจากสัตว์ พ.ศ. 2558 กำหนดให้ต้องยื่น
  // เอกสารกำกับ ฉลาก และภาชนะบรรจุประกอบการขออนุญาต); the pathogen-permit/sanitary-cert docs
  // themselves are collected elsewhere
  'กรมควบคุมโรค': [
    {
      key: 'doa', label: 'Declaration of Analysis (DOA)', required: true, multiple: false,
      hint: 'ผลการวิเคราะห์คุณภาพชุดน้ำยา/สารตัวอย่าง — อัปโหลดได้ไฟล์เดียว',
      manualFields: [
        { key: 'doaBatch',    label: 'Batch No.', placeholder: 'เช่น BIO-2568-014' },
        { key: 'doaTestDate', label: 'วันที่ทดสอบ', placeholder: 'dd/mm/yyyy' },
      ],
    },
    {
      key: 'label', label: 'ฉลากภาชนะบรรจุ (Container Label)', required: true, multiple: true,
      hint: 'ฉลากที่ติดบนภาชนะบรรจุ/หีบห่อสินค้าจริง — อัปโหลดได้มากกว่า 1 ไฟล์',
      manualFields: [],
    },
  ],
  'เชื้อเพลิง': [
    {
      key: 'fuel_customs_xml', label: 'ใบขนสินค้าขาออก (ไฟล์ XML)', required: true, accept: '.xml',
      hint: 'ยื่นกรมธุรกิจพลังงานด้วยไฟล์ใบขนสินค้าขาออกรูปแบบ XML เท่านั้น — ไม่รับไฟล์ PDF/รูปภาพ',
      manualFields: [
        { key: 'fuelCustomsNo',   label: 'เลขที่ใบขน', placeholder: 'เช่น A00516907M8Q2Z' },
        { key: 'fuelCustomsDate', label: 'วันที่ยื่น',   placeholder: 'dd/mm/yyyy' },
      ],
    },
  ],
  'การยาง': [
    {
      key: 'rubber_trade_permit', label: 'ใบอนุญาตค้ายาง', required: true,
      hint: 'ออกโดยการยางแห่งประเทศไทย ตาม พ.ร.บ.ควบคุมยาง พ.ศ. 2542',
      manualFields: [
        { key: 'rubberPermitNo',   label: 'เลขที่ใบอนุญาต', placeholder: 'เช่น กยท.-2568-000321' },
        { key: 'rubberPermitDate', label: 'วันที่อนุมัติ',    placeholder: 'dd/mm/yyyy' },
      ],
    },
    {
      key: 'rubber_quality_cert', label: 'ใบรับรองคุณภาพยาง', required: true,
      hint: 'ระบุชั้นคุณภาพยาง (เช่น RSS3) และผลตรวจสอบ',
      manualFields: [
        { key: 'rubberQualityNo',   label: 'เลขที่ใบรับรอง', placeholder: 'Certificate No.' },
        { key: 'rubberQualityDate', label: 'วันที่ออก',       placeholder: 'dd/mm/yyyy' },
      ],
    },
    {
      key: 'origin', label: 'หนังสือรับรองแหล่งกำเนิดสินค้า', required: false,
      hint: 'Certificate of Origin (C/O) — ตามที่ประเทศปลายทางกำหนด',
      manualFields: [
        { key: 'originNo',   label: 'เลขที่ C/O',      placeholder: 'Certificate No.' },
        { key: 'originDate', label: 'วันที่ออกเอกสาร', placeholder: 'dd/mm/yyyy' },
      ],
    },
  ],
  'multi': [
    {
      key: 'license_app', label: 'คำขออนุญาตนำเข้า', required: true,
      hint: 'แบบฟอร์มคำขอจากหน่วยงานที่เกี่ยวข้อง',
      manualFields: [
        { key: 'licAppNo',   label: 'เลขที่คำขอ', placeholder: 'เลขที่อ้างอิงคำขอ' },
        { key: 'licAppDate', label: 'วันที่ยื่น',  placeholder: 'dd/mm/yyyy' },
      ],
    },
    {
      key: 'origin', label: 'หนังสือรับรองแหล่งกำเนิด', required: true,
      hint: 'Certificate of Origin (C/O)',
      manualFields: [
        { key: 'originNo',   label: 'เลขที่ C/O',      placeholder: 'Certificate No.' },
        { key: 'originDate', label: 'วันที่ออกเอกสาร', placeholder: 'dd/mm/yyyy' },
      ],
    },
    {
      key: 'extra', label: 'เอกสารอื่นๆ ที่เกี่ยวข้อง', required: false,
      hint: 'ตามที่แต่ละกรมกำหนดเพิ่มเติม',
      manualFields: [
        { key: 'extraDesc', label: 'รายละเอียดเอกสาร', placeholder: 'ระบุชื่อและเนื้อหาเอกสาร' },
      ],
    },
  ],
  '—': [
    {
      key: 'doc1', label: 'เอกสารประกอบการขออนุญาต', required: true,
      hint: 'ตามที่หน่วยงานที่เกี่ยวข้องกำหนด',
      manualFields: [
        { key: 'docNo',   label: 'เลขที่เอกสาร', placeholder: 'เลขที่อ้างอิง' },
        { key: 'docDate', label: 'วันที่เอกสาร',  placeholder: 'dd/mm/yyyy' },
        { key: 'docDesc', label: 'รายละเอียด',    placeholder: 'ข้อมูลที่เกี่ยวข้อง' },
      ],
    },
  ],
};

export function getAgencyDocs(agency: string): AgencyDoc[] {
  return AGENCY_REQUIRED_DOCS[agency] ?? AGENCY_REQUIRED_DOCS['—'];
}
