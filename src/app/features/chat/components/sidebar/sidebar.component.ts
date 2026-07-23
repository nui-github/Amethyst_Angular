import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, HostListener, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { LucideAngularModule, MessageSquareText, MessageSquare, Settings, Plus, ChevronRight, PanelLeftClose, PanelLeftOpen, List, Bot, Receipt, LogOut } from 'lucide-angular';
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
  readonly icBilling     = Receipt;
  readonly icLogout      = LogOut;

  isChat  = () => this.router.url === '/' || this.router.url === '';
  isQueue = () => this.router.url === '/queue';

  goChat()  { this.router.navigate(['/']); }
  // syncQueueProgress() persists whatever a resumed ("ดำเนินการต่อ") session did in chat back onto
  // its Shipment record before leaving — without this, navigating to คิวงาน via the sidebar (as
  // opposed to the chat page's own "กลับไปคิวงาน" banner, which goes through chat.newChat()) left
  // the queue detail view showing stale progress (e.g. an e-QC/e-SFR card that was actually already
  // done in chat still showing as not started).
  goQueue() { this.chat.syncQueueProgress(); this.queue.open(''); this.router.navigate(['/queue']); }
  newChat() { this.chat.newChat(); this.goChat(); }

  // Fixed-position tooltip (escapes overflow:auto boundary)
  readonly tooltip = signal<{ text: string; x: number; y: number } | null>(null);

  showTooltip(event: MouseEvent, text: string): void {
    const r = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.tooltip.set({ text, x: r.right + 10, y: r.top + r.height / 2 });
  }

  hideTooltip(): void { this.tooltip.set(null); }

  // Profile popup menu
  readonly profileMenuOpen = signal(false);
  private readonly elRef = inject(ElementRef);

  toggleProfileMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.profileMenuOpen.update(v => !v);
  }

  closeProfileMenu(): void { this.profileMenuOpen.set(false); }

  goSettings(): void { this.closeProfileMenu(); this.router.navigate(['/settings']); }
  goBilling(): void  { this.closeProfileMenu(); this.router.navigate(['/billing']); }

  logout(): void {
    this.closeProfileMenu();
    this.chat.disconnect();
    this.chat.newChat();
    this.router.navigate(['/']);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.profileMenuOpen() && !this.elRef.nativeElement.contains(event.target)) {
      this.closeProfileMenu();
    }
  }
}
