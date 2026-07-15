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

  ngOnInit(): void {
    const decl = this.chat.formData().customsDeclaration;
    if (decl) {
      this.local.set({
        referenceNumber: decl.referenceNumber || '',
        receiveNumber: decl.registrationId || '',
        ddcLicenseNumber: decl.companyName || '',
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
        consigneeName: '',
        consigneeStreet: '',
        consigneeDistrict: '',
        consigneeSubProvince: '',
        consigneeProvince: '',
        consigneePostcode: '',
        consigneeCountryCode: '',
        portOfDischarge: decl.portDischargeCode || '',
        departureDate: decl.departureDate || '',
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
        items: (decl.items || []) as any,
      });
    }
  }

  onSave(): void {
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
