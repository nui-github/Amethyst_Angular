import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  LucideAngularModule, ArrowLeft, Pencil, Check, ChevronDown,
  Wifi, WifiOff, LogOut, User, Lock, SlidersHorizontal, UserCog, ShieldCheck, CreditCard,
  BarChart3, Plus, Package, FileText, Download, Receipt, FileCheck2, Wallet, Construction,
  TrendingUp, PieChart, Trophy,
} from 'lucide-angular';
import { NzInputModule } from 'ng-zorro-antd/input';
import {
  NgApexchartsModule, ApexAxisChartSeries, ApexNonAxisChartSeries, ApexChart, ApexXAxis, ApexYAxis,
  ApexDataLabels, ApexFill, ApexGrid, ApexTooltip, ApexStroke, ApexPlotOptions, ApexLegend, ApexStates,
} from 'ng-apexcharts';
import { ChatService } from '@app/core/services/chat.service';
import { MOCK_SPN_PROFILES, SpnProfile } from '@mock/spn-companies.mock';
import { CURRENT_PLAN, PAYMENT_METHOD, MOCK_INVOICES, BILLING_ADDRESS, BillingAddress } from '@mock/subscription.mock';
import { MOCK_USAGE, UsageMonth, monthTotal, monthPaidCount, monthFreeCount } from '@mock/usage.mock';

const CHART_FONT = 'IBM Plex Sans Thai, sans-serif';
const AXIS_LABEL_STYLE = { colors: '#9CA3AF', fontSize: '11px', fontFamily: CHART_FONT };

