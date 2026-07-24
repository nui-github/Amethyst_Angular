import { DmfControlData, DmfInvoiceData, DmfItemData, DmfLicenseDetail, DmfSubmissionStatusData, DmfSubmissionStatusItem, InvoiceLineItem, PetroleumDutyDeclarationData, PetroleumOcrResultsData } from '@app/core/models/types';

// วัสดุ/อุปกรณ์สำหรับกิจการปิโตรเลียม (ขุดเจาะ/ผลิต) — มาตรา 70 พ.ร.บ.ปิโตรเลียม พ.ศ. 2514 ยกเว้น
// อากรนำเข้าให้ผู้รับสัมปทาน โดยระหว่างรอหนังสือรับรองจากกรมเชื้อเพลิงธรรมชาติ (DMF) ต้องยื่น
// "คำร้องขอออกของไปก่อน" (Document Type 3) พร้อมวางประกัน เพื่อรับของออกจากอารักขาศุลกากรก่อน —
// field ชุดนี้ตรงตามโครงสร้าง DMF License Request message จริง (Control/Invoice/Detail/Duty/Permit)

// ── ส่วนควบคุม (Control) — เลขที่ใบขน (declarationNo) ยังไม่มี ณ จุดนี้ เป็นคำร้องขอออกของไปก่อน
export const MOCK_DMF_CONTROL: DmfControlData = {
  declarationNo: undefined,
  declarationDate: undefined,
  referenceNumber: 'NETB000000317',
  documentType: '3',

  companyTaxNumber: '0105568004421',
  companyBranch: '00000',
  companyName: 'บริษัท ไทยเอ็กซ์พลอเรชั่น ปิโตรเลียม จำกัด',
  companyEnglishName: 'Thai Exploration Petroleum Co., Ltd.',
  streetAndNumber: '99 อาคารเอนเนอร์ยี่คอมเพล็กซ์ ถนนวิภาวดีรังสิต',
  district: 'แขวงจตุจักร',
  subProvince: 'เขตจตุจักร',
  province: 'กรุงเทพฯ',
  postcode: '10900',

  brokerTaxNumber: undefined,
  brokerBranch: undefined,
  customsClearanceIdCard: '1103005678901',
  customsClearanceName: 'นายวิศรุต ปิโตรกิจ',
  managerIdCard: '1103005678901',
  managerName: 'นายวิศรุต ปิโตรกิจ',

  modeOfTransport: '1',
  cargoTypeCode: '2',
  vesselName: 'EVER EXPLORE V.112N',
  arrivalDate: '2026-07-18',
  masterBillOfLading: 'MBL-2026-EXP4471',
  houseBillOfLading: 'HBL-2026-EXP4471',
  outsideReleasePort: undefined,
  releasePort: '0109',
  dischargePort: '0109',
  originCountryCode: 'JP',
  consignmentCountryCode: 'JP',

  shippingMarks: 'TEP / SW1-2568 / MADE IN JAPAN',
  totalPackageAmount: '2,080',
  totalPackageUnitCode: 'PK',
  totalNetWeight: '186,400.000',
  netWeightUnitCode: 'KGM',
  totalGrossWeight: '198,750.000',
  totalGrossWeightUnitCode: 'KGM',

  currencyCode: 'USD',
  exchangeRate: '36.20000',
  cifValueForeign: '1,782,320.00',
  cifValueBaht: '64,520,024.00',

  paymentMethod: 'L',
  totalTax: '0.00',
  totalDeposit: '5,000,000.00',
  rgsCode: undefined,
  customsBankCode: undefined,
  bankCode: undefined,
  bankBranchCode: undefined,
  bankAccountNumber: undefined,
  totalPaymentAmount: undefined,

  // ยังไม่ทราบ ณ ตอนอัปโหลด — ต้องกรอกในหน้าต่างข้อมูลเพิ่มเติม (หัวใจของคำร้องขอออกของไปก่อน)
  guaranteeMethod: undefined,
  guaranteeType: undefined,
  guaranteeBankCode: undefined,
  guaranteeBankBranchCode: undefined,
  guaranteeBankAccountNumber: undefined,
  totalDepositAmount: undefined,

  departureDate: undefined,
  approvalPort: undefined,
  approvalNumber: undefined,

  exportTaxIncentivesId: undefined,
  senderRegistrationId: 'NETB0000001',
};

