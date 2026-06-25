export interface AgencyPaymentConfig {
  requiresFee: boolean;
  amount: number;   // THB
}

export const AGENCY_PAYMENT: Record<string, AgencyPaymentConfig> = {
  'อย.': { requiresFee: true,  amount: 2500 },
  'กษ.': { requiresFee: false, amount: 0    },
};

export function getAgencyPayment(agency: string): AgencyPaymentConfig {
  return AGENCY_PAYMENT[agency] ?? { requiresFee: false, amount: 0 };
}
