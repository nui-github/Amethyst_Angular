import {
  AfterViewChecked, ChangeDetectionStrategy, Component,
  ElementRef, Input, OnChanges, ViewChild, inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatMessage, FlagCardData, EmailDraftData, ChoiceCardData } from '@app/core/models/types';
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
import { FullUploadComponent } from '../full-upload/full-upload.component';
import { EmailDraftComponent } from '../email-draft/email-draft.component';
import { FormPanelComponent } from '../form-panel/form-panel.component';
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
    ConnectPanelComponent, FullUploadComponent, EmailDraftComponent, FormPanelComponent,
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

  asFlagCard(data: unknown)    { return data as FlagCardData; }
  asEmailDraft(data: unknown)  { return data as EmailDraftData; }
  asChoiceCard(data: unknown)  { return data as ChoiceCardData; }
  asAny(data: unknown)         { return data as Record<string, unknown>; }

  onChoice(msg: ChatMessage, value: string): void {
    const data = msg.data as ChoiceCardData;
    // Route choice to correct ChatService handler based on options present
    const hasEmail   = data.options.some(o => o.value === 'email');
    const hasSubmit  = data.options.some(o => o.value === 'submit');
    const hasConfirm = data.options.some(o => o.value === 'confirmed');

    if (hasEmail)   return this.chat.onProceedChoice(value);
    if (hasSubmit)  return this.chat.onPreviewChoice(value);
    if (hasConfirm) return this.chat.onPostEmailChoice(value);
  }
}