export const MOCK_DMF_INVOICE: DmfInvoiceData = {
  invoiceNumber: 'TEP-INV-2026-0317',
  invoiceDate: '2026-07-10',
  purchaseOrderNumber: 'PO-TEP-2026-0091',
  termOfPaymentCode: 'T/T 30 DAYS',
  tradeTerms: 'CIF',
  buyerStatus: 'CO',
  consignorStatus: 'MA',
  commercialLevel: 'WO',
  consignorName: 'Nippon Oilfield Equipment Corp.',
  streetAndNumber: '4-2-1 Shibaura, Minato-ku',
  district: undefined,
  subProvince: undefined,
  province: 'Tokyo',
  postcode: '108-0023',
  countryCode: 'JP',
  invoiceCurrencyCode: 'USD',
  totalInvoiceAmount: '1,782,320.00',
};

export const MOCK_DMF_ITEMS: DmfItemData[] = [
  {
    itemNumber: 1,
    invoiceItemNumber: '1',
    tariffCode: '730429',
    tariffSequence: '00',
    statisticalCode: '000',
    importTariff: '4016.90.90',
    privilegeCode: '005',
    natureOfTransaction: '11',
    nameTh: 'ท่อกรุบ่อน้ำมัน (Casing Pipe)',
    nameEn: 'Well Casing Pipe, Seamless Steel',
    productYear: '2026',
    brandName: 'NIPPON STEEL',
    originCountryCode: 'JP',
    netWeight: '82,500.000',
    netWeightUnit: 'KGM',
    quantity: '850',
    quantityUnit: 'PCE',
    currencyCode: 'USD',
    exchangeRate: '36.20000',
    unitPriceForeign: '542.00000',
    unitPriceBaht: '19,632.40',
    invoiceQuantity: '850',
    invoiceQuantityUnit: 'PCE',
    invoiceAmountForeign: '460,700.00',
    invoiceAmountBaht: '16,677,340.00',
    cifValueForeign: '509,500.00',
    cifValueBaht: '18,450,000.00',
    shippingMarks: 'TEP / SW1-2568 / MADE IN JAPAN',
    reImportationCertificate: 'N',
    boi: 'N',
    bond: 'N',
    bis19: 'N',
    reExport: 'N',
    fz: 'N',
    ieat: 'N',
    duties: [
      { dutyType: 'IMP1', valueRate: '5.000', specificRate: '0.000', amount: '922,500.00', amountPaid: '0.00', exemptionRate: '100.00', depositAmount: '922,500.00', depositReasonCode: 'DMF' },
    ],
    permits: [],
  },
  {
    itemNumber: 2,
    invoiceItemNumber: '2',
    tariffCode: '843143',
    tariffSequence: '00',
    statisticalCode: '000',
    importTariff: '8431.43.00',
    privilegeCode: '005',
    natureOfTransaction: '11',
    nameTh: 'หัวเจาะสามง่าม (Tricone Drill Bit)',
    nameEn: 'Tricone Drill Bit',
    productYear: '2026',
    brandName: 'HALLIBURTON',
    originCountryCode: 'US',
    netWeight: '4,320.000',
    netWeightUnit: 'KGM',
    quantity: '24',
    quantityUnit: 'PCE',
    currencyCode: 'USD',
    exchangeRate: '36.20000',
    unitPriceForeign: '7,040.00000',
    unitPriceBaht: '254,848.00',
    invoiceQuantity: '24',
    invoiceQuantityUnit: 'PCE',
    invoiceAmountForeign: '168,960.00',
    invoiceAmountBaht: '6,116,352.00',
    cifValueForeign: '169,060.00',
    cifValueBaht: '6,120,000.00',
    shippingMarks: 'TEP / SW1-2568 / MADE IN USA',
    reImportationCertificate: 'N',
    boi: 'N',
    bond: 'N',
    bis19: 'N',
    reExport: 'N',
    fz: 'N',
    ieat: 'N',
    duties: [
      { dutyType: 'IMP1', valueRate: '5.000', specificRate: '0.000', amount: '306,000.00', amountPaid: '0.00', exemptionRate: '100.00', depositAmount: '306,000.00', depositReasonCode: 'DMF' },
    ],
    permits: [],
  },
  {
    itemNumber: 3,
    invoiceItemNumber: '3',
    tariffCode: '848180',
    tariffSequence: '00',
    statisticalCode: '000',
    importTariff: '8481.80.99',
    privilegeCode: '005',
    natureOfTransaction: '11',
    nameTh: 'ชุดวาล์วควบคุมหลุมเจาะ (Wellhead Christmas Tree)',
    nameEn: 'Wellhead Christmas Tree Valve Assembly',
    productYear: '2026',
    brandName: 'AKER SOLUTIONS',
    originCountryCode: 'NO',
    netWeight: '18,600.000',
    netWeightUnit: 'KGM',
    quantity: '6',
    quantityUnit: 'SET',
    currencyCode: 'USD',
    exchangeRate: '36.20000',
    unitPriceForeign: '113,995.00000',
    unitPriceBaht: '4,126,619.00',
    invoiceQuantity: '6',
    invoiceQuantityUnit: 'SET',
    invoiceAmountForeign: '683,970.00',
    invoiceAmountBaht: '24,759,714.00',
    cifValueForeign: '685,080.00',
    cifValueBaht: '24,800,000.00',
    shippingMarks: 'TEP / SW1-2568 / MADE IN NORWAY',
    reImportationCertificate: 'N',
    boi: 'N',
    bond: 'N',
    bis19: 'N',
    reExport: 'N',
    fz: 'N',
    ieat: 'N',
    duties: [
      { dutyType: 'IMP1', valueRate: '5.000', specificRate: '0.000', amount: '1,240,000.00', amountPaid: '0.00', exemptionRate: '100.00', depositAmount: '1,240,000.00', depositReasonCode: 'DMF' },
    ],
    permits: [],
  },
  {
    itemNumber: 4,
    invoiceItemNumber: '4',
    tariffCode: '730423',
    tariffSequence: '00',
    statisticalCode: '000',
    importTariff: '7304.23.00',
    privilegeCode: '005',
    natureOfTransaction: '11',
    nameTh: 'ท่อผลิตปิโตรเลียม (Production Tubing)',
    nameEn: 'Production Tubing, Seamless Steel',
    productYear: '2026',
    brandName: 'NIPPON STEEL',
    originCountryCode: 'JP',
    netWeight: '81,000.000',
    netWeightUnit: 'KGM',
    quantity: '1,200',
    quantityUnit: 'PCE',
    currencyCode: 'USD',
    exchangeRate: '36.20000',
    unitPriceForeign: '329.00000',
    unitPriceBaht: '11,909.80',
    invoiceQuantity: '1,200',
    invoiceQuantityUnit: 'PCE',
    invoiceAmountForeign: '394,800.00',
    invoiceAmountBaht: '14,295,760.00',
    cifValueForeign: '394,890.00',
    cifValueBaht: '14,300,000.00',
    shippingMarks: 'TEP / SW1-2568 / MADE IN JAPAN',
    reImportationCertificate: 'N',
    boi: 'N',
    bond: 'N',
    bis19: 'N',
    reExport: 'N',
    fz: 'N',
    ieat: 'N',
    duties: [
      { dutyType: 'IMP1', valueRate: '5.000', specificRate: '0.000', amount: '715,000.00', amountPaid: '0.00', exemptionRate: '100.00', depositAmount: '715,000.00', depositReasonCode: 'DMF' },
    ],
    permits: [],
  },
];