type SettingsSection = 'general' | 'account' | 'privacy' | 'billing' | 'usage';
type AccountTab = 'connect' | 'profiles';
type BillingTab = 'plan' | 'payment' | 'invoice';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, LucideAngularModule, NzInputModule, NgApexchartsModule],
  templateUrl: './settings-page.component.html',
  styleUrl: './settings-page.component.scss',
})
export class SettingsPageComponent {
  readonly chat      = inject(ChatService);
  readonly router    = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly ArrowLeft    = ArrowLeft;
  readonly Pencil       = Pencil;
  readonly Check        = Check;
  readonly ChevronDown  = ChevronDown;
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
  readonly TrendingUp   = TrendingUp;
  readonly PieChart     = PieChart;
  readonly Trophy       = Trophy;

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
  ];

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

  // ── Billing address (company-format, editable) ───────────────────────────
  billingAddress = signal<BillingAddress>({ ...BILLING_ADDRESS });
  editingAddress = signal(false);
  addressDraft = signal<BillingAddress>({ ...BILLING_ADDRESS });

  startEditAddress(): void {
    this.addressDraft.set({ ...this.billingAddress() });
    this.editingAddress.set(true);
  }
  cancelEditAddress(): void { this.editingAddress.set(false); }
  saveAddress(): void {
    this.billingAddress.set({ ...this.addressDraft() });
    this.editingAddress.set(false);
  }
  updateAddressField<K extends keyof BillingAddress>(field: K, value: string): void {
    this.addressDraft.update(a => ({ ...a, [field]: value }));
  }

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

  monthQuotaPct(m: UsageMonth): number {
    return Math.min(100, Math.round((m.items.length / this.plan.licenseQuota) * 100));
  }

  // ── Usage dashboard ───────────────────────────────────────────────────────
  private readonly AGENCY_COLORS: Record<string, string> = {
    'อย.': '#0463EF', 'กษ.': '#B45309', 'วอ.': '#7C3AED', 'กรมประมง': '#0D8F61', 'กรมปศุสัตว์': '#DB2777',
  };
  agencyColor(agency: string): string { return this.AGENCY_COLORS[agency] ?? '#6B7280'; }

  // oldest → newest, for left-to-right trend reading
  readonly chronoMonths = computed(() => [...this.months].reverse());

  readonly agencyBreakdown = computed(() => {
    const counts = new Map<string, number>();
    for (const m of this.months) {
      for (const item of m.items) {
        counts.set(item.agency, (counts.get(item.agency) ?? 0) + 1);
      }
    }
    const total = this.totalLicenses();
    return Array.from(counts.entries())
      .map(([agency, count]) => ({ agency, count, pct: total ? Math.round((count / total) * 100) : 0 }))
      .sort((a, b) => b.count - a.count);
  });

  readonly topGoods = computed(() => {
    const counts = new Map<string, number>();
    for (const m of this.months) {
      for (const item of m.items) {
        counts.set(item.goods, (counts.get(item.goods) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .map(([goods, count]) => ({ goods, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  });

  // ── ApexCharts: แนวโน้มค่าใช้จ่ายรายเดือน ─────────────────────────────────
  readonly spendChart: ApexChart = { type: 'bar', height: 220, width: '100%', fontFamily: CHART_FONT, toolbar: { show: false } };
  readonly spendPlotOptions: ApexPlotOptions = { bar: { borderRadius: 6, columnWidth: '46%' } };
  readonly spendFill: ApexFill = {
    type: 'gradient',
    gradient: { shade: 'light', type: 'vertical', shadeIntensity: 0.3, gradientToColors: ['#16EA9E'], opacityFrom: 0.95, opacityTo: 0.85, stops: [0, 100] },
  };
  readonly spendDataLabels: ApexDataLabels = {
    enabled: true, offsetY: -20,
    style: { fontSize: '11px', fontFamily: CHART_FONT, colors: ['#374151'], fontWeight: 700 },
    formatter: (val: number) => `฿${val.toLocaleString()}`,
  };
  readonly spendTooltip: ApexTooltip = { theme: 'light', y: { formatter: (val: number) => `฿${val.toLocaleString()}` } };

  readonly spendSeries = computed<ApexAxisChartSeries>(() => [
    { name: 'ค่าใช้จ่าย', data: this.chronoMonths().map(m => monthTotal(m)) },
  ]);
  readonly spendXaxis = computed<ApexXAxis>(() => ({
    categories: this.chronoMonths().map(m => m.monthLabel),
    labels: { style: AXIS_LABEL_STYLE }, axisBorder: { show: false }, axisTicks: { show: false },
  }));

  // ── ApexCharts: แนวโน้มการใช้โควต้าใบอนุญาต ───────────────────────────────
  readonly quotaChart: ApexChart = { type: 'bar', height: 220, width: '100%', fontFamily: CHART_FONT, toolbar: { show: false } };
  readonly quotaPlotOptions: ApexPlotOptions = { bar: { borderRadius: 6, columnWidth: '46%' } };
  readonly quotaFill: ApexFill = {
    type: 'gradient',
    gradient: { shade: 'light', type: 'vertical', shadeIntensity: 0.3, gradientToColors: ['#16EA9E'], opacityFrom: 0.95, opacityTo: 0.85, stops: [0, 100] },
  };
  readonly quotaDataLabels: ApexDataLabels = {
    enabled: true, offsetY: -20,
    style: { fontSize: '11px', fontFamily: CHART_FONT, colors: ['#374151'], fontWeight: 700 },
    formatter: (val: number) => `${val}%`,
  };
  readonly quotaTooltip: ApexTooltip = { theme: 'light', y: { formatter: (val: number) => `${val}% ของโควต้า` } };
  readonly quotaYaxis: ApexYAxis = { max: 100, labels: { style: AXIS_LABEL_STYLE, formatter: (val: number) => `${val}%` } };

  readonly quotaSeries = computed<ApexAxisChartSeries>(() => [
    { name: 'ใช้โควต้า', data: this.chronoMonths().map(m => this.monthQuotaPct(m)), color: '#0D8F61' },
  ]);
  readonly quotaXaxis = computed<ApexXAxis>(() => ({
    categories: this.chronoMonths().map(m => m.monthLabel),
    labels: { style: AXIS_LABEL_STYLE }, axisBorder: { show: false }, axisTicks: { show: false },
  }));

  // ── ApexCharts: สัดส่วนกรมที่ขอบ่อย ───────────────────────────────────────
  readonly agencyChart: ApexChart = { type: 'donut', height: 240, width: '100%', fontFamily: CHART_FONT };
  readonly agencyLegend: ApexLegend = {
    position: 'right', fontSize: '12px', fontFamily: CHART_FONT,
    labels: { colors: '#374151' }, markers: { width: 8, height: 8 },
    itemMargin: { vertical: 4 },
  };
  readonly agencyDataLabels: ApexDataLabels = {
    enabled: true, formatter: (val: number) => `${Math.round(val)}%`,
    style: { fontSize: '11px', fontFamily: CHART_FONT, fontWeight: 700 },
  };
  readonly agencyStroke: ApexStroke = { width: 2, colors: ['#fff'] };
  readonly agencyStates: ApexStates = { hover: { filter: { type: 'darken' } } };

  readonly agencySeries = computed<ApexNonAxisChartSeries>(() => this.agencyBreakdown().map(a => a.count));
  readonly agencyLabels = computed(() => this.agencyBreakdown().map(a => a.agency));
  readonly agencyColors = computed(() => this.agencyBreakdown().map(a => this.agencyColor(a.agency)));

  // ── ApexCharts: สินค้าที่ขอใบอนุญาตบ่อยที่สุด ─────────────────────────────
  readonly topGoodsChart: ApexChart = { type: 'bar', height: 220, width: '100%', fontFamily: CHART_FONT, toolbar: { show: false } };
  readonly topGoodsPlotOptions: ApexPlotOptions = {
    bar: { horizontal: true, borderRadius: 5, barHeight: '55%', distributed: false },
  };
  readonly topGoodsFill: ApexFill = {
    type: 'gradient',
    gradient: { shade: 'light', type: 'horizontal', shadeIntensity: 0.3, gradientToColors: ['#F59E0B'], opacityFrom: 0.95, opacityTo: 0.9, stops: [0, 100] },
  };
  readonly topGoodsDataLabels: ApexDataLabels = {
    enabled: true,
    style: { fontSize: '11px', fontFamily: CHART_FONT, colors: ['#fff'], fontWeight: 700 },
    formatter: (val: number) => `${val} ครั้ง`,
  };
  readonly topGoodsTooltip: ApexTooltip = { theme: 'light' };
  readonly topGoodsGrid: ApexGrid = { borderColor: '#F0F1F5' };

  readonly topGoodsSeries = computed<ApexAxisChartSeries>(() => [
    { name: 'จำนวนครั้ง', data: this.topGoods().map(g => g.count), color: '#B45309' },
  ]);
  readonly topGoodsXaxis = computed<ApexXAxis>(() => ({
    categories: this.topGoods().map(g => g.goods),
    labels: { style: AXIS_LABEL_STYLE }, axisBorder: { show: false }, axisTicks: { show: false },
  }));

  readonly chartGrid: ApexGrid = { borderColor: '#F0F1F5', strokeDashArray: 4, yaxis: { lines: { show: true } } };

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
