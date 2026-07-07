import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Search, Check, ArrowDown, Percent, ShieldCheck, Sprout, PackageCheck, Radiation, Pencil, X } from 'lucide-angular';
import { HsCandidate, ItemHsAnalysisData, ProductHsAnalysis } from '@app/core/models/types';
import { getAgencyPayment } from '@mock/payment.mock';

interface AgencySummaryRow {
  code: string;
  full: string;
  count: number;
  requiresFee: boolean;
  amount: number;
  licenseTypes: string[];
}

interface AgencyGroup {
  key: string;          // AI-assigned agency code (or '—')
  full: string;
  items: ProductHsAnalysis[];
}

const GROUP_STYLE: Record<string, { color: string; bg: string; icon: 'shield' | 'sprout' | 'package' | 'radiation' }> = {
  'อย.': { color: '#0463EF', bg: 'rgba(4, 99, 239, 0.08)', icon: 'shield' },
  'กษ.': { color: '#B45309', bg: 'rgba(180, 83, 9, 0.08)', icon: 'sprout' },
  'ปส.': { color: '#7C3AED', bg: 'rgba(124, 58, 237, 0.08)', icon: 'radiation' },
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
  readonly Percent = Percent;
  readonly ShieldCheck = ShieldCheck;
  readonly Sprout = Sprout;
  readonly PackageCheck = PackageCheck;
  readonly Radiation = Radiation;
  readonly Pencil = Pencil;
  readonly X = X;

  groups: AgencyGroup[] = [];
  confirmedGroups = signal<Record<string, boolean>>({});
  overrides = signal<Record<string, HsCandidate>>({});
  editingItemId = signal<string | null>(null);
  proceeded = signal(false);

  // Summary of the AI's own analysis
  requiresAnyPermit = false;
  agencySummary: AgencySummaryRow[] = [];
  avgConfidence = 0;

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
    const map = new Map<string, { full: string; count: number; licenseTypes: Set<string> }>();
    for (const item of this.data.items) {
      if (!item.requiresPermit) continue;
      const cur = map.get(item.agency) ?? { full: item.agencyFull, count: 0, licenseTypes: new Set<string>() };
      cur.count++;
      if (item.licenseType) cur.licenseTypes.add(item.licenseType);
      map.set(item.agency, cur);
    }
    this.agencySummary = Array.from(map.entries()).map(([code, v]) => {
      const pay = getAgencyPayment(code);
      return { code, full: v.full, count: v.count, requiresFee: pay.requiresFee, amount: pay.amount, licenseTypes: Array.from(v.licenseTypes) };
    });
    this.avgConfidence = Math.round(this.data.items.reduce((sum, i) => sum + i.confidence, 0) / this.data.items.length);
  }

  isGroupConfirmed(key: string): boolean { return this.confirmedGroups()[key]; }
  groupStyle(key: string) { return GROUP_STYLE[key] ?? GROUP_STYLE['—']; }

  /** Effective HS Code/tariff/duty/confidence for display — reflects any in-progress edit. */
  displayHs(item: ProductHsAnalysis): { hsCode: string; tariffCode: string; dutyRate: number; confidence: number } {
    const c = this.overrides()[item.id];
    return c
      ? { hsCode: c.hsCode, tariffCode: c.tariffCode, dutyRate: c.dutyRate, confidence: c.confidence }
      : { hsCode: item.hsCode, tariffCode: item.tariffCode, dutyRate: item.dutyRate, confidence: item.confidence };
  }

  isManuallyEdited(item: ProductHsAnalysis): boolean {
    return !!this.overrides()[item.id] || !!item.manuallyEdited;
  }

  canEditItem(group: AgencyGroup): boolean {
    return !this.proceeded() && !this.isGroupConfirmed(group.key);
  }

  toggleEdit(itemId: string, group: AgencyGroup): void {
    if (!this.canEditItem(group)) return;
    this.editingItemId.update(cur => (cur === itemId ? null : itemId));
  }

  selectCandidate(item: ProductHsAnalysis, candidate: HsCandidate): void {
    if (this.proceeded()) return;
    this.overrides.update(o => ({ ...o, [item.id]: candidate }));
    this.editingItemId.set(null);
  }

  confirmGroup(key: string): void {
    if (this.proceeded() || this.isGroupConfirmed(key)) return;
    this.confirmedGroups.update(s => ({ ...s, [key]: true }));
  }

  readonly allDecided = () => this.groups.every(g => this.isGroupConfirmed(g.key));
  readonly decidedCount = () => this.groups.filter(g => this.isGroupConfirmed(g.key)).length;

  proceed(): void {
    if (this.proceeded() || !this.allDecided()) return;
    this.proceeded.set(true);
    const overrides = this.overrides();
    const resolved = this.data.items.map(item => {
      const c = overrides[item.id];
      if (!c) return item;
      return { ...item, hsCode: c.hsCode, tariffCode: c.tariffCode, dutyRate: c.dutyRate, confidence: c.confidence, manuallyEdited: true };
    });
    this.confirmed.emit(resolved);
  }
}
