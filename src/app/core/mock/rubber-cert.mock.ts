import { BankAccount } from '@app/core/models/types';

// ใบรับรองปริมาณเนื้อยางแห้ง (compound rubber, HS 4005.10.00) — real RAOT fee is
// ฿0.002/kg via the e-SFR system; flat mock amount here since the real calc is too small
// (a few baht) to demo meaningfully.
export const RUBBER_COMPOUND_CERT_FEE = 150;

// RAOT e-SFR pays via bank account debit against accounts already linked to the exporter's
// profile — this mock stands in for that linked-accounts lookup.
export const MOCK_LINKED_BANK_ACCOUNTS: BankAccount[] = [
  { id: 'kbank-1', bankName: 'ธนาคารกสิกรไทย',   accountNoMasked: 'xxx-x-x4821-5', accountName: 'บจก. เน็ตเบย์', isDefault: true },
  { id: 'scb-1',   bankName: 'ธนาคารไทยพาณิชย์', accountNoMasked: 'xxx-x-x0932-1', accountName: 'บจก. เน็ตเบย์' },
];
