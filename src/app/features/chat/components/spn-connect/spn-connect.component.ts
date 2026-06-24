import { ChangeDetectionStrategy, ChangeDetectorRef, Component, NgZone, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, CheckCircle, ChevronRight } from 'lucide-angular';
import { ChatService } from '@app/core/services/chat.service';
import { MOCK_SPN_COMPANIES, MOCK_SPN_PROFILES, SpnProfile } from '@mock/spn-companies.mock';

@Component({
  selector: 'app-spn-connect',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './spn-connect.component.html',
  styleUrl: './spn-connect.component.scss',
})
export class SpnConnectComponent {
  readonly chat = inject(ChatService);
  readonly zone = inject(NgZone);
  readonly cdr  = inject(ChangeDetectorRef);
  readonly CheckCircle  = CheckCircle;
  readonly ChevronRight = ChevronRight;

  readonly profiles     = MOCK_SPN_PROFILES;
  readonly companies    = MOCK_SPN_COMPANIES;

  selected: string | null = null;
  connecting = false;
  done       = false;

  getCompanyName(companyId: string): string {
    return this.companies.find(c => c.id === companyId)?.name ?? companyId;
  }

  getUrl(profile: SpnProfile): string {
    for (const c of this.companies) {
      const u = c.urls.find(u => u.id === profile.urlId);
      if (u) return u.url;
    }
    return profile.urlId;
  }

  select(code: string): void {
    if (this.connecting || this.done) return;
    this.selected = code;
    this.cdr.detectChanges();
  }

  confirm(): void {
    if (!this.selected || this.connecting) return;
    const profile = this.profiles.find(p => p.code === this.selected)!;
    this.connecting = true;
    this.cdr.detectChanges();

    setTimeout(() => this.zone.run(() => {
      this.connecting = false;
      this.done = true;
      this.cdr.detectChanges();
      this.chat.onSpnConnected(
        this.getCompanyName(profile.companyId),
        this.getUrl(profile),
        profile.username,
        profile.code,
      );
    }), 900);
  }
}
