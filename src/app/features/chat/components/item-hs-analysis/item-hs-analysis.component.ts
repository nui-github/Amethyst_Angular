import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Search, Check, ArrowDown, ArrowUp, Percent, ShieldCheck, Sprout, PackageCheck, Radiation, Pencil, X, CircleHelp, Biohazard, Fuel, Trees } from 'lucide-angular';
import { HsCandidate, ItemHsAnalysisData, ProductHsAnalysis } from '@app/core/models/types';
import { getAgencyPayment } from '@mock/payment.mock';
import { lookupHsCode } from '@mock/hs-code-db.mock';
import { ChatService } from '@app/core/services/chat.service';

interface AgencySummaryRow {
  code: string;
  full: string;
  count: number;
  requiresFee: boolean;
  amount: number;
  licenseTypes: string[];
}

interface AgencyGroup {
  key: string;          // AI-assigned agency code, or '—' (ไม่ต้องขอ) / '?' (จัดกลุ่มไม่ได้)
  full: string;
  items: ProductHsAnalysis[];
}

const GROUP_STYLE: Record<string, { color: string; bg: string; icon: 'shield' | 'sprout' | 'package' | 'radiation' | 'help' | 'biohazard' | 'fuel' | 'trees' }> = {
  'อย.': { color: '#0463EF', bg: 'rgba(4, 99, 239, 0.08)', icon: 'shield' },
  'กษ.': { color: '#B45309', bg: 'rgba(180, 83, 9, 0.08)', icon: 'sprout' },
  'ปส.': { color: '#7C3AED', bg: 'rgba(124, 58, 237, 0.08)', icon: 'radiation' },
  '—':   { color: '#6B7280', bg: 'rgba(107, 114, 128, 0.08)', icon: 'package' },
  '?':   { color: '#B45309', bg: 'rgba(180, 83, 9, 0.08)', icon: 'help' },
  // Export-path agencies (see 'Export path' in CLAUDE.md)
  'กรมควบคุมโรค': { color: '#DC2626', bg: 'rgba(220, 38, 38, 0.08)', icon: 'biohazard' },
  'เชื้อเพลิง':    { color: '#EA580C', bg: 'rgba(234, 88, 12, 0.08)', icon: 'fuel' },
  'การยาง':       { color: '#0D8F61', bg: 'rgba(13, 143, 97, 0.08)', icon: 'trees' },
};

@Component({
  selector: 'app-item-hs-analysis',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './item-hs-analysis.component.html',
  styleUrl: './item-hs-analysis.component.scss',
})
export class ItemHsAnalysisComponent implements OnInit {
  @Input({ required: true }) data!: ItemHsAnalysisData;
  @Output() confirmed = new EventEmitter<ProductHsAnalysis[]>();

  readonly chat = inject(ChatService);
  get isExport(): boolean { return this.chat.direction() === 'export'; }

  readonly Search = Search;
  readonly Check = Check;
  readonly ArrowDown = ArrowDown;
  readonly ArrowUp = ArrowUp;
  readonly Percent = Percent;
  readonly ShieldCheck = ShieldCheck;
  readonly Sprout = Sprout;
  readonly PackageCheck = PackageCheck;
  readonly Radiation = Radiation;
  readonly Pencil = Pencil;
  readonly X = X;
  readonly CircleHelp = CircleHelp;
  readonly Biohazard = Biohazard;
  readonly Fuel = Fuel;
  readonly Trees = Trees;

  // Local mutable clones of data.items — group membership is re-derived from `item.agency`
  // every time it changes (see rebuildGroups()), so re-classifying an item into a different
  // agency's candidate/manual HS Code just works: mutate the clone, rebuild, done.
  private items: ProductHsAnalysis[] = [];
  groups = signal<AgencyGroup[]>([]);
  confirmedGroups = signal<Record<string, boolean>>({});
  editingItemId = signal<string | null>(null);
  proceeded = signal(false);

  // Manual HS Code entry — user types a code, we "look it up" (mock DB), they confirm to use it
  manualHsInput = signal<Record<string, string>>({});
  manualHsResult = signal<Record<string, HsCandidate | null>>({}); // null = looked up, not found
  confirmingGroupKey = signal<string | null>(null);

  // Summary of the AI's own analysis
  requiresAnyPermit = false;
  agencySummary: AgencySummaryRow[] = [];
  avgConfidence = 0;

