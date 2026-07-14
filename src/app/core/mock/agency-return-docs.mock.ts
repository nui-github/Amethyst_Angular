import { AgencyReturnDoc } from '@app/core/models/types';

// Stand-in for a real signed download URL — same placeholder pattern as SAMPLE_PDF in queue.mock.ts
const SAMPLE_PDF = 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/PDF1.pdf';

// Documents the department sends back once a request is approved (and paid, if a fee applies) —
// see ChatService.QR_PAYMENT_AGENCIES for which agencies use this flow.
export const AGENCY_RETURN_DOCS: Record<string, AgencyReturnDoc[]> = {
  'กรมควบคุมโรค': [
    { key: 'ddc_pink_form',     label: 'ใบรับรองฯ (DDCPINKFORM)',     url: SAMPLE_PDF },
    { key: 'ddc_pink_form_pdf', label: 'ใบรับรองฯ (DDCPINKFORM PDF)', url: SAMPLE_PDF },
    { key: 'ddc_receipt',       label: 'ใบเสร็จรับเงิน (DDCERECEIPT PDF)', url: SAMPLE_PDF },
  ],
  'การยาง': [
    { key: 'raot_permit_pdf', label: 'ใบอนุญาตค้ายาง (RAOTPERMIT PDF)', url: SAMPLE_PDF },
  ],
};

export function getAgencyReturnDocs(agency: string): AgencyReturnDoc[] {
  return AGENCY_RETURN_DOCS[agency] ?? [];
}
