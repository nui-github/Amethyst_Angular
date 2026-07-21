import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ChatService } from '@app/core/services/chat.service';
import { RubberEqcRequestData, RubberEqcRequestItem } from '@app/core/models/types';
import { X, Save } from 'lucide-angular';

@Component({
  selector: 'app-rubber-eqc-request-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './rubber-eqc-request-editor.component.html',
  styleUrls: ['./rubber-eqc-request-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RubberEqcRequestEditorComponent implements OnInit {
  private readonly chat = inject(ChatService);

  readonly icClose = X;
  readonly icSave = Save;

  local = signal<RubberEqcRequestData>({
    jobNumber: '',
    documentType: '',
    testReason: '',
    companyCode: '',
    brokerCode: '',
    managerCode: '',
    managerId: '',
    producerName: '',
    invoiceNo: '',
    testGroup: '',
    labCode: '',
    totalSamples: 0,
    documentLanguage: '',
    deliveryMethod: '',
    contactName: '',
    contactPhone: '',
    rubberLicenseNo: '',
    cancelReferenceNo: '',
    applicantCompanyName: '',
    exporterCompanyName: '',
    managerName: '',
    brokerCompanyName: '',
    invoiceDate: '',
    isUrgent: false,
    labNameTh: '',
    sampleReturn: 'no-return',
    paymentMethod: '',
    items: [],
  });

  showConfirmDialog = signal(false);

  // Required (*) fields — matches the red-boxed fields on RAOT's own e-QC request form. Save
  // stays disabled until every one of these is filled, same gating pattern as DdcPinkFormEditor.
  private readonly REQUIRED_HEADER_KEYS: (keyof RubberEqcRequestData)[] = [
    'documentType', 'testReason', 'companyCode', 'brokerCode', 'managerCode', 'labCode',
    'documentLanguage', 'paymentMethod',
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

    const items: RubberEqcRequestItem[] = this.chat.pendingRubberItems.map((item, i) => ({
      itemNo: String(i + 1).padStart(4, '0'),
      invoiceItemNo: '',
      destCountryCode: '',
      descriptionEn: item.name,
      descriptionTh: '',
      contractNo: '',
      rubberType: '',
      rubberSpecies: '',
      sampleNo: '',
      inspectionType: '',
      sampleType: '',
      weight: 0,
      quantity: 0,
      packageAmount: 0,
      exportWeight: 0,
      productionFormula: 0,
      estWeightPerLot: 0,
      firstGradeNo: 0,
      packagePerLot: 0,
      lastGradeNo: 0,
      piecePerPackage: 0,
      rubberQuantity: 0,
      productionDate: '',
      uncertaintyTopic: '',
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

  onSave(): void {
    if (!this.canSave()) return;
    this.showConfirmDialog.set(true);
  }

  confirmSave(): void {
    this.showConfirmDialog.set(false);
    this.chat.saveRubberEqcRequest(this.local());
  }

  onClose(): void {
    this.chat.closeRubberEqcEditor();
  }
}
