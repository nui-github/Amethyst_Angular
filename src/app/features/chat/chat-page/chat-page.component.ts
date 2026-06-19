import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { ChatService } from '@app/core/services/chat.service';
import { QueueService } from '@app/core/services/queue.service';
import { ChatAreaComponent } from '../components/chat-area/chat-area.component';

@Component({
  selector: 'app-chat-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule, RouterModule,
    NzLayoutModule, NzButtonModule, NzInputModule, ChatAreaComponent,
  ],
  templateUrl: './chat-page.component.html',
  styleUrl: './chat-page.component.scss',
})
export class ChatPageComponent {
  readonly chat   = inject(ChatService);
  readonly queue  = inject(QueueService);
  readonly router = inject(Router);

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
