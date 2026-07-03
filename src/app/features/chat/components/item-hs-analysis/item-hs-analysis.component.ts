import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Search, Check, X } from 'lucide-angular';
import { ItemHsAnalysisData, ProductHsAnalysis } from '@app/core/models/types';
import { AGENCY_CORRECTION_OPTIONS } from '@mock/product-hs-analysis.mock';

type ReviewStatus = 'pending' | 'confirmed' | 'corrected';

interface RowState {
  status: ReviewStatus;
  agency: string;
  agencyFull: string;
  correcting: boolean;
}

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
  readonly X = X;
  readonly agencyOptions = AGENCY_CORRECTION_OPTIONS;

  rows = signal<Record<string, RowState>>({});
  proceeded = signal(false);

  ngOnInit(): void {
    const init: Record<string, RowState> = {};
    for (const item of this.data.items) {
      init[item.id] = { status: this.data.reviewed ? 'confirmed' : 'pending', agency: item.agency, agencyFull: item.agencyFull, correcting: false };
    }
    this.rows.set(init);
    this.proceeded.set(!!this.data.reviewed);
  }

  row(id: string): RowState { return this.rows()[id]; }

  requiresPermit(item: ProductHsAnalysis): boolean {
    return this.row(item.id).agency !== '—';
  }

  confirm(item: ProductHsAnalysis): void {
    if (this.proceeded()) return;
    this.rows.update(r => ({ ...r, [item.id]: { ...r[item.id], status: 'confirmed', correcting: false } }));
  }

  openCorrect(item: ProductHsAnalysis): void {
    if (this.proceeded()) return;
    this.rows.update(r => ({ ...r, [item.id]: { ...r[item.id], correcting: true } }));
  }

  cancelCorrect(item: ProductHsAnalysis): void {
    this.rows.update(r => ({ ...r, [item.id]: { ...r[item.id], correcting: false } }));
  }

  applyCorrection(item: ProductHsAnalysis, code: string): void {
    const opt = this.agencyOptions.find(a => a.code === code);
    if (!opt) return;
    this.rows.update(r => ({ ...r, [item.id]: { status: 'corrected', agency: opt.code, agencyFull: opt.full, correcting: false } }));
  }

  readonly allDecided = () => this.data.items.every(i => this.row(i.id)?.status !== 'pending');
  readonly decidedCount = () => this.data.items.filter(i => this.row(i.id)?.status !== 'pending').length;

  proceed(): void {
    if (this.proceeded() || !this.allDecided()) return;
    this.proceeded.set(true);
    const result: ProductHsAnalysis[] = this.data.items.map(item => {
      const r = this.row(item.id);
      return { ...item, agency: r.agency, agencyFull: r.agencyFull, requiresPermit: r.agency !== '—' };
    });
    this.confirmed.emit(result);
  }
}
