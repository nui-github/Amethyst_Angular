import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Search, Check, ArrowDown, Banknote, ShieldCheck, Sprout, PackageCheck } from 'lucide-angular';
import { ItemHsAnalysisData, ProductHsAnalysis } from '@app/core/models/types';
import { getAgencyPayment } from '@mock/payment.mock';

interface AgencySummaryRow {
  code: string;
  full: string;
  count: number;
  requiresFee: boolean;
  amount: number;
}

interface AgencyGroup {
  key: string;          // AI-assigned agency code (or '—')
  full: string;
  items: ProductHsAnalysis[];
}

const GROUP_STYLE: Record<string, { color: string; bg: string; icon: 'shield' | 'sprout' | 'package' }> = {
  'อย.': { color: '#0463EF', bg: 'rgba(4, 99, 239, 0.08)', icon: 'shield' },
  'กษ.': { color: '#B45309', bg: 'rgba(180, 83, 9, 0.08)', icon: 'sprout' },
  '—':   { color: '#6B7280', bg: 'rgba(107, 114, 128, 0.08)', icon: 'package' },
};

@Component({
  selector: 'app-item-hs-analysis',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './item-hs-analysis.component.html',
  styleUrl: './item-hs-analysis.component.scss',
})
export class ItemHsAnalysisComponent implements OnInit {
  @Input({ required: true }) data!: ItemHsAnalysisData;
  @Output() confirmed = new EventEmitter<ProductHsAnalysis[]>();

  readonly Search = Search;
  readonly Check = Check;
  readonly ArrowDown = ArrowDown;
  readonly Banknote = Banknote;
  readonly ShieldCheck = ShieldCheck;
  readonly Sprout = Sprout;
  readonly PackageCheck = PackageCheck;

  groups: AgencyGroup[] = [];
  confirmedGroups = signal<Record<string, boolean>>({});
  proceeded = signal(false);

  // Summary of the AI's own analysis
  requiresAnyPermit = false;
  agencySummary: AgencySummaryRow[] = [];
  totalFee = 0;

  ngOnInit(): void {
    const byAgency = new Map<string, AgencyGroup>();
    for (const item of this.data.items) {
      const key = item.agency;
      if (!byAgency.has(key)) byAgency.set(key, { key, full: item.agencyFull, items: [] });
      byAgency.get(key)!.items.push(item);
    }
    // Order: permit-required agencies first, "ไม่ต้องขอ" group last
    this.groups = Array.from(byAgency.values()).sort((a, b) => (a.key === '—' ? 1 : 0) - (b.key === '—' ? 1 : 0));

    const init: Record<string, boolean> = {};
    for (const g of this.groups) init[g.key] = !!this.data.reviewed;
    this.confirmedGroups.set(init);
    this.proceeded.set(!!this.data.reviewed);

    this.requiresAnyPermit = this.data.items.some(i => i.requiresPermit);
    const map = new Map<string, { full: string; count: number }>();
    for (const item of this.data.items) {
      if (!item.requiresPermit) continue;
      const cur = map.get(item.agency) ?? { full: item.agencyFull, count: 0 };
      cur.count++;
      map.set(item.agency, cur);
    }
    this.agencySummary = Array.from(map.entries()).map(([code, v]) => {
      const pay = getAgencyPayment(code);
      return { code, full: v.full, count: v.count, requiresFee: pay.requiresFee, amount: pay.amount };
    });
    this.totalFee = this.agencySummary.reduce((sum, a) => sum + (a.requiresFee ? a.amount : 0), 0);
  }

  isGroupConfirmed(key: string): boolean { return this.confirmedGroups()[key]; }
  groupStyle(key: string) { return GROUP_STYLE[key] ?? GROUP_STYLE['—']; }

  confirmGroup(key: string): void {
    if (this.proceeded() || this.isGroupConfirmed(key)) return;
    this.confirmedGroups.update(s => ({ ...s, [key]: true }));
  }

  readonly allDecided = () => this.groups.every(g => this.isGroupConfirmed(g.key));
  readonly decidedCount = () => this.groups.filter(g => this.isGroupConfirmed(g.key)).length;

  proceed(): void {
    if (this.proceeded() || !this.allDecided()) return;
    this.proceeded.set(true);
    this.confirmed.emit(this.data.items);
  }
}
