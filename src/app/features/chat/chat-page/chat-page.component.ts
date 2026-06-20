import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NzInputModule } from 'ng-zorro-antd/input';
import { LucideAngularModule, Send, Paperclip, Upload, Eye, FileCheck2 } from 'lucide-angular';
import { ChatService } from '@app/core/services/chat.service';
import { QueueService } from '@app/core/services/queue.service';
import { ChatAreaComponent } from '../components/chat-area/chat-area.component';
import { SidebarComponent } from '../components/sidebar/sidebar.component';
import { ChatHeaderComponent } from '../components/chat-header/chat-header.component';

@Component({
  selector: 'app-chat-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule, RouterModule,
    NzInputModule, LucideAngularModule,
    ChatAreaComponent, SidebarComponent, ChatHeaderComponent,
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

  inputText  = '';
  collapsed  = signal(false);

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
