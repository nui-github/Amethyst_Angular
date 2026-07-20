import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { ChatService } from '@app/core/services/chat.service';
import { CustomsDeclarationData } from '@app/core/models/types';
import { X, Save } from 'lucide-angular';

@Component({
  selector: 'app-ddc-pink-form-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    NzButtonModule,
    NzInputModule,
    NzSelectModule,
  ],
  templateUrl: './ddc-pink-form-editor.component.html',
  styleUrls: ['./ddc-pink-form-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DdcPinkFormEditorComponent implements OnInit {
  private readonly chat = inject(ChatService);

  readonly icClose = X;
  readonly icSave = Save;

  local = signal<DdcPinkFormData>({
    // Control
    referenceNumber: '',
    receiveNumber: '',
    ddcLicenseNumber: '',
    ddcLicenseIssueDate: '',
    ddcEffectiveDate: '',
    ddcExpireDate: '',
    ddcLicenseName: '',
    // Shipper
    shipperTaxNumber: '',
    shipperBranch: '',
    shipperEnglishName: '',
    shipperStreet: '',
    shipperDistrictName: '',
    shipperSubProvinceName: '',
    shipperProvinceName: '',
    shipperPostcode: '',
    shipperCountryCode: 'TH',
    shipperManagerName: '',
    shipperManagerIdCard: '',
    // Consignee
    consigneeName: '',
    consigneeStreet: '',
    consigneeDistrict: '',
    consigneeSubProvince: '',
    consigneeProvince: '',
    consigneePostcode: '',
    consigneeCountryCode: '',
    // Export details
    portOfDischarge: '',
    departureDate: '',
    invoiceNumber: '',
    invoiceDate: '',
    poNumber: '',
    objectiveOfExport: '',
    modeOfTransport: '',
    brandName: '',
    totalForeignValue: undefined,
    currencyCode: 'USD',
    totalQuantity: undefined,
    totalQuantityUnit: '',
    totalItemNumber: '',
    numberOfCopy: '',
    remark: '',
    items: [],
  });

  showConfirmDialog = signal(false);

  // Required (*) fields — see template. Save stays disabled until every one of these is filled,
  // matching what a real DDC submission would reject as incomplete.
  private readonly REQUIRED_HEADER_KEYS: (keyof DdcPinkFormData)[] = [
    'shipperEnglishName', 'shipperTaxNumber', 'consigneeName', 'consigneeCountryCode',
    'departureDate', 'invoiceNumber', 'modeOfTransport', 'totalQuantity', 'totalItemNumber',
  ];
  private readonly REQUIRED_ITEM_KEYS: (keyof DdcPinkFormItem)[] = [
    'productType', 'nameTh', 'nameEn', 'quantity', 'quantityUnit', 'quantityUnitTextTh',
    'packageUnit', 'packageUnitTextTh', 'productionDate', 'expirationDate',
    'productionProvinceCode', 'productionProvinceName', 'productionSubProvinceCode', 'productionSubProvinceName',
    'productionDistrictCode', 'productionDistrictName',
  ];

  ngOnInit(): void {
    const decl = this.chat.formData().customsDeclaration;
    if (!decl) return;

    // decl.items spans every item on the shared invoice (rubber/fuel/pathogen-kit/etc. — see
    // formData.selectedItems' own "whole invoice is the request" convention), but this
    // certificate is DDC-specific — narrow down to just the item(s) item-hs-analysis actually
    // grouped under กรมควบคุมโรค. Falls back to every item when nothing's confirmed yet (e.g. a
    // queue-history replay that never went through that step).
    const ddcItemNumbers = this.chat.declarationItemNumbersForAgency('กรมควบคุมโรค');
    const declItems = ddcItemNumbers.size
      ? (decl.items || []).filter(i => ddcItemNumbers.has(i.itemNumber))
      : (decl.items || []);

    // Every field below is mapped straight off what OCR already read from the uploaded
    // invoice/customs declaration (see CustomsDeclarationItem/.productions) — left blank only
    // when that data genuinely isn't captured anywhere upstream (DDC-assigned license fields,
    // the foreign consignee's name/address, unit/location CODES, and the ประเภทอาหาร
    // classification), so what's left empty here is exactly what still needs a human to open
    // the source document and key in by hand.
    const items: DdcPinkFormItem[] = declItems.map(item => {
      const production = item.productions?.[0];
      return {
        itemNumber: item.itemNumber,
        invoiceItemNumber: item.invoiceItemNumber,
        productType: '', // ประเภทอาหาร is a regulatory classification, not literal document content
        tariffCode: item.tariffCode || '',
        statisticalCode: item.statisticalCode || '',
        nameTh: item.nameTh || '',
        nameEn: item.nameEn || '',
        quantity: item.quantity ? Number(item.quantity) : undefined,
        quantityUnit: '', // no unit-CODE system in the OCR data (only the Thai name below) — manual
        quantityUnitTextTh: item.quantityUnit || '',
        packageUnit: item.packageUnit || '',
        packageUnitTextTh: '', // Thai package-unit name (e.g. "ลัง") isn't captured separately — manual
        productionDate: production?.mfgDate || '',
        expirationDate: production?.expDate || '',
        productionProvinceCode: '', // no admin code anywhere upstream — manual
        productionProvinceName: this.extractManufactureProvince(item.manufacture),
        productionSubProvinceCode: '',
        productionSubProvinceName: '',
        productionDistrictCode: '',
        productionDistrictName: '',
      };
    });

    const fd = this.chat.formData();
    // vesselName only gets OCR'd off an actual sea-freight bill of lading/declaration — its
    // presence is a reasonable stand-in for "ทางเรือ" until a real mode-of-transport field exists
    const modeOfTransport = decl.vesselName ? '1' : '';
    const totalQuantity = items.reduce((sum, i) => sum + (i.quantity || 0), 0) || undefined;

    this.local.set({
      referenceNumber: decl.referenceNumber || '',
      receiveNumber: decl.registrationId || '',
      ddcLicenseNumber: '', // assigned by DDC itself once approved — never on the exporter's own documents
      ddcLicenseIssueDate: '',
      ddcEffectiveDate: '',
      ddcExpireDate: '',
      ddcLicenseName: '',
      shipperTaxNumber: decl.companyTaxNumber || '',
      shipperBranch: decl.companyBranch || '',
      shipperEnglishName: decl.companyName || '',
      shipperStreet: '',
      shipperDistrictName: '',
      shipperSubProvinceName: '',
      shipperProvinceName: '',
      shipperPostcode: '',
      shipperCountryCode: 'TH',
      shipperManagerName: decl.informantName || '',
      shipperManagerIdCard: decl.informantIdCard || '',
      consigneeName: '', // foreign buyer isn't captured anywhere in the OCR data model yet — manual
      consigneeStreet: '',
      consigneeDistrict: '',
      consigneeSubProvince: '',
      consigneeProvince: '',
      consigneePostcode: '',
      consigneeCountryCode: decl.destinationCountry || '',
      portOfDischarge: decl.portDischargeCode || '',
      departureDate: decl.departureDate || '',
      invoiceNumber: fd.invoiceNo || declItems[0]?.invoiceNo || '',
      invoiceDate: declItems[0]?.invoiceDate || '',
      poNumber: '',
      objectiveOfExport: '',
      modeOfTransport,
      brandName: '',
      totalForeignValue: undefined,
      currencyCode: 'USD',
      totalQuantity,
      totalQuantityUnit: items[0]?.quantityUnitTextTh || '',
      totalItemNumber: items.length ? String(items.length) : '',
      numberOfCopy: '',
      remark: '',
      items,
    });
  }

  private extractManufactureProvince(manufacture?: string): string {
    if (!manufacture) return '';
    const parts = manufacture.split(',');
    return parts.length > 1 ? parts[parts.length - 1].trim() : '';
  }

  private isFilled(value: unknown): boolean {
    return value !== undefined && value !== null && String(value).trim() !== '';
  }

  /** Plain method (not computed()) — items are mutated in place via [(ngModel)], so a memoized
   *  computed() wouldn't re-evaluate on every keystroke; this re-runs on each CD tick instead,
   *  same as every other live-validity check in this codebase (e.g. ItemMeasurementComponent). */
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
    const data = this.local();
    const updated: CustomsDeclarationData = {
      referenceNumber: data.referenceNumber,
      registrationId: data.receiveNumber,
      companyName: data.shipperEnglishName,
      companyTaxNumber: data.shipperTaxNumber,
      companyBranch: data.shipperBranch,
      informantName: data.shipperManagerName,
      informantIdCard: data.shipperManagerIdCard,
      portDischargeCode: data.portOfDischarge,
      departureDate: data.departureDate,
      items: data.items as any,
    };

    this.chat.saveDeclarationEditor(updated);
    this.showConfirmDialog.set(false);
  }

  onClose(): void {
    this.chat.closeDeclarationEditor();
  }
}

