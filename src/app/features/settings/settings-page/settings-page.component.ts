import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  LucideAngularModule, ArrowLeft, Globe, Pencil, Check, X, RotateCcw, ChevronRight, ChevronDown,
  Building2, Wifi, WifiOff, LogOut, User, Lock, SlidersHorizontal, UserCog, ShieldCheck, CreditCard,
  BarChart3, Plus, Package, FileText, Download, Receipt, FileCheck2, Wallet, Construction,
} from 'lucide-angular';
import { NzInputModule } from 'ng-zorro-antd/input';
import { UrlLabelService } from '@app/core/services/url-label.service';
import { ChatService } from '@app/core/services/chat.service';
import { MOCK_SPN_COMPANIES, MOCK_SPN_PROFILES, SpnCompany, SpnUrl, SpnProfile } from '@mock/spn-companies.mock';
import { CURRENT_PLAN, PAYMENT_METHOD, MOCK_INVOICES } from '@mock/subscription.mock';
import { MOCK_USAGE, UsageMonth, monthTotal, monthPaidCount, monthFreeCount } from '@mock/usage.mock';

type SettingsSection = 'general' | 'account' | 'privacy' | 'billing' | 'usage';
type AccountTab = 'connect' | 'profiles' | 'url-labels';
type BillingTab = 'plan' | 'payment' | 'invoice';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, LucideAngularModule, NzInputModule],
  templateUrl: './settings-page.component.html',
  styleUrl: './settings-page.component.scss',
})
export class SettingsPageComponent {
  readonly urlLabels = inject(UrlLabelService);
  readonly chat      = inject(ChatService);
  readonly router    = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly ArrowLeft    = ArrowLeft;
  readonly Globe        = Globe;
  readonly Pencil       = Pencil;
  readonly Check        = Check;
  readonly IconX        = X;
  readonly RotateCcw    = RotateCcw;
  readonly ChevronRight = ChevronRight;
  readonly ChevronDown  = ChevronDown;
  readonly Building2    = Building2;
  readonly Wifi         = Wifi;
  readonly WifiOff      = WifiOff;
  readonly LogOut       = LogOut;
  readonly User         = User;
  readonly Lock         = Lock;
  readonly SlidersHorizontal = SlidersHorizontal;
  readonly UserCog      = UserCog;
  readonly ShieldCheck  = ShieldCheck;
  readonly CreditCard   = CreditCard;
  readonly BarChart3    = BarChart3;
  readonly Plus         = Plus;
  readonly Package      = Package;
  readonly FileText     = FileText;
  readonly Download     = Download;
  readonly Receipt      = Receipt;
  readonly FileCheck2   = FileCheck2;
  readonly Wallet       = Wallet;
  readonly Construction = Construction;

  // ── Top-level section nav ──────────────────────────────────────────────────
  readonly navItems: { id: SettingsSection; label: string; icon: typeof SlidersHorizontal }[] = [
    { id: 'general', label: 'ทั่วไป',     icon: SlidersHorizontal },
    { id: 'account', label: 'บัญชี',      icon: UserCog },
    { id: 'privacy', label: 'ความเป็นส่วนตัว', icon: ShieldCheck },
    { id: 'billing', label: 'การเรียกเก็บเงิน', icon: CreditCard },
    { id: 'usage',   label: 'การใช้งาน',  icon: BarChart3 },
  ];

  activeSection = signal<SettingsSection>(
    (this.route.snapshot.data['section'] as SettingsSection) ?? 'account'
  );

  // ── Account tab ───────────────────────────────────────────────────────────
  accountTab = signal<AccountTab>('connect');
  readonly accountTabs: { id: AccountTab; label: string }[] = [
    { id: 'connect',     label: 'เชื่อมต่อ ShippingNet' },
    { id: 'profiles',    label: 'โปรไฟล์สำหรับส่งกรม' },
    { id: 'url-labels',  label: 'ตั้งชื่อ SPN URL' },
  ];

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

  disconnect(): void { this.chat.disconnect(); }

  // ── Profiles for submitting to agencies ──────────────────────────────────
  profiles = signal<SpnProfile[]>([...MOCK_SPN_PROFILES]);
  showCreateProfile = signal(false);
  newProfileCode = signal('');
  newProfileName = signal('');
  newProfileUser = signal('');

  readonly newProfileValid = () =>
    this.newProfileCode().trim().length > 0 &&
    this.newProfileName().trim().length > 0 &&
    this.newProfileUser().trim().length > 0;

  openCreateProfile(): void { this.showCreateProfile.set(true); }
  cancelCreateProfile(): void {
    this.showCreateProfile.set(false);
    this.newProfileCode.set(''); this.newProfileName.set(''); this.newProfileUser.set('');
  }

  saveNewProfile(): void {
    if (!this.newProfileValid()) return;
    const colors = ['#0463EF', '#7C3AED', '#0D8F61', '#B45309', '#DB2777'];
    this.profiles.update(list => [...list, {
      code: this.newProfileCode().trim().toUpperCase().slice(0, 4),
      displayName: this.newProfileName().trim(),
      companyId: 'custom',
      urlId: 'custom',
      username: this.newProfileUser().trim(),
      color: colors[list.length % colors.length],
    }]);
    this.cancelCreateProfile();
  }

  // ── SPN URL labels ────────────────────────────────────────────────────────
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

  // ── Billing tab (plan / payment / invoice) ───────────────────────────────
  billingTab = signal<BillingTab>('plan');
  readonly billingTabs: { id: BillingTab; label: string }[] = [
    { id: 'plan',    label: 'แพ็กเกจ' },
    { id: 'payment', label: 'การชำระเงิน' },
    { id: 'invoice', label: 'ใบแจ้งหนี้' },
  ];

  readonly plan        = CURRENT_PLAN;
  readonly paymentMethod = PAYMENT_METHOD;
  readonly invoices    = MOCK_INVOICES;

  readonly planUsagePct = computed(() =>
    Math.min(100, Math.round((this.plan.licenseUsed / this.plan.licenseQuota) * 100))
  );

  downloadInvoice(invoiceNo: string): void {
    const blob = new Blob([`ใบแจ้งหนี้ ${invoiceNo}`], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${invoiceNo}.pdf`; a.click();
    URL.revokeObjectURL(url);
  }

  // ── Usage tab (monthly license breakdown) ────────────────────────────────
  readonly months: UsageMonth[] = MOCK_USAGE;
  readonly monthTotal = monthTotal;
  readonly monthPaidCount = monthPaidCount;
  readonly monthFreeCount = monthFreeCount;

  readonly currentMonth = computed(() => this.months[0] ?? null);

  readonly totalLicenses = computed(() =>
    this.months.reduce((sum, m) => sum + m.items.length, 0)
  );

  readonly totalFeeAllTime = computed(() =>
    this.months.reduce((sum, m) => sum + monthTotal(m), 0)
  );

  readonly totalPaidLicenses = computed(() =>
    this.months.reduce((sum, m) => sum + monthPaidCount(m), 0)
  );

  expandedMonths = signal<Set<string>>(new Set(this.months.length ? [this.months[0].monthKey] : []));

  isExpanded(key: string): boolean { return this.expandedMonths().has(key); }

  toggleMonth(key: string): void {
    this.expandedMonths.update(set => {
      const next = new Set(set);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  goBack(): void { this.router.navigate(['/']); }
}
