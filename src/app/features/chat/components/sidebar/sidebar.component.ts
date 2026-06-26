import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { LucideAngularModule, MessageSquareText, LayoutDashboard, FileCheck2, Package, FileText, BarChart2, Settings, Plus, ChevronRight, PanelLeftClose, PanelLeftOpen, MoreHorizontal, List, Bot } from 'lucide-angular';
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
  readonly icMessage  = MessageSquareText;
  readonly icDash     = LayoutDashboard;
  readonly icLicense  = FileCheck2;
  readonly icRGoods   = Package;
  readonly icCustoms  = FileText;
  readonly icAnalytics= BarChart2;
  readonly icSettings = Settings;
  readonly icPlus     = Plus;
  readonly icChevR       = ChevronRight;
  readonly icPanelClose  = PanelLeftClose;
  readonly icPanelOpen   = PanelLeftOpen;
  readonly icMore     = MoreHorizontal;
  readonly icList     = List;
  readonly icBot      = Bot;

  isChat  = () => this.router.url === '/' || this.router.url === '';
  isQueue = () => this.router.url === '/queue';

  goChat()  { this.router.navigate(['/']); }
  goQueue() { this.queue.open(''); this.router.navigate(['/queue']); }
  newChat() { this.chat.newChat(); this.goChat(); }
}