export interface DdcPinkFormData {
  // Control section
  referenceNumber: string;
  receiveNumber: string;
  ddcLicenseNumber: string;
  ddcLicenseIssueDate: string;
  ddcEffectiveDate: string;
  ddcExpireDate: string;
  ddcLicenseName: string;
  // Shipper
  shipperTaxNumber: string;
  shipperBranch: string;
  shipperEnglishName: string;
  shipperStreet: string;
  shipperDistrictName: string;
  shipperSubProvinceName: string;
  shipperProvinceName: string;
  shipperPostcode: string;
  shipperCountryCode: string;
  shipperManagerName: string;
  shipperManagerIdCard: string;
  // Consignee
  consigneeName: string;
  consigneeStreet: string;
  consigneeDistrict: string;
  consigneeSubProvince: string;
  consigneeProvince: string;
  consigneePostcode: string;
  consigneeCountryCode: string;
  // Export details
  portOfDischarge: string;
  departureDate: string;
  invoiceNumber: string;
  invoiceDate: string;
  poNumber: string;
  objectiveOfExport: string;
  modeOfTransport: string;
  brandName: string;
  totalForeignValue?: number;
  currencyCode: string;
  totalQuantity?: number;
  totalQuantityUnit: string;
  totalItemNumber: string;
  numberOfCopy: string;
  remark: string;
  items: DdcPinkFormItem[];
}

export interface DdcPinkFormItem {
  itemNumber?: number;
  invoiceItemNumber?: number;
  productType?: string;
  tariffCode?: string;
  statisticalCode?: string;
  nameTh?: string;
  nameEn?: string;
  quantity?: number;
  quantityUnit?: string;
  quantityUnitTextTh?: string;
  packageUnit?: string;
  packageUnitTextTh?: string;
  productionDate?: string;
  expirationDate?: string;
  productionProvinceCode?: string;
  productionProvinceName?: string;
  productionSubProvinceCode?: string;
  productionSubProvinceName?: string;
  productionDistrictCode?: string;
  productionDistrictName?: string;
}
