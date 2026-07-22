import { ChangeDetectionStrategy, Component, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ClipboardList, Leaf, PencilLine, Send, CheckCircle2 } from 'lucide-angular';
import { RubberEsfrPreviewData } from '@app/core/models/types';
import { ChatService } from '@app/core/services/chat.service';
import { MOCK_LINKED_BANK_ACCOUNTS } from '@mock/rubber-cert.mock';

const MODE_OF_TRANSPORT_LABEL: Record<string, string> = {
  '1': '1 - ทางเรือ',
  '2': '2 - ทางรถไฟ',
  '3': '3 - ทางรถยนต์ (คนเดินทางบก)',
  '4': '4 - ทางเครื่องบิน',
};

@Component({
  selector: 'app-rubber-esfr-preview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="epv-wrap">
      <div class="epv-hd">
        <span class="epv-hd__icon">
          <lucide-icon [img]="ClipboardList" [size]="17" />
        </span>
        <div class="epv-hd__text">
          <p class="epv-title">ตรวจสอบข้อมูลก่อนส่งคำขอ e-SFR</p>
          <span class="epv-badge">{{ data.agency }}</span>
        </div>
      </div>

      <!-- ข้อมูลคำขอ -->
      <div class="epv-sec">
        <div class="epv-sec__hd" style="border-left-color: #0463EF;">ข้อมูลคำขอ</div>
        <div class="epv-grid">
          <div class="epv-row"><span>Reference Number</span><span>{{ display(req.referenceNumber) }}</span></div>
          <div class="epv-row"><span>Sender Registration ID</span><span>{{ display(req.senderRegistrationId) }}</span></div>
          <div class="epv-row"><span>License Type</span><span>1 - ส่งออก (Export)</span></div>
          <div class="epv-row"><span>Mode of Transport</span><span>{{ modeOfTransportLabel }}</span></div>
          <div class="epv-row"><span>Trade License No</span><span>{{ display(req.tradeLicenseNo) }}</span></div>
          <div class="epv-row"><span>Export License No</span><span>{{ display(req.exportLicenseNo) }}</span></div>
          <div class="epv-row"><span>Load Port</span><span>{{ display(req.loadPort) }}</span></div>
          <div class="epv-row"><span>Destination Country Code</span><span>{{ display(req.destinationCountryCode) }}</span></div>
        </div>
      </div>

      <!-- สถานที่เก็บสินค้าก่อนส่งออก -->
      <div class="epv-sec">
        <div class="epv-sec__hd" style="border-left-color: #7C3AED;">สถานที่เก็บสินค้าก่อนส่งออก</div>
        <div class="epv-grid">
          <div class="epv-row"><span>Inventory Name</span><span>{{ display(req.inventoryName) }}</span></div>
          <div class="epv-row"><span>Street and Number</span><span>{{ display(req.inventoryStreet) }}</span></div>
          <div class="epv-row"><span>District</span><span>{{ display(req.inventoryDistrict) }}</span></div>
          <div class="epv-row"><span>Sub Province</span><span>{{ display(req.inventorySubProvince) }}</span></div>
          <div class="epv-row"><span>Province</span><span>{{ display(req.inventoryProvince) }}</span></div>
          <div class="epv-row"><span>Postcode</span><span>{{ display(req.inventoryPostcode) }}</span></div>
          <div class="epv-row"><span>Phone Number</span><span>{{ display(req.inventoryPhone) }}</span></div>
          <div class="epv-row"><span>Contact Person</span><span>{{ display(req.inventoryContactPerson) }}</span></div>
        </div>
      </div>

      <!-- ข้อมูลบริษัทผู้ขออนุญาต -->
      <div class="epv-sec">
        <div class="epv-sec__hd" style="border-left-color: #D97706;">ข้อมูลบริษัทผู้ขออนุญาต</div>
        <div class="epv-grid">
          <div class="epv-row"><span>Company Tax Number</span><span>{{ display(req.companyTaxNumber) }}</span></div>
          <div class="epv-row"><span>Company Branch</span><span>{{ display(req.companyBranch) }}</span></div>
          <div class="epv-row"><span>Company Thai Name</span><span>{{ display(req.companyThaiName) }}</span></div>
          <div class="epv-row"><span>Company English Name</span><span>{{ display(req.companyEnglishName) }}</span></div>
          <div class="epv-row"><span>Company Street and Number</span><span>{{ display(req.companyStreet) }}</span></div>
          <div class="epv-row"><span>Company District</span><span>{{ display(req.companyDistrict) }}</span></div>
          <div class="epv-row"><span>Company Sub Province</span><span>{{ display(req.companySubProvince) }}</span></div>
          <div class="epv-row"><span>Company Province</span><span>{{ display(req.companyProvince) }}</span></div>
          <div class="epv-row"><span>Company Postcode</span><span>{{ display(req.companyPostcode) }}</span></div>
          <div class="epv-row"><span>Broker Tax Number</span><span>{{ display(req.brokerTaxNumber) }}</span></div>
          <div class="epv-row"><span>Broker Branch</span><span>{{ display(req.brokerBranch) }}</span></div>
          <div class="epv-row"><span>Manager ID Card</span><span>{{ display(req.managerIdCard) }}</span></div>
          <div class="epv-row"><span>Manager Name</span><span>{{ display(req.managerName) }}</span></div>
        </div>
      </div>

      <!-- ข้อมูลผู้ซื้อ / ใบสั่งซื้อ -->
      <div class="epv-sec">
        <div class="epv-sec__hd" style="border-left-color: #0D8F61;">ข้อมูลผู้ซื้อ / ใบสั่งซื้อ</div>
        <div class="epv-grid">
          <div class="epv-row"><span>Purchase Order Number</span><span>{{ display(req.purchaseOrderNumber) }}</span></div>
          <div class="epv-row"><span>Consignee Name</span><span>{{ display(req.consigneeName) }}</span></div>
          <div class="epv-row"><span>Purchase Country Code</span><span>{{ display(req.purchaseCountryCode) }}</span></div>
          <div class="epv-row"><span>Consignee Postcode</span><span>{{ display(req.consigneePostcode) }}</span></div>
          <div class="epv-row"><span>Consignee Street and Number</span><span>{{ display(req.consigneeStreet) }}</span></div>
          <div class="epv-row"><span>Consignee District</span><span>{{ display(req.consigneeDistrict) }}</span></div>
          <div class="epv-row"><span>Consignee Sub Province</span><span>{{ display(req.consigneeSubProvince) }}</span></div>
          <div class="epv-row"><span>Consignee Province</span><span>{{ display(req.consigneeProvince) }}</span></div>
        </div>
      </div>

      <!-- ข้อมูล Invoice และเงื่อนไขการค้า -->
      <div class="epv-sec">
        <div class="epv-sec__hd" style="border-left-color: #DC2626;">ข้อมูล Invoice และเงื่อนไขการค้า</div>
        <div class="epv-grid">
          <div class="epv-row"><span>Invoice Number</span><span>{{ display(req.invoiceNumber) }}</span></div>
          <div class="epv-row"><span>Invoice Date</span><span>{{ display(req.invoiceDate) }}</span></div>
          <div class="epv-row"><span>Trade Terms (INCOTERMS)</span><span>{{ display(req.tradeTerms) }}</span></div>
          <div class="epv-row"><span>Freight Fee</span><span>{{ req.freightFee | number:'1.2-2' }}</span></div>
          <div class="epv-row"><span>Insurance Amount Foreign</span><span>{{ req.insuranceAmount | number:'1.2-2' }}</span></div>
          <div class="epv-row"><span>Net Weight</span><span>{{ req.netWeight | number }} KGM</span></div>
          <div class="epv-row"><span>FOB Value Foreign</span><span>{{ req.fobValueForeign | number:'1.2-4' }} {{ req.currencyCode }}</span></div>
          <div class="epv-row"><span>Contract price/kg.</span><span>{{ req.contractPricePerKg | number:'1.2-4' }}</span></div>
        </div>
      </div>

      <!-- รายการสินค้า -->
      <div class="epv-sec">
        <div class="epv-sec__hd" style="border-left-color: #3B82F6;">รายการสินค้า ({{ req.items.length }})</div>
        <div class="epv-items">
          @for (item of req.items; track item.invoiceItemNo) {
            <div class="epv-item-card">
              <div class="epv-item-card__hd">
                <lucide-icon [img]="Leaf" [size]="13" />
                Item No. {{ item.invoiceItemNo }}
              </div>
              <div class="epv-grid epv-grid--item">
                <div class="epv-row"><span>Tariff Code</span><span>{{ display(item.tariffCode) }}</span></div>
                <div class="epv-row"><span>Statistical Code</span><span>{{ display(item.statisticalCode) }}</span></div>
                <div class="epv-row"><span>Rubber Code</span><span>{{ display(item.rubberCode) }}</span></div>
                <div class="epv-row epv-row--wrap"><span>Thai Description</span><span>{{ display(item.descriptionTh) }}</span></div>
                <div class="epv-row epv-row--wrap"><span>English Description</span><span>{{ display(item.descriptionEn) }}</span></div>
                <div class="epv-row"><span>Weight</span><span>{{ item.weight | number }} {{ item.weightUnitCode }}</span></div>
                <div class="epv-row"><span>Quantity</span><span>{{ item.quantity ? (item.quantity | number) + ' ' + display(item.quantityUnitCode) : '-' }}</span></div>
                <div class="epv-row"><span>DRC (%)</span><span>{{ item.drc ?? '-' }}</span></div>
                <div class="epv-row"><span>Contract Date</span><span>{{ display(item.contractDate) }}</span></div>
                <div class="epv-row"><span>Reduction Rate (%)</span><span>{{ item.reductionRate ?? '-' }}</span></div>
                <div class="epv-row"><span>Reduction Weight</span><span>{{ item.reductionWeight ?? '-' }}</span></div>
                <div class="epv-row"><span>Price Value Freight</span><span>{{ item.priceValueFreight ?? '-' }}</span></div>
                <div class="epv-row"><span>Price Value Baht</span><span>{{ item.priceValueBaht ?? '-' }}</span></div>
                <div class="epv-row"><span>Net Price Value Freight</span><span>{{ item.netPriceValueFreight ?? '-' }}</span></div>
                <div class="epv-row"><span>Net Price Value Baht</span><span>{{ item.netPriceValueBaht ?? '-' }}</span></div>
                <div class="epv-row"><span>Charging Weight</span><span>{{ item.chargingWeight ?? '-' }}</span></div>
                <div class="epv-row epv-row--wrap"><span>Remark</span><span>{{ display(item.remark) }}</span></div>
              </div>

              @if (item.certificates.length) {
                <div class="epv-certs">
                  <div class="epv-certs__hd">ใบรับรองคุณภาพ (Quality Certificate)</div>
                  <table class="epv-certs__table">
                    <thead>
                      <tr>
                        <th>Certificate Number</th>
                        <th>Item No.</th>
                        <th>Issue Authority</th>
                        <th>Issue Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (cert of item.certificates; track $index) {
                        <tr>
                          <td>{{ display(cert.certificateNumber) }}</td>
                          <td>{{ display(cert.certificateItemNo) }}</td>
                          <td>{{ display(cert.certificateIssueAuthority) }}</td>
                          <td>{{ display(cert.certificateIssueDate) }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </div>
          }
        </div>
      </div>

      <!-- การชำระเงิน -->
      <div class="epv-sec">
        <div class="epv-sec__hd" style="border-left-color: #F97316;">การชำระเงิน</div>
        <div class="epv-grid">
          <div class="epv-row"><span>Payment Method</span><span>1 - e-Payment</span></div>
          <div class="epv-row"><span>บัญชีที่ตัดชำระ</span><span>{{ paymentAccountLabel }}</span></div>
          <div class="epv-row"><span>Payment Amount (ค่าธรรมเนียม Cess)</span><span>฿{{ req.paymentAmount | number:'1.2-2' }}</span></div>
          <div class="epv-row"><span>Credit Amount</span><span>{{ req.creditAmount | number:'1.2-2' }}</span></div>
          <div class="epv-row"><span>Charges Rate (บาท/กก.)</span><span>{{ req.chargesRate | number:'1.2-2' }}</span></div>
          <div class="epv-row"><span>Total Amount RAOT</span><span>฿{{ req.totalAmountRaot | number:'1.2-2' }}</span></div>
          <div class="epv-row"><span>Announcement Number</span><span>{{ display(req.announcementNumber) }}</span></div>
          <div class="epv-row"><span>Announcement Date</span><span>{{ display(req.announcementDate) }}</span></div>
        </div>
      </div>

      @if (!isDone) {
        <div class="epv-ft">
          <button class="epv-btn epv-btn--outline" (click)="onEdit()" type="button">
            <lucide-icon [img]="PencilLine" [size]="14" />
            แก้ไขข้อมูล
          </button>
          <button class="epv-btn epv-btn--solid" (click)="onSubmit()" type="button">
            ส่งคำขอใบอนุญาต
            <lucide-icon [img]="Send" [size]="14" />
          </button>
        </div>
      } @else {
        <div class="epv-done">
          <lucide-icon [img]="CheckCircle2" [size]="15" />
          ส่งคำขอแล้ว
        </div>
      }
    </div>
  `,
  styles: [`
    .epv-wrap {
      display: flex; flex-direction: column; gap: 14px; padding: 6px 2px 2px;
    }
    .epv-hd {
      display: flex; align-items: flex-start; gap: 10px;
    }
    .epv-hd__icon {
      flex-shrink: 0;
      width: 32px; height: 32px; border-radius: 9px;
      display: flex; align-items: center; justify-content: center;
      background: rgba(4, 99, 239, 0.1); color: var(--bizx-blue);
    }
    .epv-hd__text {
      display: flex; flex-direction: column; gap: 5px; min-width: 0;
    }
    .epv-title {
      font-size: 14px; font-weight: 700; color: var(--bizx-navy); margin: 0; line-height: 1.4;
    }
    .epv-badge {
      align-self: flex-start;
      font-size: 10.5px; font-weight: 700; color: #0D8F61;
      background: rgba(13, 143, 97, 0.1);
      padding: 2px 9px; border-radius: 20px;
    }
    .epv-sec {
      display: flex; flex-direction: column; gap: 8px;
    }
    .epv-sec__hd {
      font-size: 12px; font-weight: 700; color: var(--bizx-navy);
      border-left: 3px solid; padding-left: 8px;
    }
    .epv-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 5px 16px;
      background: #FAFAFA; border: 1px solid #EEF0F6; border-radius: 10px;
      padding: 10px 12px;
    }
    .epv-grid--item {
      background: #fff;
    }
    .epv-row {
      display: flex; justify-content: space-between; gap: 8px;
      font-size: 12px; line-height: 1.6;

      span:first-child { color: #6B7280; flex-shrink: 0; }
      span:last-child { color: var(--bizx-navy); font-weight: 600; text-align: right; }
    }
    .epv-row--wrap {
      flex-direction: column; align-items: flex-start; gap: 2px;

      span:last-child { text-align: left; }
    }
    .epv-items {
      display: flex; flex-direction: column; gap: 10px;
    }
    .epv-item-card {
      border: 1px solid #E5E7EB; border-radius: 10px; overflow: hidden;
    }
    .epv-item-card__hd {
      display: flex; align-items: center; gap: 6px;
      font-size: 12.5px; font-weight: 700; color: var(--bizx-navy);
      background: #FAFAFA; border-bottom: 1px solid #EEF0F6;
      padding: 8px 12px;

      lucide-icon { color: #0D8F61; }
    }
    .epv-item-card .epv-grid {
      border: none; border-radius: 0;
    }
    .epv-certs {
      padding: 0 12px 10px;
    }
    .epv-certs__hd {
      font-size: 11px; font-weight: 700; color: #6B7280; margin: 6px 0;
    }
    .epv-certs__table {
      width: 100%; border-collapse: collapse; font-size: 11.5px;

      th, td {
        text-align: left; padding: 5px 8px; border: 1px solid #EEF0F6;
      }
      th {
        background: #FAFAFA; color: #6B7280; font-weight: 700;
      }
      td {
        color: var(--bizx-navy); font-weight: 500;
      }
    }
    .epv-ft {
      display: flex; gap: 8px; justify-content: flex-end;
    }
    .epv-btn {
      display: flex; align-items: center; justify-content: center; gap: 6px;
      padding: 8px 18px; border-radius: 8px; border: none;
      font-size: 13px; font-weight: 700; font-family: inherit;
      cursor: pointer; transition: opacity 0.15s, background 0.15s;
    }
    .epv-btn--solid {
      background: var(--bizx-blue); color: #fff;
      &:hover { background: #034DBA; }
    }
    .epv-btn--outline {
      background: #fff; color: var(--bizx-navy);
      border: 1.5px solid #E5E7EB;
      &:hover { border-color: var(--bizx-blue); color: var(--bizx-blue); }
    }
    .epv-done {
      display: flex; align-items: center; gap: 6px;
      font-size: 12.5px; font-weight: 700; color: #0D8F61; margin: 0;
    }
  `],
})
export class RubberEsfrPreviewComponent {
  @Input() msgId = '';
  @Input({ required: true }) data!: RubberEsfrPreviewData;
  @Input() interactive = true;

  readonly chat = inject(ChatService);
  readonly submitted = signal(false);
  readonly accounts = MOCK_LINKED_BANK_ACCOUNTS;

  readonly ClipboardList = ClipboardList;
  readonly Leaf = Leaf;
  readonly PencilLine = PencilLine;
  readonly Send = Send;
  readonly CheckCircle2 = CheckCircle2;

  // Same reasoning as RubberEsfrGateComponent.isDone — `submitted` covers the instant in-session
  // click, `!interactive` covers this card re-rendering already-sealed (history scroll-back, queue
  // resume, reload) where `submitted` starts false but the footer must stay non-actionable.
  get isDone(): boolean {
    return this.submitted() || !this.interactive;
  }

  get req(): RubberEsfrPreviewData['request'] {
    return this.data.request;
  }

  get modeOfTransportLabel(): string {
    return MODE_OF_TRANSPORT_LABEL[this.req.modeOfTransport] ?? this.display(this.req.modeOfTransport);
  }

  get paymentAccountLabel(): string {
    const account = this.accounts.find(a => a.id === this.req.paymentAccountId);
    return account ? `${account.bankName} ${account.accountNoMasked}${account.isDefault ? ' (บัญชีหลัก)' : ''}` : '-';
  }

  display(value: string | number | undefined | null): string {
    return value === undefined || value === null || value === '' ? '-' : String(value);
  }

  onEdit(): void {
    this.chat.openEsfrEditor(this.msgId);
  }

  onSubmit(): void {
    if (this.submitted()) return;
    this.submitted.set(true);
    this.chat.onEsfrPreviewSubmit(this.msgId);
  }
}
