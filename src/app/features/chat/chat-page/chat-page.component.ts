import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NzInputModule } from 'ng-zorro-antd/input';
import { LucideAngularModule, Send, Paperclip, Upload, Eye, FileCheck2, List, PanelLeftOpen, Landmark, FileOutput } from 'lucide-angular';
import { ChatService } from '@app/core/services/chat.service';
import { QueueService } from '@app/core/services/queue.service';
import { ChatAreaComponent } from '../components/chat-area/chat-area.component';
import { SidebarComponent } from '../components/sidebar/sidebar.component';
import { CustomsDeclarationEditorComponent } from '../components/customs-declaration-editor/customs-declaration-editor.component';
import { DdcPinkFormEditorComponent } from '../components/ddc-pink-form-editor/ddc-pink-form-editor.component';
import { RubberEqcRequestEditorComponent } from '../components/rubber-eqc-request-editor/rubber-eqc-request-editor.component';

@Component({
  selector: 'app-chat-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule, RouterModule,
    NzInputModule, LucideAngularModule,
    ChatAreaComponent, SidebarComponent, CustomsDeclarationEditorComponent, DdcPinkFormEditorComponent,
    RubberEqcRequestEditorComponent,
  ],
  templateUrl: './chat-page.component.html',
  styleUrl:    './chat-page.component.scss',
})
export class ChatPageComponent {
  readonly chat   = inject(ChatService);
  readonly queue  = inject(QueueService);
  readonly router = inject(Router);

  readonly icSend       = Send;
  readonly icPaperclip  = Paperclip;
  readonly icUpload     = Upload;
  readonly icEye        = Eye;
  readonly icFileCheck  = FileCheck2;
  readonly icList       = List;
  readonly icLandmark   = Landmark;
  readonly icFileOutput = FileOutput;
  readonly icPanelOpen  = PanelLeftOpen;

  inputText = '';
  collapsed = signal(false);

  /** True when only the initial welcome message exists (no user messages yet) */
  readonly isWelcome = computed(() =>
    this.chat.messages().length === 1 && this.chat.messages()[0].type === 'welcome'
  );

  /** Show DDC Pink Form only for กรมควบคุมโรค (DDC) — the other two export agencies
   *  (การยาง, เชื้อเพลิง) and every import flow use the generic CustomsDeclarationEditorComponent. */
  readonly showDdcForm = computed(() =>
    this.chat.declarationEditorOpen() && this.chat.currentAgencyName === 'กรมควบคุมโรค'
  );

  goToQueue(): void { this.router.navigate(['/queue']); }

  send(): void {
    if (!this.inputText.trim()) return;
    this.chat.send(this.inputText.trim());
    this.inputText = '';
  }

  onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.send(); }
  }

  toggleSidebar(): void { this.collapsed.update(v => !v); }
}
