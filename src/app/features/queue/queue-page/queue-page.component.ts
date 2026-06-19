import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QueueService, STATUS_META, AGENCY_SHORT } from '@app/core/services/queue.service';
import { ChatAreaComponent } from '../../chat/components/chat-area/chat-area.component';

/** TODO: implement full QueuePage — see ANGULAR.md */
@Component({
  selector: 'app-queue-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ChatAreaComponent],
  template: `
    <div style="padding:24px">
      <h2>คิวงานขอใบอนุญาต</h2>
      @for (s of queue.queue(); track s.id) {
        <div (click)="queue.open(s.id)" style="cursor:pointer;padding:12px;border:1px solid #E0E0E0;border-radius:8px;margin-bottom:8px">
          <strong>{{ s.chatName ?? s.customsNo }}</strong> —
          <span>{{ s.goods }}</span>
        </div>
        @if (queue.openId() === s.id && s.messages) {
          <app-chat-area [messages]="s.messages" [readOnly]="true" />
        }
      }
    </div>
  `,
})
export class QueuePageComponent {
  readonly queue = inject(QueueService);
}
