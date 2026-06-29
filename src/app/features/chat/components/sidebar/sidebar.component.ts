import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { LucideAngularModule, MessageSquareText, MessageSquare, Settings, Plus, ChevronRight, PanelLeftClose, PanelLeftOpen, List, Bot } from 'lucide-angular';
import { ChatService } from '@app/core/services/chat.service';
import { QueueService } from '@app/core/services/queue.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './sidebar.component.html',
  styleUrl:    './sidebar.component.scss',
})
export class SidebarComponent {
  @Input()  collapsed = false;
  @Output() toggleCollapse = new EventEmitter<void>();

  readonly chat   = inject(ChatService);
  readonly queue  = inject(QueueService);
  readonly router = inject(Router);

  // Icons
  readonly icMessage     = MessageSquareText;
  readonly icSessionItem = MessageSquare;
  readonly icSettings    = Settings;
  readonly icPlus        = Plus;
  readonly icChevR       = ChevronRight;
  readonly icPanelClose  = PanelLeftClose;
  readonly icPanelOpen   = PanelLeftOpen;
  readonly icList        = List;
  readonly icBot         = Bot;

  isChat  = () => this.router.url === '/' || this.router.url === '';
  isQueue = () => this.router.url === '/queue';

  goChat()  { this.router.navigate(['/']); }
  goQueue() { this.queue.open(''); this.router.navigate(['/queue']); }
  newChat() { this.chat.newChat(); this.goChat(); }

  // Fixed-position tooltip (escapes overflow:auto boundary)
  readonly tooltip = signal<{ text: string; x: number; y: number } | null>(null);

  showTooltip(event: MouseEvent, text: string): void {
    const r = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.tooltip.set({ text, x: r.right + 10, y: r.top + r.height / 2 });
  }

  hideTooltip(): void { this.tooltip.set(null); }
}
