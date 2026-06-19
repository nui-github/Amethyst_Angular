import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import {
  LucideAngularModule,
  MessageSquareText, LayoutDashboard, FileCheck2, Package,
  FileText, BarChart2, Settings, Plus, ChevronRight, Send,
  Paperclip, Bell, Activity, User, MoreHorizontal,
  Upload, Eye, List,
} from 'lucide-angular';
import { ChatService } from '@app/core/services/chat.service';
import { QueueService } from '@app/core/services/queue.service';
import { ChatAreaComponent } from '../components/chat-area/chat-area.component';

@Component({
  selector: 'app-chat-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule, RouterModule,
    NzToolTipModule, NzInputModule, NzBadgeModule,
    LucideAngularModule, ChatAreaComponent,
  ],
  providers: [
    { provide: 'lucide', useValue: {
      MessageSquareText, LayoutDashboard, FileCheck2, Package,
      FileText, BarChart2, Settings, Plus, ChevronRight, Send,
      Paperclip, Bell, Activity, User, MoreHorizontal, Upload, Eye, List,
    }},
  ],
  templateUrl: './chat-page.component.html',
  styleUrl: './chat-page.component.scss',
})
export class ChatPageComponent {
  readonly chat   = inject(ChatService);
  readonly queue  = inject(QueueService);
  readonly router = inject(Router);

  // Lucide icon refs
  readonly icMessage       = MessageSquareText;
  readonly icDashboard     = LayoutDashboard;
  readonly icFileCheck     = FileCheck2;
  readonly icPackage       = Package;
  readonly icFileText      = FileText;
  readonly icBarChart      = BarChart2;
  readonly icSettings      = Settings;
  readonly icPlus          = Plus;
  readonly icChevronRight  = ChevronRight;
  readonly icSend          = Send;
  readonly icPaperclip     = Paperclip;
  readonly icBell          = Bell;
  readonly icActivity      = Activity;
  readonly icUser          = User;
  readonly icMore          = MoreHorizontal;
  readonly icUpload        = Upload;
  readonly icEye           = Eye;
  readonly icList          = List;

  inputText = '';

  goToQueue(): void { this.router.navigate(['/queue']); }

  send(): void {
    if (!this.inputText.trim()) return;
    this.chat.send(this.inputText.trim());
    this.inputText = '';
  }

  onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.send(); }
  }
}