export const MOCK_PETROLEUM_DUTY_DECLARATION: PetroleumDutyDeclarationData = {
  control: MOCK_DMF_CONTROL,
  invoice: MOCK_DMF_INVOICE,
  items: MOCK_DMF_ITEMS,
};

export const MOCK_PETROLEUM_DUTY_OCR_RESULT: PetroleumOcrResultsData = {
  referenceNumber: MOCK_DMF_CONTROL.referenceNumber,
  companyName: MOCK_DMF_CONTROL.companyName,
  vesselName: MOCK_DMF_CONTROL.vesselName,
  itemCount: MOCK_DMF_ITEMS.length,
  declaration: MOCK_PETROLEUM_DUTY_DECLARATION,
  declarationComplete: false,
  declarationGateRequired: true,
};

// ── ผลการยื่นข้อมูลกับ DMF (dmf-submission-status card) ─────────────────────────
// Flattened item rows for the DECL/Detail table DMF returns once it receives the submission —
// same commercial fields as MOCK_DMF_ITEMS, reshaped for a single wide table row. All 4 items
// carry exemptionRate 100 in their duty rows (see MOCK_DMF_ITEMS above), so all 4 come back
// duty-exempt once DMF grants the ม.70 exemption — dutyExempt only actually renders as a
// checkmark once status is 'license-accept' (see DmfSubmissionStatusComponent).
const MOCK_DMF_SUBMISSION_ITEMS: DmfSubmissionStatusItem[] = MOCK_DMF_ITEMS.map(i => ({
  itemNo: i.itemNumber,
  invNo: MOCK_DMF_INVOICE.invoiceNumber ?? '',
  invItem: i.invoiceItemNumber ?? '',
  tariff: i.importTariff ?? '',
  stat: i.statisticalCode ?? '',
  enDesc: i.nameEn ?? '',
  thDesc: i.nameTh ?? '',
  pk: `${i.quantity ?? ''} ${i.quantityUnit ?? ''}`.trim(),
  nw: `${i.netWeight ?? ''} ${i.netWeightUnit ?? ''}`.trim(),
  qty: `${i.quantity ?? ''} ${i.quantityUnit ?? ''}`.trim(),
  invAmount: `${i.invoiceAmountForeign ?? ''} ${MOCK_DMF_INVOICE.invoiceCurrencyCode ?? ''}`.trim(),
  cifForeign: `${i.cifValueForeign ?? ''} ${MOCK_DMF_CONTROL.currencyCode ?? ''}`.trim(),
  cifBaht: i.cifValueBaht ?? '0.00',
  dutyExempt: (i.duties ?? []).some(d => Number(d.exemptionRate) >= 100),
}));

