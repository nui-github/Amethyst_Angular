import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { LucideAngularModule, Mail, Send, CheckCircle } from 'lucide-angular';
import { EmailDraftData } from '@app/core/models/types';
import { ChatService } from '@app/core/services/chat.service';

@Component({
  selector: 'app-email-draft',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, NzInputModule, NzButtonModule, LucideAngularModule],
  templateUrl: './email-draft.component.html',
  styleUrl: './email-draft.component.scss',
})
export class EmailDraftComponent implements OnInit {
  @Input({ required: true }) data!: EmailDraftData;
  @Input() msgId = '';
  @Output() sent = new EventEmitter<void>();

  readonly chat    = inject(ChatService);
  readonly Mail    = Mail;
  readonly Send    = Send;
  readonly Check   = CheckCircle;

  to      = signal('');
  subject = signal('');
  body    = signal('');

  readonly canSend = () => this.to().trim().length > 0 && this.subject().trim().length > 0 && this.body().trim().length > 0;

  ngOnInit(): void {
    this.subject.set(this.data.subject ?? '');
    this.body.set(this.data.body ?? '');
    this.to.set(this.data.to ?? '');
  }

  send(): void {
    if (!this.canSend()) return;
    this.chat.onEmailSent(this.msgId);
    this.sent.emit();
  }
}
