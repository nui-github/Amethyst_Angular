import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, CheckCircle } from 'lucide-angular';
import { DmfControlData, DmfInvoiceData, PetroleumDutyDeclarationData, PetroleumOcrResultsData } from '@app/core/models/types';
import { ChatService } from '@app/core/services/chat.service';

interface PetroRow { label: string; key: string; required?: boolean; }
interface PetroSection { title: string; color: string; group: 'control' | 'invoice'; rows: PetroRow[]; }

// ข้อมูลตามคำร้อง "ขอออกของไปก่อน" เพื่อยกเว้นอากรนำเข้าสำหรับกิจการปิโตรเลียม (มาตรา 70
// พ.ร.บ.ปิโตรเลียม พ.ศ. 2514) — สคีมาตรงตาม DMF License Request message จริง (Control/Invoice),
// แยกจาก CustomsDeclarationData/getCustomsDeclarationHeaderSections โดยเจตนา (ดู PetroleumDutyDeclarationData)
export const PETROLEUM_DECL_SECTIONS: PetroSection[] = [
  { title: 'ข้อมูลควบคุมเอกสาร', color: '#0463EF', group: 'control', rows: [
    { label: 'เลขที่ใบขนสินค้า', key: 'declarationNo' },
    { label: 'วันที่ออกใบขน', key: 'declarationDate' },
    { label: 'เลขที่อ้างอิง', key: 'referenceNumber', required: true },
    { label: 'ชนิดเอกสาร', key: 'documentType', required: true },
  ]},
  { title: 'ข้อมูลบริษัทผู้นำเข้า', color: '#7C3AED', group: 'control', rows: [
    { label: 'เลขผู้เสียภาษี', key: 'companyTaxNumber', required: true },
    { label: 'สาขาที่', key: 'companyBranch', required: true },
    { label: 'ชื่อบริษัท (ไทย)', key: 'companyName', required: true },
    { label: 'ชื่อบริษัท (English)', key: 'companyEnglishName', required: true },
    { label: 'ที่อยู่', key: 'streetAndNumber', required: true },
    { label: 'ตำบล/แขวง', key: 'district' },
    { label: 'อำเภอ/เขต', key: 'subProvince' },
    { label: 'จังหวัด', key: 'province' },
    { label: 'รหัสไปรษณีย์', key: 'postcode', required: true },
  ]},
  { title: 'ตัวแทนออกของ / ผู้รับมอบอำนาจ', color: '#0D8F61', group: 'control', rows: [
    { label: 'เลขผู้เสียภาษีตัวแทนออกของ', key: 'brokerTaxNumber' },
    { label: 'สาขาตัวแทนออกของ', key: 'brokerBranch' },
    { label: 'เลขบัตร ผู้ปฏิบัติพิธีการ', key: 'customsClearanceIdCard', required: true },
    { label: 'ชื่อผู้ปฏิบัติพิธีการ', key: 'customsClearanceName', required: true },
    { label: 'เลขบัตร ผู้รับมอบอำนาจ', key: 'managerIdCard', required: true },
    { label: 'ชื่อผู้รับมอบอำนาจ', key: 'managerName', required: true },
  ]},
  { title: 'ข้อมูลการขนส่ง', color: '#0463EF', group: 'control', rows: [
    { label: 'ทางที่นำเข้า (Mode)', key: 'modeOfTransport', required: true },
    { label: 'ประเภทการบรรจุ', key: 'cargoTypeCode', required: true },
    { label: 'ชื่อยานพาหนะ', key: 'vesselName', required: true },
    { label: 'วันที่นำเข้า', key: 'arrivalDate', required: true },
    { label: 'เลขที่ใบตราส่ง (Master B/L)', key: 'masterBillOfLading' },
    { label: 'เลขที่ใบตราส่ง (House B/L)', key: 'houseBillOfLading', required: true },
    { label: 'รหัสสถานที่ตรวจปล่อยนอกสถานที่', key: 'outsideReleasePort' },
    { label: 'รหัสสถานที่ตรวจปล่อย', key: 'releasePort', required: true },
    { label: 'รหัสสถานที่นำเข้า', key: 'dischargePort', required: true },
    { label: 'ประเทศกำเนิด', key: 'originCountryCode', required: true },
    { label: 'ประเทศต้นทางบรรทุก', key: 'consignmentCountryCode', required: true },
  ]},
  { title: 'หีบห่อ / น้ำหนักรวม', color: '#7C3AED', group: 'control', rows: [
    { label: 'เครื่องหมาย/เลขหมายหีบห่อ', key: 'shippingMarks', required: true },
    { label: 'จำนวนหีบห่อรวม', key: 'totalPackageAmount', required: true },
    { label: 'ลักษณะหีบห่อ', key: 'totalPackageUnitCode', required: true },
    { label: 'น้ำหนักสุทธิรวม', key: 'totalNetWeight', required: true },
    { label: 'หน่วยน้ำหนักสุทธิ', key: 'netWeightUnitCode', required: true },
    { label: 'น้ำหนักรวม', key: 'totalGrossWeight', required: true },
    { label: 'หน่วยน้ำหนักรวม', key: 'totalGrossWeightUnitCode', required: true },
  ]},
  { title: 'มูลค่า / อัตราแลกเปลี่ยนรวม', color: '#0D8F61', group: 'control', rows: [
    { label: 'สกุลเงิน', key: 'currencyCode', required: true },
    { label: 'อัตราแลกเปลี่ยน', key: 'exchangeRate', required: true },
    { label: 'ราคา CIF (ตปท.)', key: 'cifValueForeign', required: true },
    { label: 'ราคา CIF (บาท)', key: 'cifValueBaht', required: true },
  ]},
  { title: 'การชำระเงิน', color: '#0463EF', group: 'control', rows: [
    { label: 'วิธีการชำระเงิน', key: 'paymentMethod', required: true },
    { label: 'ค่าภาษีอากรรวม', key: 'totalTax', required: true },
    { label: 'เงินประกันค่าภาษีรวม', key: 'totalDeposit', required: true },
    { label: 'รหัสธนาคาร RGS', key: 'rgsCode' },
    { label: 'รหัสธนาคารรับอนุญาตศุลกากร', key: 'customsBankCode' },
    { label: 'รหัสธนาคารตัดบัญชี', key: 'bankCode' },
    { label: 'รหัสสาขาธนาคาร', key: 'bankBranchCode' },
    { label: 'เลขที่บัญชีธนาคาร', key: 'bankAccountNumber' },
    { label: 'ยอดชำระที่ต้องการตัดบัญชี', key: 'totalPaymentAmount' },
  ]},
  { title: 'การวางประกัน (มาตรา 70 พ.ร.บ.ปิโตรเลียม)', color: '#B45309', group: 'control', rows: [
    { label: 'วิธีการวางประกัน', key: 'guaranteeMethod', required: true },
    { label: 'ประเภทการวางประกัน', key: 'guaranteeType' },
    { label: 'รหัสธนาคารค้ำประกัน', key: 'guaranteeBankCode' },
    { label: 'รหัสสาขาธนาคารค้ำประกัน', key: 'guaranteeBankBranchCode' },
    { label: 'เลขสัญญาหนังสือค้ำประกัน', key: 'guaranteeBankAccountNumber' },
    { label: 'ยอดวางประกันรวม', key: 'totalDepositAmount', required: true },
    { label: 'วันที่นำสินค้าออกจากคลัง', key: 'departureDate' },
    { label: 'รหัสสถานที่อนุมัติหลายเที่ยวเรือ', key: 'approvalPort' },
    { label: 'เลขที่อนุมัติหลายเที่ยวเรือ', key: 'approvalNumber' },
    { label: 'เลขทะเบียนผู้ใช้สิทธิประโยชน์', key: 'exportTaxIncentivesId' },
    { label: 'รหัสประจำตัวผู้ส่งข้อมูล', key: 'senderRegistrationId', required: true },
  ]},
  { title: 'ข้อมูลอินวอย', color: '#7C3AED', group: 'invoice', rows: [
    { label: 'เลขที่บัญชีราคาสินค้า', key: 'invoiceNumber', required: true },
    { label: 'วันที่บัญชีราคาสินค้า', key: 'invoiceDate', required: true },
    { label: 'เลขที่ใบสั่งซื้อ', key: 'purchaseOrderNumber', required: true },
    { label: 'เงื่อนไขการชำระเงิน', key: 'termOfPaymentCode', required: true },
    { label: 'เงื่อนไขการซื้อขาย (INCOTERMS)', key: 'tradeTerms', required: true },
    { label: 'ฐานะผู้ซื้อ', key: 'buyerStatus', required: true },
    { label: 'ฐานะผู้ขาย/ผู้ส่งของ', key: 'consignorStatus', required: true },
    { label: 'ระดับการค้า', key: 'commercialLevel', required: true },
    { label: 'ชื่อผู้ขาย/ผู้ส่งของ', key: 'consignorName', required: true },
    { label: 'ที่อยู่ผู้ขาย', key: 'streetAndNumber', required: true },
    { label: 'ตำบล/แขวง', key: 'district' },
    { label: 'อำเภอ/เขต', key: 'subProvince' },
    { label: 'จังหวัด/รัฐ', key: 'province' },
    { label: 'รหัสไปรษณีย์', key: 'postcode', required: true },
    { label: 'ประเทศผู้ขาย', key: 'countryCode', required: true },
    { label: 'สกุลเงินอินวอย', key: 'invoiceCurrencyCode', required: true },
    { label: 'ยอดเงินรวมอินวอย', key: 'totalInvoiceAmount', required: true },
  ]},
];

