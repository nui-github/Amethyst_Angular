import { AgencyReturnDoc } from '@app/core/models/types';

// Documents the department sends back once a request is approved (and paid, if a fee applies) —
// see ChatService.QR_PAYMENT_AGENCIES for which agencies use this flow.
export const AGENCY_RETURN_DOCS: Record<string, AgencyReturnDoc[]> = {
  'กรมควบคุมโรค': [
    { key: 'ddc_pink_form',     label: 'ใบรับรองฯ (DDCPINKFORM)' },
    { key: 'ddc_pink_form_pdf', label: 'ใบรับรองฯ (DDCPINKFORM PDF)' },
    { key: 'ddc_receipt',       label: 'ใบเสร็จรับเงิน (DDCERECEIPT PDF)' },
  ],
  'การยาง': [
    { key: 'raot_permit_pdf', label: 'ใบอนุญาตค้ายาง (RAOTPERMIT PDF)' },
  ],
};

export function getAgencyReturnDocs(agency: string): AgencyReturnDoc[] {
  return AGENCY_RETURN_DOCS[agency] ?? [];
}
