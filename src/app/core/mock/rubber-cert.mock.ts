import { BankAccount } from '@app/core/models/types';

// หนังสือรับรองคุณภาพยาง (e-QC, compound rubber HS 4005.10.00) — real RAOT fee is
// ฿0.002/kg via the e-SFR system; flat mock amount here since the real calc is too small
// (a few baht) to demo meaningfully.
export const RUBBER_COMPOUND_CERT_FEE = 150;

// RAOT e-SFR pays via bank account debit against accounts already linked to the exporter's
// profile — this mock stands in for that linked-accounts lookup.
export const MOCK_LINKED_BANK_ACCOUNTS: BankAccount[] = [
  { id: 'kbank-1', bankName: 'ธนาคารกสิกรไทย',   accountNoMasked: 'xxx-x-x4821-5', accountName: 'บจก. เน็ตเบย์', isDefault: true },
  { id: 'scb-1',   bankName: 'ธนาคารไทยพาณิชย์', accountNoMasked: 'xxx-x-x0932-1', accountName: 'บจก. เน็ตเบย์' },
];

// อัตราค่าบริการทดสอบยางธรรมชาติเพื่อการจัดเก็บค่าธรรมเนียมในการส่งยางออกนอกราชอาณาจักร (Cess) —
// คิดตามน้ำหนักส่งออกต่อ 1 ชุดตัวอย่าง ([น้ำหนักสูงสุดของ bracket (กก.), อัตราปกติ, อัตราเร่งด่วน] บาท).
// Shared by the e-QC request editor's Payment Amount and the e-SFR request editor's Payment
// Amount — both are ultimately the same RAOT rate table applied to the same shipment's Export
// Weight, just charged at two different steps of the compound-rubber flow.
const EXPORT_WEIGHT_RATE_TABLE: [number, number, number][] = [
  [20_160, 400, 800],
  [100_800, 800, 1_600],
  [201_600, 1_200, 2_400],
  [Infinity, 1_500, 3_000],
];

export function rateForExportWeight(weightKg: number, urgent: boolean): number {
  const bracket = EXPORT_WEIGHT_RATE_TABLE.find(([maxKg]) => weightKg <= maxKg) ?? EXPORT_WEIGHT_RATE_TABLE.at(-1)!;
  const [, normalRate, urgentRate] = bracket;
  return urgent ? urgentRate : normalRate;
}
