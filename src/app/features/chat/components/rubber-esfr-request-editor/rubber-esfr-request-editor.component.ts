import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ChatService } from '@app/core/services/chat.service';
import { RubberEsfrRequestData, RubberEsfrRequestItem } from '@app/core/models/types';
import { MOCK_LINKED_BANK_ACCOUNTS, rateForExportWeight } from '@mock/rubber-cert.mock';
import { X, Save } from 'lucide-angular';

@Component({
  selector: 'app-rubber-esfr-request-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './rubber-esfr-request-editor.component.html',
  styleUrls: ['./rubber-esfr-request-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RubberEsfrRequestEditorComponent implements OnInit {
  private readonly chat = inject(ChatService);

  readonly icClose = X;
  readonly icSave = Save;

  local = signal<RubberEsfrRequestData>({
    referenceNumber: '',
    senderRegistrationId: '',
    licenseType: '1',
    tradeLicenseNo: '',
    exportLicenseNo: '',
    inventoryName: '',
    inventoryStreet: '',
    inventoryDistrict: '',
    inventorySubProvince: '',
    inventoryProvince: '',
    inventoryPostcode: '',
    inventoryPhone: '',
    inventoryContactPerson: '',
    companyTaxNumber: '',
    companyBranch: '',
    brokerTaxNumber: '',
    managerIdCard: '',
    modeOfTransport: '',
    loadPort: '',
    destinationCountryCode: '',
    invoiceNumber: '',
    invoiceDate: '',
    tradeTerms: '',
    freightFee: 0,
    insuranceAmount: 0,
    netWeight: 0,
    fobValueForeign: 0,
    currencyCode: '',
    contractPricePerKg: 0,
    paymentAccountId: '',
    paymentAmount: 0,
    items: [],
  });

  showConfirmDialog = signal(false);

  readonly accounts = MOCK_LINKED_BANK_ACCOUNTS;

  // Required (*) fields mirror the "M" entries in the กวก. column of the Rubber License Request
  // Message (e-SFR, V1.0) data dictionary — same gating pattern as RubberEqcRequestEditorComponent.
  // referenceNumber/senderRegistrationId/licenseType are "M" too but system-issued or locked, so
  // excluded here for the same reason as e-QC's equivalent fields. Payment fields aren't sourced
  // from this dictionary at all (its own payment fields are all "ไม่ใช้") — paymentAccountId stays
  // required because the payment section itself is untouched, carried over as-is from before.
  private readonly REQUIRED_HEADER_KEYS: (keyof RubberEsfrRequestData)[] = [
    'tradeLicenseNo', 'exportLicenseNo', 'inventoryName', 'inventoryStreet', 'inventoryDistrict',
    'inventorySubProvince', 'inventoryProvince', 'inventoryPhone', 'inventoryContactPerson',
    'companyTaxNumber', 'companyBranch', 'modeOfTransport', 'loadPort', 'destinationCountryCode',
    'invoiceNumber', 'invoiceDate', 'tradeTerms', 'freightFee', 'insuranceAmount', 'netWeight',
    'fobValueForeign', 'currencyCode', 'contractPricePerKg', 'paymentAccountId',
  ];
  private readonly REQUIRED_ITEM_KEYS: (keyof RubberEsfrRequestItem)[] = [
    'invoiceItemNo', 'tariffCode', 'statisticalCode', 'descriptionTh', 'descriptionEn', 'rubberCode',
    'weight', 'weightUnitCode', 'drc', 'contractDate', 'priceValueFreight', 'priceValueBaht',
    'netPriceValueFreight', 'netPriceValueBaht',
  ];

  ngOnInit(): void {
    const existing = this.chat.esfrRequest;
    if (existing) {
      this.local.set(existing);
      return;
    }

    const profileCode = (this.chat.spnSession()?.profile ?? 'NETB').padEnd(4, 'X').slice(0, 4).toUpperCase();
    const referenceNumber = `${profileCode}${String(Date.now()).slice(-9).padStart(9, '0')}`;
    const senderRegistrationId = `${profileCode}-SND-${String(Date.now()).slice(-6)}`;
    const paymentAccountId = this.accounts.find(a => a.isDefault)?.id ?? this.accounts[0]?.id ?? '';
    this.local.update(d => ({ ...d, referenceNumber, senderRegistrationId, paymentAccountId }));

    // Every compound-rubber item from the e-QC round needs its own Quality Certificate entry —
    // in this mock all of them share the single e-QC certificate the user just obtained.
    const eqcCertNo = this.chat.eqcCertificateNo;
    const today = new Date().toISOString().slice(0, 10);

    const items: RubberEsfrRequestItem[] = this.chat.pendingRubberItems.map((item, i) => ({
      invoiceItemNo: String(i + 1).padStart(4, '0'),
      tariffCode: item.hsCode ?? '', // resumed sessions only reconstruct `.name` (see
                                      // restoreStateFromMessages()), so this can genuinely be undefined
      statisticalCode: '',
      descriptionTh: '',
      descriptionEn: item.name,
      rubberCode: '',
      weight: 0,
      weightUnitCode: 'KGM',
      drc: 0,
      contractDate: '',
      priceValueFreight: 0,
      priceValueBaht: 0,
      netPriceValueFreight: 0,
      netPriceValueBaht: 0,
      certificates: [
        {
          certificateNumber: eqcCertNo,
          certificateItemNo: '0001',
          certificateIssueAuthority: '0994001057192',
          certificateIssueDate: today,
        },
      ],
    }));
    this.local.update(d => ({ ...d, items }));
  }

  addCertificate(item: RubberEsfrRequestItem): void {
    item.certificates.push({ certificateNumber: '', certificateItemNo: '', certificateIssueAuthority: '', certificateIssueDate: '' });
  }

  removeCertificate(item: RubberEsfrRequestItem, index: number): void {
    item.certificates.splice(index, 1);
  }

  private isFilled(value: unknown): boolean {
    return value !== undefined && value !== null && String(value).trim() !== '';
  }

  /** Plain method (not computed()) — same reasoning as RubberEqcRequestEditorComponent.canSave(). */
  canSave(): boolean {
    const d = this.local();
    const headerOk = this.REQUIRED_HEADER_KEYS.every(k => this.isFilled(d[k]));
    const itemsOk = d.items.length > 0 && d.items.every(item =>
      this.REQUIRED_ITEM_KEYS.every(k => this.isFilled(item[k]))
    );
    return headerOk && itemsOk;
  }

  /** Cess export fee — summed from THIS drawer's own items' Weight now that e-SFR has its own item
   *  list (rather than reading e-QC's items, like the pre-spec placeholder version did). */
  computedPaymentAmount(): number {
    const d = this.local();
    return d.items.reduce((sum, item) => sum + rateForExportWeight(item.weight ?? 0, false), 0);
  }

  onSave(): void {
    if (!this.canSave()) return;
    this.showConfirmDialog.set(true);
  }

  confirmSave(): void {
    this.showConfirmDialog.set(false);
    this.local.update(d => ({ ...d, paymentAmount: this.computedPaymentAmount() }));
    this.chat.saveEsfrRequest(this.local());
  }

  onClose(): void {
    this.chat.closeEsfrEditor();
  }
}
