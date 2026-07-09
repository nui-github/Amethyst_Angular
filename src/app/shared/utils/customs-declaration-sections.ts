// Shared DocumentControl header-section layout, used by both ocr-results (first read of the
// document) and form-preview (final review before submit) so the two boxes present the exact
// same structure — per the real LPI submission JSON (DocumentControl + GoodsShipment).
// Rows with no value are simply skipped — "field ไหนยังไม่มีข้อมูลก็ให้ว่างไว้".
export interface CustomsDeclRow { label: string; key: string; accent: boolean; }
export interface CustomsDeclSection { title: string; color: string; rows: CustomsDeclRow[]; }

export const CUSTOMS_DECLARATION_HEADER_SECTIONS: CustomsDeclSection[] = [
  { title: 'ข้อมูลควบคุมเอกสาร', color: '#0463EF', rows: [
    { label: 'เลขที่อ้างอิง',      key: 'referenceNumber',         accent: true  },
    { label: 'ผู้ยื่นคำขอ',        key: 'requestFactName',         accent: false },
    { label: 'รหัสหน่วยงานควบคุม', key: 'controlAgencyOfficeCode', accent: false },
  ]},
  { title: 'ข้อมูลบริษัทผู้นำเข้า', color: '#7C3AED', rows: [
    { label: 'ชื่อบริษัท',        key: 'companyName',        accent: false },
    { label: 'เลขผู้เสียภาษี',    key: 'companyTaxNumber',   accent: false },
    { label: 'สาขาที่',           key: 'companyBranch',      accent: false },
    { label: 'เลขบัตร ผู้รับมอบอำนาจ', key: 'attorneyIdCard', accent: false },
  ]},
  { title: 'ข้อมูลการขนส่ง', color: '#0D8F61', rows: [
    { label: 'วันที่นำเข้า',       key: 'arrivalDate',        accent: false },
    { label: 'วันที่ส่งออก',       key: 'departureDate',      accent: false },
    { label: 'ประเภทใบขน',        key: 'licenseType',        accent: false },
    { label: 'ชื่อเรือ',           key: 'vesselName',         accent: false },
    { label: 'ประเทศต้นทาง',      key: 'consignmentCountry', accent: false },
    { label: 'ประเทศปลายทาง',     key: 'destinationCountry', accent: false },
    { label: 'รหัสท่าขนถ่าย',      key: 'portDischargeCode',    accent: false },
    { label: 'รหัสท่าต้นทาง',      key: 'portLoadCode',         accent: false },
    { label: 'ท่าเรือขนถ่าย',      key: 'controlDischargePort', accent: false },
    { label: 'ท่าเรือปล่อยสินค้า', key: 'controlReleasePort',   accent: false },
  ]},
  { title: 'ผู้แจ้ง', color: '#B45309', rows: [
    { label: 'ชื่อผู้แจ้ง',        key: 'informantName',   accent: false },
    { label: 'เลขบัตรผู้แจ้ง',     key: 'informantIdCard', accent: false },
    { label: 'เลขทะเบียน',        key: 'registrationId',  accent: false },
  ]},
];
