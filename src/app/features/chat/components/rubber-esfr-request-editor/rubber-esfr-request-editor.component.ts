import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ChatService } from '@app/core/services/chat.service';
import { RubberEsfrRequestData } from '@app/core/models/types';
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
    eqcCertificateNo: '',
    customsCheckpoint: '',
    exportPermitType: '',
    vesselOrTransport: '',
    expectedExportDate: '',
    contactName: '',
    contactPhone: '',
    remark: '',
    paymentAccountId: '',
    paymentAmount: 0,
  });

  showConfirmDialog = signal(false);

  readonly accounts = MOCK_LINKED_BANK_ACCOUNTS;

  // First-pass placeholder — no RAOT data dictionary for e-SFR yet (unlike e-QC's V1.10), so this
  // required list is a reasonable guess, not a spec-verified list. Revisit once a real reference
  // is available, same as REQUIRED_HEADER_KEYS in RubberEqcRequestEditorComponent originally was.
  private readonly REQUIRED_KEYS: (keyof RubberEsfrRequestData)[] = [
    'customsCheckpoint', 'exportPermitType', 'expectedExportDate', 'contactName', 'contactPhone',
    'paymentAccountId',
  ];

  ngOnInit(): void {
    const existing = this.chat.esfrRequest;
    if (existing) {
      this.local.set(existing);
      return;
    }

    const profileCode = (this.chat.spnSession()?.profile ?? 'NETB').padEnd(4, 'X').slice(0, 4).toUpperCase();
    const referenceNumber = `${profileCode}${String(Date.now()).slice(-9).padStart(9, '0')}`;
    const paymentAccountId = this.accounts.find(a => a.isDefault)?.id ?? this.accounts[0]?.id ?? '';
    // e-QC number and contact details already exist from the round just finished — carry them over
    // instead of asking the user to retype what this drawer's whole framing calls "additional" info.
    const eqcRequest = this.chat.rubberEqcRequest;
    this.local.update(d => ({
      ...d,
      referenceNumber,
      paymentAccountId,
      eqcCertificateNo: this.chat.eqcCertificateNo,
      contactName: eqcRequest?.contactName ?? '',
      contactPhone: eqcRequest?.contactPhone ?? '',
    }));
  }

  private isFilled(value: unknown): boolean {
    return value !== undefined && value !== null && String(value).trim() !== '';
  }

  /** Plain method (not computed()) — same reasoning as RubberEqcRequestEditorComponent.canSave(). */
  canSave(): boolean {
    const d = this.local();
    return this.REQUIRED_KEYS.every(k => this.isFilled(d[k]));
  }

  /** Cess export fee, computed from the e-QC request's own items (Export Weight × rate table) —
   *  this drawer doesn't re-collect items, so there's nothing new to sum here beyond what e-QC
   *  already captured. */
  computedPaymentAmount(): number {
    const eqcRequest = this.chat.rubberEqcRequest;
    if (!eqcRequest) return 0;
    return eqcRequest.items.reduce((sum, item) => sum + rateForExportWeight(item.exportWeight ?? 0, false), 0);
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