// เลขที่ใบขน DMF ออกกลับมาให้เมื่อรับคำร้องขอออกของไปก่อนแล้ว (ยังไม่มี ณ ตอนอัปโหลด — ดู
// MOCK_DMF_CONTROL.declarationNo comment ด้านบน)
const MOCK_DMF_SUBMISSION_DECL_NO = 'A0173630700042';

const MOCK_DMF_LICENSE_DETAIL: DmfLicenseDetail = {
  licenseNo: 'DMFRS6907/0042',
  issueDate: '2026-07-27',
  requestNo: 'DMF 6907-00042',
  licenseName: 'ใบอนุญาตตามมาตรา 70 แห่งพระราชบัญญัติปิโตรเลียม พ.ศ.2514',
  licenseIssueAuthority: '4030036183000011',
  licenseAuthorityName: 'กรมเชื้อเพลิงธรรมชาติ',
  licenseType: 'ขอออกของไปก่อน (Document Type 3)',
  licenseIssueDate: '2026-07-27',
  effectiveDate: '2026-07-27',
  expireDate: '9999-12-31',
};

/** Builds the dmf-submission-status card's data for a given stage — ChatService.
 *  showDmfSubmissionStatus() calls this 3 times (waiting-response → dmf-accept → license-accept)
 *  and swaps the message's data in place via updateLastMessageData(), same convention as
 *  showRubberEqcStatus(). DECL info + item table only exist once DMF has actually accepted the
 *  submission; license detail only once the license itself is granted. */
export function getDmfSubmissionStatusData(status: DmfSubmissionStatusData['status']): DmfSubmissionStatusData {
  const c = MOCK_DMF_CONTROL;
  return {
    agency: 'กรมเชื้อเพลิงธรรมชาติ',
    referenceNumber: c.referenceNumber ?? '',
    status,
    declNo: status === 'waiting-response' ? undefined : MOCK_DMF_SUBMISSION_DECL_NO,
    declDate: status === 'waiting-response' ? undefined : new Date().toISOString().slice(0, 10),
    companyNameTh: c.companyName,
    companyNameEn: c.companyEnglishName,
    taxNumber: c.companyTaxNumber,
    branch: c.companyBranch,
    address: [c.streetAndNumber, c.district, c.subProvince, c.province, c.postcode].filter(Boolean).join(' '),
    items: status === 'waiting-response' ? undefined : MOCK_DMF_SUBMISSION_ITEMS,
    license: status === 'license-accept' ? MOCK_DMF_LICENSE_DETAIL : undefined,
  };
}

// ทั้งหมดในคำร้องนี้ยื่นให้กรมเชื้อเพลิงธรรมชาติ (DMF) เพียงกรมเดียว — ไม่มีขั้นตอนจัดกลุ่มหลายกรม
// เหมือน item-hs-analysis จึงแปลงตรงเป็น formData.selectedItems ได้เลย
export function getPetroleumEquipmentLineItems(): InvoiceLineItem[] {
  return MOCK_DMF_ITEMS.map(i => ({
    id: `pet_${i.itemNumber}`,
    name: i.nameTh ?? '',
    quantity: i.quantity ?? '',
    unit: i.quantityUnit ?? '',
    unitPrice: Number((i.unitPriceBaht ?? '0').replace(/,/g, '')) || 0,
    amount: Number((i.invoiceAmountBaht ?? '0').replace(/,/g, '')) || 0,
    lotNo: '-',
    hsCode: i.tariffCode ?? '',
    origin: i.originCountryCode,
  }));
}
