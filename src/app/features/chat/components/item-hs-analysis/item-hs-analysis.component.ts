import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Search, Check, ArrowDown, Banknote, ShieldCheck, Sprout, PackageCheck } from 'lucide-angular';
import { ItemHsAnalysisData, ProductHsAnalysis } from '@app/core/models/types';
import { AGENCY_CORRECTION_OPTIONS } from '@mock/product-hs-analysis.mock';
import { getAgencyPayment } from '@mock/payment.mock';

interface AgencySummaryRow {
  code: string;
  full: string;
  count: number;
  requiresFee: boolean;
  amount: number;
}

interface GroupState {
  confirmed: boolean;
  agency: string;
  agencyFull: string;
}

interface AgencyGroup {
  key: string;          // original AI-assigned agency code (or '—')
  full: string;
  items: ProductHsAnalysis[];
}

const GROUP_STYLE: Record<string, { color: string; bg: string; icon: 'shield' | 'sprout' | 'package' }> = {
  'อย.': { color: '#0463EF', bg: 'rgba(4, 99, 239, 0.06)', icon: 'shield' },
  'กษ.': { color: '#B45309', bg: 'rgba(180, 83, 9, 0.06)', icon: 'sprout' },
  '—':   { color: '#6B7280', bg: 'rgba(107, 114, 128, 0.06)', icon: 'package' },
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
  readonly agencyOptions = AGENCY_CORRECTION_OPTIONS;

  groups: AgencyGroup[] = [];
  groupStates = signal<Record<string, GroupState>>({});
  proceeded = signal(false);
  expanded = signal<Record<string, boolean>>({});

  // Summary of the AI's own analysis (before any user correction)
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

    const initStates: Record<string, GroupState> = {};
    const initExpanded: Record<string, boolean> = {};
    for (const g of this.groups) {
      initStates[g.key] = { confirmed: !!this.data.reviewed, agency: g.key, agencyFull: g.full };
      initExpanded[g.key] = false;
    }
    this.groupStates.set(initStates);
    this.expanded.set(initExpanded);
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

  groupState(key: string): GroupState { return this.groupStates()[key]; }
  isExpanded(key: string): boolean { return this.expanded()[key]; }
  toggleExpanded(key: string): void {
    this.expanded.update(e => ({ ...e, [key]: !e[key] }));
  }

  groupStyle(key: string) { return GROUP_STYLE[key] ?? GROUP_STYLE['—']; }

  onAgencyChange(key: string, code: string): void {
    if (this.proceeded()) return;
    const opt = this.agencyOptions.find(a => a.code === code);
    if (!opt) return;
    this.groupStates.update(s => ({ ...s, [key]: { ...s[key], agency: opt.code, agencyFull: opt.full } }));
  }

  toggleGroupConfirm(key: string): void {
    if (this.proceeded()) return;
    this.groupStates.update(s => ({ ...s, [key]: { ...s[key], confirmed: !s[key].confirmed } }));
  }

  readonly allDecided = () => this.groups.every(g => this.groupState(g.key)?.confirmed);
  readonly decidedCount = () => this.groups.filter(g => this.groupState(g.key)?.confirmed).length;
  readonly isChanged = (key: string) => this.groupState(key)?.agency !== key;

  proceed(): void {
    if (this.proceeded() || !this.allDecided()) return;
    this.proceeded.set(true);
    const result: ProductHsAnalysis[] = [];
    for (const g of this.groups) {
      const s = this.groupState(g.key);
      for (const item of g.items) {
        result.push({ ...item, agency: s.agency, agencyFull: s.agencyFull, requiresPermit: s.agency !== '—' });
      }
    }
    this.confirmed.emit(result);
  }
}
