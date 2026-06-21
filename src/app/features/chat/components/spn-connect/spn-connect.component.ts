import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { LucideAngularModule, Building2, Globe, Lock, User, CheckCircle, ChevronRight, Wifi, Pencil, Check, X } from 'lucide-angular';
import { ChatService } from '@app/core/services/chat.service';
import { UrlLabelService } from '@app/core/services/url-label.service';
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
  readonly chat      = inject(ChatService);
  readonly urlLabels = inject(UrlLabelService);

  // Icons
  readonly Building2   = Building2;
  readonly Globe       = Globe;
  readonly Lock        = Lock;
  readonly User        = User;
  readonly CheckCircle = CheckCircle;
  readonly ChevronRight = ChevronRight;
  readonly Wifi        = Wifi;
  readonly Pencil      = Pencil;
  readonly Check       = Check;
  readonly IconX       = X;

  // State
  step = signal<Step>('company');

  // Step 1
  readonly companies        = MOCK_SPN_COMPANIES;
  selectedCompanyId         = signal<string>('');
  selectedBranchId          = signal<string>('');

  readonly selectedCompany  = computed<SpnCompany | null>(() =>
    this.companies.find(c => c.id === this.selectedCompanyId()) ?? null
  );
  readonly branches         = computed(() => this.selectedCompany()?.branches ?? []);
  readonly step1Valid       = computed(() => !!this.selectedCompanyId() && !!this.selectedBranchId());

  // Step 2
  readonly urls             = computed<SpnUrl[]>(() => this.selectedCompany()?.urls ?? []);
  selectedUrlId             = signal<string>('');
  readonly selectedUrl      = computed<SpnUrl | null>(() =>
    this.urls().find(u => u.id === this.selectedUrlId()) ?? null
  );

  // Inline rename state
  editingUrlId  = signal<string>('');
  editingValue  = signal<string>('');

  // Step 3: Login
  username   = signal('');
  password   = signal('');
  loading    = signal(false);
  loginError = signal('');
  readonly loginValid = computed(() => this.username().trim().length > 0 && this.password().trim().length > 0);

  // Helpers
  envColor(env: string): string {
    return env === 'production' ? '#0D8F61' : env === 'uat' ? '#B45309' : '#6B7280';
  }
  envLabel(env: string): string {
    return env === 'production' ? 'PROD' : env === 'uat' ? 'UAT' : 'DEV';
  }

  displayLabel(u: SpnUrl): string {
    return this.urlLabels.getLabel(u.id, u.label);
  }

  // Step indicator
  readonly stepDefs = [
    { id: 'company' as Step, label: 'Company' },
    { id: 'url'     as Step, label: 'SPN URL' },
    { id: 'login'   as Step, label: 'Login' },
  ];
  private readonly stepOrder: Step[] = ['company', 'url', 'login', 'success'];

  isStepDone(id: Step): boolean {
    return this.stepOrder.indexOf(id) < this.stepOrder.indexOf(this.step());
  }

  // Actions
  onCompanyChange(id: string): void {
    this.selectedCompanyId.set(id);
    this.selectedBranchId.set('');
    this.selectedUrlId.set('');
    this.cancelEdit();
  }

  goToUrl():   void { if (this.step1Valid())    this.step.set('url'); }
  goToLogin(): void { if (this.selectedUrlId()) this.step.set('login'); }

  selectUrl(id: string): void {
    if (this.editingUrlId() === id) return;
    this.selectedUrlId.set(id);
  }

  back(): void {
    if (this.step() === 'url')   { this.step.set('company'); this.cancelEdit(); }
    if (this.step() === 'login') this.step.set('url');
  }

  // Inline rename
  startEdit(u: SpnUrl, event: Event): void {
    event.stopPropagation();
    this.editingUrlId.set(u.id);
    this.editingValue.set(this.urlLabels.getLabel(u.id, u.label));
  }

  saveEdit(urlId: string): void {
    this.urlLabels.saveLabel(urlId, this.editingValue());
    this.cancelEdit();
  }

  cancelEdit(): void {
    this.editingUrlId.set('');
    this.editingValue.set('');
  }

  resetEdit(urlId: string, event: Event): void {
    event.stopPropagation();
    const u = this.urls().find(u => u.id === urlId);
    if (u) this.urlLabels.resetLabel(urlId);
    this.cancelEdit();
  }

  login(): void {
    if (!this.loginValid()) return;
    this.loading.set(true);
    this.loginError.set('');

    setTimeout(() => {
      this.loading.set(false);
      this.step.set('success');
      this.chat.onSpnConnected(
        this.selectedCompany()!.name,
        this.selectedUrl()!.url,
        this.username(),
      );
    }, 1200);
  }
}
