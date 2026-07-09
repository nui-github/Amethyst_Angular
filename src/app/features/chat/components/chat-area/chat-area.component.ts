import {
  AfterViewChecked, ChangeDetectionStrategy, Component,
  ElementRef, Input, OnChanges, ViewChild, inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatMessage, FlagCardData, EmailDraftData, ChoiceCardData, ItemHsAnalysisData, ProductHsAnalysis } from '@app/core/models/types';
import { ChatService } from '@app/core/services/chat.service';
import { OcrService } from '@app/core/services/ocr.service';
import { SafeHtmlPipe } from '@app/shared/pipes/safe-html.pipe';
import { TypingIndicatorComponent } from '../typing-indicator/typing-indicator.component';
import { FlagCardComponent } from '../flag-card/flag-card.component';
import { SpnResultComponent } from '../spn-result/spn-result.component';
import { SpnCardComponent } from '../spn-card/spn-card.component';
import { ChoiceCardComponent } from '../choice-card/choice-card.component';
import { OcrResultsComponent } from '../ocr-results/ocr-results.component';
import { StatusCardComponent } from '../status-card/status-card.component';
import { OcrProgressComponent } from '../ocr-progress/ocr-progress.component';
import { ImportLicenseMenuComponent } from '../import-license-menu/import-license-menu.component';
import { ConnectPanelComponent } from '../connect/connect-panel.component';
import { SpnConnectComponent } from '../spn-connect/spn-connect.component';
import { HsAnalysisComponent } from '../hs-analysis/hs-analysis.component';
import { FullUploadComponent } from '../full-upload/full-upload.component';
import { SingleUploadComponent } from '../single-upload/single-upload.component';
import { EmailDraftComponent } from '../email-draft/email-draft.component';
import { FormPanelComponent } from '../form-panel/form-panel.component';
import { FormPreviewComponent } from '../form-preview/form-preview.component';
import { MissingFieldsComponent } from '../missing-fields/missing-fields.component';
import { AgencyUploadComponent } from '../agency-upload/agency-upload.component';
import { ProfileSelectComponent } from '../profile-select/profile-select.component';
import { PermitStatusComponent } from '../permit-status/permit-status.component';
import { PaymentQrComponent } from '../payment-qr/payment-qr.component';
import { PaymentSlipComponent } from '../payment-slip/payment-slip.component';
import { ItemHsAnalysisComponent } from '../item-hs-analysis/item-hs-analysis.component';
import { NzSpinModule } from 'ng-zorro-antd/spin';

/**
 * ChatAreaComponent — renders a list of ChatMessage objects.
 *
 * readOnly=false (default): live chat — components are interactive.
 * readOnly=true: history view in QueuePage — components are display-only,
 *   interactive types show static summaries.
 *
 * The @switch block is the core of Phase 2: each MessageType maps to a
 * dedicated Angular component with typed @Input data. No window.__chat
 * bridge, no innerHTML for interactive content.
 */
@Component({
  selector: 'app-chat-area',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, SafeHtmlPipe, NzSpinModule,
    TypingIndicatorComponent, FlagCardComponent, SpnResultComponent,
    SpnCardComponent, ChoiceCardComponent, OcrResultsComponent,
    StatusCardComponent, OcrProgressComponent, ImportLicenseMenuComponent,
    ConnectPanelComponent, FullUploadComponent, SingleUploadComponent, EmailDraftComponent, FormPanelComponent,
    SpnConnectComponent, HsAnalysisComponent, FormPreviewComponent, MissingFieldsComponent, AgencyUploadComponent, ProfileSelectComponent, PermitStatusComponent,
    PaymentQrComponent, PaymentSlipComponent, ItemHsAnalysisComponent,
  ],
  templateUrl: './chat-area.component.html',
  styleUrl: './chat-area.component.scss',
})
export class ChatAreaComponent implements OnChanges, AfterViewChecked {
  @Input() messages: ChatMessage[] = [];
  @Input() isTyping = false;
  @Input() readOnly = false;

  @ViewChild('bottom') private bottomEl!: ElementRef<HTMLDivElement>;

  readonly chat = inject(ChatService);
  readonly ocr  = inject(OcrService);

  private shouldScroll = false;

  ngOnChanges(): void { this.shouldScroll = true; }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.bottomEl?.nativeElement.scrollIntoView({ behavior: 'smooth' });
      this.shouldScroll = false;
    }
  }

  asFlagCard(data: unknown)       { return data as FlagCardData; }
  asEmailDraft(data: unknown)     { return data as EmailDraftData; }
  asChoiceCard(data: unknown)     { return data as ChoiceCardData; }
  asItemHsAnalysis(data: unknown) { return data as ItemHsAnalysisData; }
  asAny(data: unknown)            { return data as Record<string, unknown>; }

  onItemHsAnalysisConfirmed(msgId: string, items: ProductHsAnalysis[]): void {
    this.chat.onItemHsAnalysisConfirmed(msgId, items);
  }
  hasRewindableChoice(): boolean {
    const msgs = this.messages;
    const done = msgs.some(m => m.type === 'status-card');
    return !done && msgs.some(m => m.type === 'choice-card');
  }

  uploadMode(msg: ChatMessage): 'customs' | 'invoice' | 'agency-docs' {
    const d = msg.data as Record<string, unknown> | undefined;
    if (d?.['mode'] === 'invoice') return 'invoice';
    if (d?.['mode'] === 'agency-docs') return 'agency-docs';
    return 'customs';
  }

  onChoice(msg: ChatMessage, value: string): void {
    const data = msg.data as ChoiceCardData;
    // Route choice to correct ChatService handler based on options present
    const hasEmail   = data.options.some(o => o.value === 'email');
    const hasSubmit  = data.options.some(o => o.value === 'submit');
    const hasConfirm = data.options.some(o => o.value === 'confirmed');

    const hasSpn    = data.options.some(o => o.value === 'spn');
    const hasImport = data.options.some(o => o.value === 'import');

    const hasMulti       = data.options.some(o => o.value.startsWith('dept:'));
    const hasNoMore      = data.options.some(o => o.value === 'no-more-agency');
    const hasAgencyKey   = data.options.some(o => o.value.startsWith('agency:'));
    const hasCheckStatus = data.options.some(o => o.value === 'check-status');

    if (hasImport)       return this.chat.onDocTypeChoice(value);
    if (hasSpn)          return this.chat.onCustomsDocsChoice(value);
    if (hasMulti)        return this.chat.onAgencyChoice(value);
    if (hasNoMore)       return this.chat.onNextAgencyChoice(value);
    if (hasAgencyKey)    return this.chat.onNextAgencyChoice(value);
    if (hasCheckStatus)  return this.chat.onCheckStatusChoice(value);
    if (hasEmail)   return this.chat.onProceedChoice(value);
    if (hasSubmit)  return this.chat.onPreviewChoice(value);
    if (hasConfirm) return this.chat.onPostEmailChoice(value);
  }
}
