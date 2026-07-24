// Shared DocumentControl header-section layout, used by both ocr-results (first read of the
// document) and form-preview (final review before submit) so the two boxes present the exact
// same structure — per the real LPI submission JSON (DocumentControl + GoodsShipment).
// Rows with no value are simply skipped — "field ไหนยังไม่มีข้อมูลก็ให้ว่างไว้".
// `required`/`options` are consumed by the customs-declaration-editor full-screen panel only
// (ocr-results/form-preview's own inline header display ignores them, "field ไหนยังไม่มีข้อมูลก็
// ให้ว่างไว้" still applies there) — `options`, when set, renders the field as a dropdown in the
// editor instead of free text; none are set yet, pending the exact list from the user.
export interface CustomsDeclRow { label: string; key: string; accent: boolean; required?: boolean; options?: string[]; }
export interface CustomsDeclSection { title: string; color: string; rows: CustomsDeclRow[]; }

// Same field keys for both directions (one generic DocumentControl/GoodsShipment schema covers
// both ใบขนขาเข้า and ใบขนขาออก) — only a handful of title/label strings and which of
// arrivalDate/departureDate is required actually differ between import and export.
export function getCustomsDeclarationHeaderSections(direction: 'import' | 'export' = 'import'): CustomsDeclSection[] {
  const isExport = direction === 'export';
  return [
    { title: 'ข้อมูลควบคุมเอกสาร', color: '#0463EF', rows: [
      { label: 'เลขที่ใบขน',        key: 'declarationNo',           accent: true, required: true },
      { label: 'เลขที่อ้างอิง',      key: 'referenceNumber',         accent: true, required: true },
      { label: 'ผู้ยื่นคำขอ',        key: 'requestFactName',         accent: false, required: true },
      { label: 'รหัสหน่วยงานควบคุม', key: 'controlAgencyOfficeCode', accent: false },
    ]},
    { title: isExport ? 'ข้อมูลบริษัทผู้ส่งออก' : 'ข้อมูลบริษัทผู้นำเข้า', color: '#7C3AED', rows: [
      { label: 'ชื่อบริษัท',        key: 'companyName',        accent: false, required: true },
      { label: 'เลขผู้เสียภาษี',    key: 'companyTaxNumber',   accent: false, required: true },
      { label: 'สาขาที่',           key: 'companyBranch',      accent: false },
      { label: 'เลขบัตร ผู้รับมอบอำนาจ', key: 'attorneyIdCard', accent: false },
    ]},
    { title: 'ข้อมูลการขนส่ง', color: '#0D8F61', rows: [
      { label: 'วันที่นำเข้า',       key: 'arrivalDate',        accent: false, required: !isExport },
      { label: 'วันที่ส่งออก',       key: 'departureDate',      accent: false, required: isExport },
      { label: 'ประเภทใบขน',        key: 'licenseType',        accent: false, required: true },
      { label: 'ชื่อเรือ',           key: 'vesselName',         accent: false },
      { label: 'ประเทศต้นทาง',  key: 'consignmentCountry', accent: false, required: true },
      { label: 'ประเทศปลายทาง', key: 'destinationCountry', accent: false, required: true },
      { label: 'รหัสท่าขนถ่าย',      key: 'portDischargeCode',    accent: false },
      { label: 'รหัสท่าต้นทาง',      key: 'portLoadCode',         accent: false },
      { label: 'ท่าเรือขนถ่าย',      key: 'controlDischargePort', accent: false },
      { label: 'ท่าเรือปล่อยสินค้า', key: 'controlReleasePort',   accent: false },
    ]},
    { title: 'ผู้แจ้ง', color: '#B45309', rows: [
      { label: 'ชื่อผู้แจ้ง',        key: 'informantName',   accent: false, required: true },
      { label: 'เลขบัตรผู้แจ้ง',     key: 'informantIdCard', accent: false },
      { label: 'เลขทะเบียน',        key: 'registrationId',  accent: false },
    ]},
  ];
}

// Default (import) sections — kept for any call site that hasn't been made direction-aware yet.
export const CUSTOMS_DECLARATION_HEADER_SECTIONS: CustomsDeclSection[] = getCustomsDeclarationHeaderSections('import');

// Per-item required fields inside the declaration editor's item table — every GoodsShipment
// item must at least identify what it is, its tariff classification, and quantity/origin.
export const CUSTOMS_DECLARATION_ITEM_REQUIRED_FIELDS: string[] = [
  'nameTh', 'nameEn', 'tariffCode', 'quantity', 'quantityUnit', 'originCountry',
];