  ngOnInit(): void {
    this.items = this.data.items.map(i => ({ ...i }));
    this.rebuildGroups();

    const init: Record<string, boolean> = {};
    for (const g of this.groups()) init[g.key] = !!this.data.reviewed;
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

  /** Re-derive groups from `this.items` — call after any item.agency mutation. Order: '?'
   *  (unresolved, needs attention) first, permit-required agencies next, "ไม่ต้องขอ" last. */
  private rebuildGroups(): void {
    const byAgency = new Map<string, AgencyGroup>();
    for (const item of this.items) {
      const key = item.agency;
      if (!byAgency.has(key)) byAgency.set(key, { key, full: item.agencyFull, items: [] });
      byAgency.get(key)!.items.push(item);
    }
    const rank = (key: string) => (key === '?' ? -1 : key === '—' ? 1 : 0);
    this.groups.set(Array.from(byAgency.values()).sort((a, b) => rank(a.key) - rank(b.key)));
  }

  isGroupConfirmed(key: string): boolean { return this.confirmedGroups()[key]; }
  groupStyle(key: string) { return GROUP_STYLE[key] ?? GROUP_STYLE['—']; }
  groupLabel(key: string): string {
    if (key === '—') return 'ไม่ต้องขอใบอนุญาต';
    if (key === '?') return 'ไม่สามารถระบุ HS Code ได้';
    return key;
  }

  /** Effective HS Code/tariff/duty/confidence for display — item is mutated in place on edit. */
  displayHs(item: ProductHsAnalysis): { hsCode: string; tariffCode: string; dutyRate: number; confidence: number } {
    return { hsCode: item.hsCode, tariffCode: item.tariffCode, dutyRate: item.dutyRate, confidence: item.confidence };
  }

  isManuallyEdited(item: ProductHsAnalysis): boolean {
    return !!item.manuallyEdited;
  }

  canEditItem(group: AgencyGroup): boolean {
    return !this.proceeded() && !this.isGroupConfirmed(group.key);
  }

  toggleEdit(itemId: string, group: AgencyGroup): void {
    if (!this.canEditItem(group)) return;
    this.editingItemId.update(cur => (cur === itemId ? null : itemId));
    this.manualHsInput.update(m => ({ ...m, [itemId]: '' }));
    this.manualHsResult.update(m => { const { [itemId]: _, ...rest } = m; return rest; });
  }

  /** Applies a candidate/manual-lookup result to an item. When the candidate carries its own
   *  `agency` and it differs from the item's current one, the item is moved into that agency's
   *  group (creating it if needed) instead of just updating the HS Code shown in place — e.g.
   *  resolving a "ไม่สามารถระบุ HS Code" item, or correcting an item into a different department. */
  selectCandidate(item: ProductHsAnalysis, candidate: HsCandidate): void {
    if (this.proceeded()) return;
    const oldKey = item.agency;
    item.hsCode = candidate.hsCode;
    item.tariffCode = candidate.tariffCode;
    item.dutyRate = candidate.dutyRate;
    item.confidence = candidate.confidence;
    item.manuallyEdited = true;

    if (candidate.agency && candidate.agency !== oldKey) {
      item.agency = candidate.agency;
      item.agencyFull = candidate.agencyFull ?? candidate.agency;
      if (candidate.requiresPermit !== undefined) item.requiresPermit = candidate.requiresPermit;
      item.licenseType = candidate.licenseType;
      this.rebuildGroups();
      // Composition of both the old and new group changed — require re-confirming either.
      this.confirmedGroups.update(s => ({ ...s, [oldKey]: false, [candidate.agency!]: false }));
    }
    this.editingItemId.set(null);
  }

  // ── Manual HS Code entry ──────────────────────────────────────────────────────
  onManualHsInput(itemId: string, value: string): void {
    this.manualHsInput.update(m => ({ ...m, [itemId]: value }));
    this.manualHsResult.update(m => { const { [itemId]: _, ...rest } = m; return rest; });
  }

  searchManualHs(itemId: string): void {
    const input = this.manualHsInput()[itemId]?.trim();
    if (!input) return;
    const found = lookupHsCode(input);
    this.manualHsResult.update(m => ({ ...m, [itemId]: found ?? null }));
  }

  confirmManualHs(item: ProductHsAnalysis): void {
    const result = this.manualHsResult()[item.id];
    if (!result) return;
    this.selectCandidate(item, result);
    this.manualHsInput.update(m => ({ ...m, [item.id]: '' }));
    this.manualHsResult.update(m => { const { [item.id]: _, ...rest } = m; return rest; });
  }

  // ── Group confirmation (asks the user to double-check first) ───────────────────
  requestConfirmGroup(key: string): void {
    if (this.proceeded() || this.isGroupConfirmed(key) || key === '?') return;
    this.confirmingGroupKey.set(key);
  }

  cancelConfirmGroup(): void {
    this.confirmingGroupKey.set(null);
  }

  confirmGroup(key: string): void {
    if (this.proceeded() || this.isGroupConfirmed(key)) return;
    this.confirmedGroups.update(s => ({ ...s, [key]: true }));
    this.confirmingGroupKey.set(null);
  }

  get confirmingGroup(): AgencyGroup | undefined {
    const key = this.confirmingGroupKey();
    return key == null ? undefined : this.groups().find(g => g.key === key);
  }

  // The "?" group has nothing valid to confirm — it's considered "decided" only once every item
  // in it has been resolved into a real group (i.e. the group itself is empty and disappears).
  readonly allDecided = () => this.groups().every(g => g.key === '?' ? g.items.length === 0 : this.isGroupConfirmed(g.key));
  readonly decidedCount = () => this.groups().filter(g => g.key !== '?' && this.isGroupConfirmed(g.key)).length;
  readonly decidableCount = () => this.groups().filter(g => g.key !== '?').length;

  proceed(): void {
    if (this.proceeded() || !this.allDecided()) return;
    this.proceeded.set(true);
    this.confirmed.emit(this.items);
  }
}