@Component({
  selector: 'app-petroleum-ocr-results',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './petroleum-ocr-results.component.html',
  styleUrl: './petroleum-ocr-results.component.scss',
})
export class PetroleumOcrResultsComponent {
  @Input() msgId = '';

  @Input({ required: true }) set data(val: Record<string, unknown>) {
    this.local = { ...(val as Partial<PetroleumOcrResultsData>) };
  }
  get data(): Record<string, unknown> { return this._data; }
  private _data!: Record<string, unknown>;

  local: Partial<PetroleumOcrResultsData> = {};
  editingKey: string | null = null;
  readonly proceeded = signal(false);

  readonly CheckCircle = CheckCircle;
  readonly chat = inject(ChatService);
  readonly cdr  = inject(ChangeDetectorRef);
  readonly el   = inject(ElementRef);

  readonly sections = PETROLEUM_DECL_SECTIONS;

  get declaration(): PetroleumDutyDeclarationData | undefined { return this.local.declaration; }
  get items() { return this.declaration?.items ?? []; }
  get declarationComplete(): boolean { return !!this.local.declarationComplete; }
  get declarationGateRequired(): boolean { return !!this.local.declarationGateRequired; }

  openEditor(): void { this.chat.openPetroleumEditor(this.msgId); }

  private groupData(group: 'control' | 'invoice'): DmfControlData | DmfInvoiceData | undefined {
    return group === 'control' ? this.declaration?.control : this.declaration?.invoice;
  }

