import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ChatService } from '@app/core/services/chat.service';
import { RubberEqcRequestData, RubberEqcRequestItem } from '@app/core/models/types';
import { RUBBER_COMPOUND_CERT_FEE, MOCK_LINKED_BANK_ACCOUNTS, rateForExportWeight } from '@mock/rubber-cert.mock';
import { DatePickerComponent } from '@app/shared/components/date-picker/date-picker.component';
import { X, Save } from 'lucide-angular';

@Component({
  selector: 'app-rubber-eqc-request-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, DatePickerComponent],
  templateUrl: './rubber-eqc-request-editor.component.html',
  styleUrls: ['./rubber-eqc-request-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RubberEqcRequestEditorComponent implements OnInit {
  private readonly chat = inject(ChatService);

  readonly icClose = X;
  readonly icSave = Save;

  local = signal<RubberEqcRequestData>({
    referenceNumber: '',
    senderRegistrationId: '',
    companyTaxNumber: '',
    companyBranch: '',
    companyThaiName: '',
    companyEnglishName: '',
    street: '',
    district: '',
    subProvince: '',
    province: '',
    postcode: '',
    companyStrLicenseNo: '',
    brokerBranch: '',
    manufacturerTaxNumber: '',
    manufacturerBranch: '',
    manufacturerStrLicenseNo: '',
    labCode: '',
    certificateEnglishAddress: '',
    reasonType: '',
    documentType: '',
    documentLanguage: '',
    // RAOT (กยท.) only accepts value "3 - อิเล็กทรอนิกส์" for Delivery — no real choice to offer.
    deliveryMethod: '3',
    contactName: '',
    contactPhone: '',
    email: '',
    sampleReturn: 'no-return',
    isUrgent: false,
    // RAOT (กยท.) only accepts value "1 - e-Payment" for Payment Method — matches the linked
    // bank-account debit already collected on the next card (RubberCertPaymentComponent).
    paymentMethod: '1',
    paymentAccountId: '',
    paymentAmount: 0,
    creditAmount: 0,
    managerIdCard: '',
    managerName: '',
    items: [],
  });

  showConfirmDialog = signal(false);

  readonly accounts = MOCK_LINKED_BANK_ACCOUNTS;

  // Required (*) fields mirror the "M" entries in the กยท. column of RAOT's own Rubber
  // Certificate Request Message data dictionary — Save stays disabled until every one
  // of these is filled, same gating pattern as DdcPinkFormEditor. Fields the dictionary marks
  // "C" (conditional) are left out of this list and rendered as plain optional inputs instead,
  // since their condition depends on other field values this mock doesn't otherwise model.
  // deliveryMethod/paymentMethod/sampleReturn/isUrgent are also "M" in the dictionary but always
  // have a value here (fixed or default-selected), so gating on them would be a no-op —
  // referenceNumber/senderRegistrationId are "M" too but system-issued the same way, never
  // user-entered, so they're excluded here for the same reason.
  private readonly REQUIRED_HEADER_KEYS: (keyof RubberEqcRequestData)[] = [
    'companyTaxNumber', 'companyBranch', 'companyThaiName', 'companyEnglishName',
    'street', 'district', 'subProvince', 'province', 'postcode', 'labCode',
    'reasonType', 'documentType', 'documentLanguage', 'contactName', 'contactPhone',
    'paymentAccountId',
  ];
  private readonly REQUIRED_ITEM_KEYS: (keyof RubberEqcRequestItem)[] = [
    'inspectionType', 'rubberSpecies',
  ];

  ngOnInit(): void {
    // Reopened via "กรอกข้อมูล" after an earlier save — restore what was already filled instead
    // of resetting blank, so the user can actually edit rather than start over.
    const existing = this.chat.rubberEqcRequest;
    if (existing) {
      this.local.set(existing);
      return;
    }

    // Reference Number is system-issued (format XXXXnnnnnnnnn — XXXX = profile name, nnnnnnnnn =
    // running number), never typed by the user. Sender Registration ID (รหัสผู้ส่งข้อมูล) is the
    // same kind of system-issued value — reuse the same profile code, distinct running number so
    // it doesn't just echo Reference Number.
    const profileCode = (this.chat.spnSession()?.profile ?? 'NETB').padEnd(4, 'X').slice(0, 4).toUpperCase();
    const referenceNumber = `${profileCode}${String(Date.now()).slice(-9).padStart(9, '0')}`;
    const senderRegistrationId = `${profileCode}-SND-${String(Date.now()).slice(-6)}`;
    // Payment Amount is system-computed (same flat fee RubberCertPaymentComponent charges later
    // for this request), not user-entered; the default linked account is pre-selected the same
    // way RubberCertPaymentComponent pre-selects it.
    const paymentAccountId = this.accounts.find(a => a.isDefault)?.id ?? this.accounts[0]?.id ?? '';
    this.local.update(d => ({ ...d, referenceNumber, senderRegistrationId, paymentAmount: RUBBER_COMPOUND_CERT_FEE, paymentAccountId }));

    const items: RubberEqcRequestItem[] = this.chat.pendingRubberItems.map((item, i) => ({
      itemNo: String(i + 1).padStart(4, '0'),
      invoiceNumber: '',
      invoiceDate: '',
      invoiceItemNo: '',
      destCountryCode: '',
      descriptionEn: item.name,
      descriptionTh: '',
      contractNo: '',
      rubberSpecies: '',
      inspectionType: '',
      packageAmount: 0,
      exportWeight: 0,
      exportWeightUnit: '',
      productionFormula: 0,
      rubberQuantity: 0,
      remark: '',
      // DRC (ปริมาณเนื้อยางแห้ง) is the test every e-QC compound-rubber request actually needs —
      // pre-filled since it's not an optional choice, not a guess at unknown data.
      attributes: [
        { testItem: '102 - ปริมาณเนื้อยางแห้ง (DRC)', testMethod: '003 - ISO125:2011', uncertaintyTest: 'ทดสอบ' },
      ],
    }));
    this.local.update(d => ({ ...d, items }));
  }

  addAttribute(item: RubberEqcRequestItem): void {
    item.attributes.push({ testItem: '', testMethod: '', uncertaintyTest: '' });
  }

  removeAttribute(item: RubberEqcRequestItem, index: number): void {
    item.attributes.splice(index, 1);
  }

  private isFilled(value: unknown): boolean {
    return value !== undefined && value !== null && String(value).trim() !== '';
  }

  /** Plain method (not computed()) — same reasoning as DdcPinkFormEditorComponent.canSave():
   *  items are mutated in place via [(ngModel)], so a memoized computed() wouldn't re-evaluate
   *  on every keystroke; this re-runs on each CD tick instead. */
  canSave(): boolean {
    const d = this.local();
    const headerOk = this.REQUIRED_HEADER_KEYS.every(k => this.isFilled(d[k]));
    const itemsOk = d.items.length > 0 && d.items.every(item =>
      this.REQUIRED_ITEM_KEYS.every(k => this.isFilled(item[k]))
    );
    return headerOk && itemsOk;
  }

  /** Plain method (not computed()) — same reasoning as canSave(): items are mutated in place via
   *  [(ngModel)], so this needs to re-run every CD tick to reflect Export Weight/Is Urgent edits
   *  live, same pattern used throughout this component. One test sample (rate) per item. */
  computedPaymentAmount(): number {
    const d = this.local();
    return d.items.reduce((sum, item) => sum + rateForExportWeight(item.exportWeight ?? 0, d.isUrgent), 0);
  }

  onSave(): void {
    if (!this.canSave()) return;
    this.showConfirmDialog.set(true);
  }

  confirmSave(): void {
    this.showConfirmDialog.set(false);
    this.local.update(d => ({ ...d, paymentAmount: this.computedPaymentAmount() }));
    this.chat.saveRubberEqcRequest(this.local());
  }

  onClose(): void {
    this.chat.closeRubberEqcEditor();
  }
}
