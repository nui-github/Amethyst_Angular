import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LucideAngularModule, ArrowLeft, Receipt, FileCheck2, Wallet, ChevronDown } from 'lucide-angular';
import { MOCK_BILLING, BillingMonth, monthTotal, monthPaidCount, monthFreeCount } from '@mock/billing.mock';
import { SidebarComponent } from '../../chat/components/sidebar/sidebar.component';

@Component({
  selector: 'app-billing-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LucideAngularModule, SidebarComponent],
  templateUrl: './billing-page.component.html',
  styleUrl: './billing-page.component.scss',
})
export class BillingPageComponent {
  readonly router = inject(Router);

  collapsed = signal(false);
  toggleSidebar(): void { this.collapsed.update(v => !v); }

  readonly ArrowLeft  = ArrowLeft;
  readonly Receipt    = Receipt;
  readonly FileCheck2 = FileCheck2;
  readonly Wallet     = Wallet;
  readonly ChevronDown = ChevronDown;

  readonly months: BillingMonth[] = MOCK_BILLING;
  readonly monthTotal = monthTotal;
  readonly monthPaidCount = monthPaidCount;
  readonly monthFreeCount = monthFreeCount;

  // current month = first entry (most recent)
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