  declValue(section: PetroSection, key: string): string {
    return ((this.groupData(section.group) as unknown as Record<string, string>)?.[key] ?? '').toString();
  }
  declHasValue(section: PetroSection, key: string): boolean { return this.declValue(section, key).trim().length > 0; }
  declDisplay(section: PetroSection, key: string): string { return this.declValue(section, key) || '—'; }
  sectionHasAnyValue(section: PetroSection): boolean { return section.rows.some(r => this.declHasValue(section, r.key)); }

  rowEditId(section: PetroSection, key: string): string { return section.group + ':' + key; }

  startDeclEdit(section: PetroSection, key: string): void {
    if (this.proceeded() || !this.declaration) return;
    this.editingKey = this.rowEditId(section, key);
    this.cdr.detectChanges();
    setTimeout(() => {
      const input = this.el.nativeElement.querySelector(`[data-decl-key="${this.editingKey}"]`) as HTMLInputElement;
      input?.focus(); input?.select();
    }, 20);
  }

  onDeclInput(section: PetroSection, key: string, event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    if (!this.local.declaration) return;
    if (section.group === 'control') {
      this.local.declaration = { ...this.local.declaration, control: { ...this.local.declaration.control, [key]: val } };
    } else {
      this.local.declaration = { ...this.local.declaration, invoice: { ...this.local.declaration.invoice, [key]: val } };
    }
  }

  commitEdit(): void { this.editingKey = null; this.cdr.detectChanges(); }
  onKeydown(event: KeyboardEvent): void { if (event.key === 'Enter' || event.key === 'Escape') this.commitEdit(); }

  proceed(): void {
    if (this.proceeded()) return;
    this.proceeded.set(true);
    this.cdr.detectChanges();
    this.chat.onPetroleumOcrProceed();
  }
}
