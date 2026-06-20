import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, MessageSquareText, Bell, Activity, User } from 'lucide-angular';
import { ChatService } from '@app/core/services/chat.service';

@Component({
  selector: 'app-chat-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <header class="chat-header">
      <div class="header-left">
        <button class="icon-btn" (click)="toggleSidebar.emit()">
          <lucide-icon [img]="icToggle" [size]="16" color="#8080A5" />
        </button>
        <span class="breadcrumb">
          Netbay Agent <span class="sep">›</span> <strong>{{ page }}</strong>
        </span>
      </div>
      <div class="header-right">
        <span class="status-pill" [class.status-pill--on]="chat.isConnected()">
          <span class="status-dot" [class.status-dot--live]="chat.isConnected()"></span>
          {{ chat.isConnected() ? 'เชื่อมต่อแล้ว' : 'ยังไม่เชื่อมต่อ SPN' }}
        </span>
        <button class="icon-btn"><lucide-icon [img]="icBell" [size]="16" color="#8080A5" /></button>
        <button class="icon-btn"><lucide-icon [img]="icActivity" [size]="16" color="#8080A5" /></button>
        <div class="avatar"><lucide-icon [img]="icUser" [size]="15" color="#fff" /></div>
      </div>
    </header>
  `,
  styleUrl: './chat-header.component.scss',
})
export class ChatHeaderComponent {
  @Input() page = 'Chatbot';
  @Output() toggleSidebar = new EventEmitter<void>();

  readonly chat       = inject(ChatService);
  readonly icToggle   = MessageSquareText;
  readonly icBell     = Bell;
  readonly icActivity = Activity;
  readonly icUser     = User;
}
