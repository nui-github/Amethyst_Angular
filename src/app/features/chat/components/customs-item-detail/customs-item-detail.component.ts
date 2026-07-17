import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomsDeclarationItem } from '@app/core/models/types';

interface CidField { label: string; path: string; wide?: boolean; }

/**
 * Editable body for a single CustomsDeclarationItem — the full GoodsShipment field set from the
 * real LPI submission JSON. Shared between ocr-results (first OCR read) and form-preview (final
 * review before submit) so both show the exact same structure and the same click-to-edit UX;
 * each host wraps this in its own modal chrome, passes [readOnly] once its own card is
 * proceeded/saved, and merges (itemChange) back into its local customsDeclaration.items.
 */
@Component({
  selector: 'app-customs-item-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [CommonModule],
  templateUrl: './customs-item-detail.component.html',
  styleUrl: './customs-item-detail.component.scss',
})
export class CustomsItemDetailComponent {
  @Input({ required: true }) set item(val: CustomsDeclarationItem) {
    this.local = structuredClone(val);
  }
  get item(): CustomsDeclarationItem { return this.local; }
  private local!: CustomsDeclarationItem;

  @Input() readOnly = false;
  @Output() itemChange = new EventEmitter<CustomsDeclarationItem>();

  editingKey: string | null = null;

  private readonly el = inject(ElementRef);

  readonly productFields: CidField[] = [
    { label: 'ลำดับรายการในใบขน', path: 'declarationLineNumber' },
    { label: 'ลำดับรายการใน Invoice', path: 'invoiceItemNumber' },
    { label: 'ชื่อสินค้า (TH)', path: 'nameTh' },
    { label: 'ชื่อสินค้า (EN)', path: 'nameEn' },
    { label: 'พิกัดศุลกากร', path: 'tariffCode' },
    { label: 'รหัสสถิติ', path: 'statisticalCode' },
    { label: 'รหัสสินค้าควบคุม', path: 'restrictedGoodsCode' },
    { label: 'ลักษณะสินค้า', path: 'characteristic' },
    { label: 'ยี่ห้อ', path: 'brandName' },
    { label: 'ผู้ผลิต', path: 'manufacture' },
  ];

  readonly quantityFields: CidField[] = [
    { label: 'ปริมาณ', path: 'quantity' },
    { label: 'หน่วยปริมาณ', path: 'quantityUnit' },
    { label: 'น้ำหนักสุทธิ', path: 'netWeight' },
    { label: 'หน่วยน้ำหนัก', path: 'netWeightUnit' },
    { label: 'จำนวนหีบห่อ', path: 'packageAmount' },
    { label: 'หน่วยหีบห่อ', path: 'packageUnit' },
    { label: 'ประเทศกำเนิด', path: 'originCountry' },
    { label: 'ประเทศที่ซื้อ', path: 'purchaseCountry' },
    { label: 'มูลค่า (สกุลเงินต่างประเทศ)', path: 'invoiceAmountForeign' },
    { label: 'สกุลเงิน', path: 'currencyCode' },
    { label: 'มูลค่า (บาท)', path: 'invoiceAmountBaht' },
    { label: 'เลขที่ Invoice', path: 'invoiceNo' },
  ];

  readonly locationFields: CidField[] = [
    { label: 'รหัสคลังสินค้า', path: 'location.goodsCode' },
    { label: 'ชื่อคลังสินค้า', path: 'location.goodsName' },
    { label: 'ที่อยู่', path: 'location.streetAndNumber', wide: true },
    { label: 'แขวง/ตำบล', path: 'location.district' },
    { label: 'เขต/อำเภอ', path: 'location.subProvince' },
    { label: 'จังหวัด', path: 'location.province' },
    { label: 'รหัสไปรษณีย์', path: 'location.postcode' },
    { label: 'โทรศัพท์', path: 'location.phoneNumber' },
    { label: 'โทรสาร', path: 'location.faxNumber' },
  ];

  readonly dangerousFields: CidField[] = [
    { label: 'ชื่อ (TH)', path: 'dangerousTh' },
    { label: 'ชื่อ (EN)', path: 'dangerousEn' },
    { label: 'ข้อมูลเพิ่มเติม', path: 'dangerousInfo', wide: true },
  ];

  readonly otherFields: CidField[] = [
    { label: 'Certificate of Analysis', path: 'certificateAnalysis' },
    { label: 'หมายเหตุ', path: 'remark', wide: true },
  ];

  productionFields(i: number): CidField[] {
    return [
      { label: 'Lot No.', path: `productions.${i}.lotNo` },
      { label: 'วันที่ผลิต', path: `productions.${i}.mfgDate` },
      { label: 'วันหมดอายุ', path: `productions.${i}.expDate` },
      { label: 'ปริมาณ', path: `productions.${i}.quantity` },
      { label: 'หน่วยปริมาณ', path: `productions.${i}.quantityUnit` },
    ];
  }

  sourceFields(i: number): CidField[] {
    return [
      { label: 'เลขใบอนุญาต', path: `sources.${i}.licenseNumber` },
      { label: 'อ้างอิงแหล่งที่มา', path: `sources.${i}.sourceReference` },
      { label: 'ชื่อวัสดุกัมมันตรังสี', path: `sources.${i}.radioactiveMaterial` },
      { label: 'ปริมาณสาร', path: `sources.${i}.radioactiveQty` },
      { label: 'หน่วย', path: `sources.${i}.radioactiveUnit` },
      { label: 'จำนวน', path: `sources.${i}.amount` },
    ];
  }

  authorityFields(i: number): CidField[] {
    return [
      { label: 'หน่วยงาน', path: `authorities.${i}.agency` },
      { label: 'เลขใบอนุญาต (เลข U)', path: `authorities.${i}.licenseNumber` },
    ];
  }

  private getByPath(path: string): unknown {
    return path.split('.').reduce<unknown>(
      (acc, key) => (acc == null ? acc : (acc as Record<string, unknown>)[key]),
      this.local,
    );
  }

  private setByPath(path: string, value: string): void {
    const keys = path.split('.');
    const last = keys.pop()!;
    const target = keys.reduce<unknown>(
      (acc, key) => (acc == null ? acc : (acc as Record<string, unknown>)[key]),
      this.local,
    ) as Record<string, unknown> | undefined;
    if (target) target[last] = value;
  }

  value(path: string): string {
    const v = this.getByPath(path);
    return v == null ? '' : String(v);
  }

  display(path: string): string {
    const v = this.value(path);
    return v.trim() ? v : '—';
  }

  startEdit(path: string): void {
    if (this.readOnly) return;
    this.editingKey = path;
    setTimeout(() => {
      const input = this.el.nativeElement.querySelector(`[data-cid-key="${path}"]`) as HTMLInputElement;
      input?.focus(); input?.select();
    }, 20);
  }

  onInput(path: string, event: Event): void {
    this.setByPath(path, (event.target as HTMLInputElement).value);
  }

  commitEdit(): void {
    if (this.editingKey) this.itemChange.emit(this.local);
    this.editingKey = null;
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === 'Escape') this.commitEdit();
  }
}
