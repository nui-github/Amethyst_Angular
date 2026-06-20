import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { LucideAngularModule, Building2, Globe, Lock, User, CheckCircle, ChevronRight, Wifi } from 'lucide-angular';
import { ChatService } from '@app/core/services/chat.service';
import { MOCK_SPN_COMPANIES, SpnCompany, SpnUrl } from '@mock/spn-companies.mock';

type Step = 'company' | 'url' | 'login' | 'success';

@Component({
  selector: 'app-spn-connect',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, NzInputModule, NzButtonModule, NzSelectModule, LucideAngularModule],
  templateUrl: './spn-connect.component.html',
  styleUrl: './spn-connect.component.scss',
})
export class SpnConnectComponent {
  readonly chat = inject(ChatService);

  // Icons
  readonly Building2  = Building2;
  readonly Globe      = Globe;
  readonly Lock       = Lock;
  readonly User       = User;
  readonly CheckCircle = CheckCircle;
  readonly ChevronRight = ChevronRight;
  readonly Wifi       = Wifi;

  // State
  step = signal<Step>('company');

  // Step 1: Company + Branch
  readonly companies = MOCK_SPN_COMPANIES;
  selectedCompanyId = signal<string>('');
  selectedBranchId  = signal<string>('');

  readonly selectedCompany = computed<SpnCompany | null>(() =>
    this.companies.find(c => c.id === this.selectedCompanyId()) ?? null
  );

  readonly branches = computed(() => this.selectedCompany()?.branches ?? []);

  readonly step1Valid = computed(() =>
    !!this.selectedCompanyId() && !!this.selectedBranchId()
  );

  // Step 2: SPN URL
  readonly urls = computed<SpnUrl[]>(() => this.selectedCompany()?.urls ?? []);
  selectedUrlId = signal<string>('');
  readonly selectedUrl = computed<SpnUrl | null>(() =>
    this.urls().find(u => u.id === this.selectedUrlId()) ?? null
  );

  // Step 3: Login
  username  = '';
  password  = '';
  loading   = signal(false);
  loginError = signal('');

  readonly loginValid = computed(() => this.username.trim() && this.password.trim());

  // Env color
  envColor(env: string): string {
    return env === 'production' ? '#0D8F61' : env === 'uat' ? '#B45309' : '#6B7280';
  }
  envLabel(env: string): string {
    return env === 'production' ? 'PROD' : env === 'uat' ? 'UAT' : 'DEV';
  }

  // Step definitions for the indicator
  readonly stepDefs = [
    { id: 'company' as Step, label: 'Company' },
    { id: 'url'     as Step, label: 'SPN URL' },
    { id: 'login'   as Step, label: 'Login' },
  ];

  private readonly stepOrder: Step[] = ['company', 'url', 'login', 'success'];

  isStepDone(id: Step): boolean {
    const current = this.stepOrder.indexOf(this.step());
    const target  = this.stepOrder.indexOf(id);
    return target < current;
  }

  // Actions
  onCompanyChange(id: string): void {
    this.selectedCompanyId.set(id);
    this.selectedBranchId.set('');
    this.selectedUrlId.set('');
  }

  goToUrl(): void {
    if (this.step1Valid()) this.step.set('url');
  }

  selectUrl(id: string): void {
    this.selectedUrlId.set(id);
  }

  goToLogin(): void {
    if (this.selectedUrlId()) this.step.set('login');
  }

  back(): void {
    if (this.step() === 'url')   this.step.set('company');
    if (this.step() === 'login') this.step.set('url');
  }

  login(): void {
    if (!this.loginValid()) return;
    this.loading.set(true);
    this.loginError.set('');

    // Mock auth 1200ms
    setTimeout(() => {
      this.loading.set(false);
      // Mock: any non-empty credentials succeed
      this.step.set('success');
      this.chat.onSpnConnected(
        this.selectedCompany()!.name,
        this.selectedUrl()!.url,
        this.username,
      );
    }, 1200);
  }
}
