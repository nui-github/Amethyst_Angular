import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule, ArrowLeft, Globe, Pencil, Check, X, RotateCcw, Settings, ChevronRight, Building2, Wifi, WifiOff, LogOut, User, Lock } from 'lucide-angular';
import { NzInputModule } from 'ng-zorro-antd/input';
import { UrlLabelService } from '@app/core/services/url-label.service';
import { ChatService } from '@app/core/services/chat.service';
import { MOCK_SPN_COMPANIES, SpnCompany, SpnUrl } from '@mock/spn-companies.mock';
import { SidebarComponent } from '../../chat/components/sidebar/sidebar.component';

type SettingsSection = 'spn-connect' | 'spn-url';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, LucideAngularModule, NzInputModule, SidebarComponent],
  templateUrl: './settings-page.component.html',
  styleUrl: './settings-page.component.scss',
})
export class SettingsPageComponent {
  readonly urlLabels = inject(UrlLabelService);
  readonly chat      = inject(ChatService);
  readonly router    = inject(Router);

  collapsed = signal(false);
  toggleSidebar(): void { this.collapsed.update(v => !v); }

  readonly ArrowLeft    = ArrowLeft;
  readonly Globe        = Globe;
  readonly Pencil       = Pencil;
  readonly Check        = Check;
  readonly IconX        = X;
  readonly RotateCcw    = RotateCcw;
  readonly Settings     = Settings;
  readonly ChevronRight = ChevronRight;
  readonly Building2    = Building2;
  readonly Wifi         = Wifi;
  readonly WifiOff      = WifiOff;
  readonly LogOut       = LogOut;
  readonly User         = User;
  readonly Lock         = Lock;

  readonly companies = MOCK_SPN_COMPANIES;

  // Login form state
  showLoginForm = signal(false);
  loginUser     = signal('');
  loginPass     = signal('');
  loginLoading  = signal(false);
  loginError    = signal('');

  readonly loginValid = () => this.loginUser().trim().length > 0 && this.loginPass().trim().length > 0;

  openLoginForm(): void { this.showLoginForm.set(true); this.loginError.set(''); }
  cancelLogin(): void   { this.showLoginForm.set(false); this.loginUser.set(''); this.loginPass.set(''); this.loginError.set(''); }

  doLogin(): void {
    if (!this.loginValid() || this.loginLoading()) return;
    this.loginLoading.set(true);
    this.loginError.set('');
    setTimeout(() => {
      this.loginLoading.set(false);
      this.chat.isConnected.set(true);
      this.chat.spnSession.set({ companyName: 'ShippingNet', url: 'spn.netbay.co.th', username: this.loginUser() });
      this.showLoginForm.set(false);
      this.loginUser.set(''); this.loginPass.set('');
    }, 1200);
  }

  activeSection = signal<SettingsSection>('spn-connect');

  readonly navItems = [
    { id: 'spn-connect' as SettingsSection, label: 'เชื่อมต่อ ShippingNet', icon: Wifi },
    { id: 'spn-url'     as SettingsSection, label: 'ตั้งชื่อ SPN URL',       icon: Globe },
  ];

  selectedCompanyId = signal<string | null>(null);

  readonly selectedCompany = computed<SpnCompany | null>(() =>
    this.companies.find(c => c.id === this.selectedCompanyId()) ?? null
  );

  editingId    = signal<string>('');
  editingValue = signal<string>('');

  envColor(env: string): string {
    return env === 'production' ? '#0D8F61' : env === 'uat' ? '#B45309' : '#6B7280';
  }
  envLabel(env: string): string {
    return env === 'production' ? 'PROD' : env === 'uat' ? 'UAT' : 'DEV';
  }

  customizedCount(company: SpnCompany): number {
    return company.urls.filter(u => this.urlLabels.getLabel(u.id, u.label) !== u.label).length;
  }

  displayLabel(u: SpnUrl): string { return this.urlLabels.getLabel(u.id, u.label); }
  isCustom(u: SpnUrl): boolean    { return this.urlLabels.getLabel(u.id, u.label) !== u.label; }

  selectCompany(id: string): void { this.selectedCompanyId.set(id); this.cancelEdit(); }
  backToList(): void               { this.selectedCompanyId.set(null); this.cancelEdit(); }

  startEdit(u: SpnUrl): void { this.editingId.set(u.id); this.editingValue.set(this.displayLabel(u)); }
  saveEdit(urlId: string): void { this.urlLabels.saveLabel(urlId, this.editingValue()); this.cancelEdit(); }
  cancelEdit(): void            { this.editingId.set(''); this.editingValue.set(''); }
  resetUrl(u: SpnUrl): void     { this.urlLabels.resetLabel(u.id); if (this.editingId() === u.id) this.cancelEdit(); }

  disconnect(): void { this.chat.disconnect(); }

  goToConnect(): void { this.router.navigate(['/']); }

  goBack(): void { this.router.navigate(['/']); }
}
