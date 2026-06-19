import { ChangeDetectionStrategy, Component, EventEmitter, Output, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { ChatService } from '@app/core/services/chat.service';

const PAGE_SIZE = 5;

@Component({
  selector: 'app-spn-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NzButtonModule, NzTagModule],
  templateUrl: './spn-card.component.html',
  styleUrl: './spn-card.component.scss',
})
export class SpnCardComponent {
  @Output() requestPermit = new EventEmitter<string[]>();

  readonly chat = inject(ChatService);
  readonly pageSize = PAGE_SIZE;

  page     = signal(1);
  selected = signal<Set<string>>(new Set());

  readonly entries      = computed(() => this.chat.spnEntries());
  readonly total        = computed(() => this.entries().length);
  readonly totalPages   = computed(() => Math.ceil(this.total() / PAGE_SIZE));
  readonly selectedCount = computed(() => this.selected().size);

  readonly pageEntries = computed(() => {
    const start = (this.page() - 1) * PAGE_SIZE;
    return this.entries().slice(start, start + PAGE_SIZE);
  });

  isSelected(ref: string): boolean { return this.selected().has(ref); }

  toggle(ref: string, queued: boolean): void {
    if (queued) return;
    this.selected.update(s => {
      const next = new Set(s);
      next.has(ref) ? next.delete(ref) : next.add(ref);
      return next;
    });
  }

  requestOne(ref: string): void { this.requestPermit.emit([ref]); }

  requestSelected(): void {
    if (this.selected().size > 0) this.requestPermit.emit(Array.from(this.selected()));
  }

  prevPage(): void { if (this.page() > 1) this.page.update(p => p - 1); }
  nextPage(): void { if (this.page() < this.totalPages()) this.page.update(p => p + 1); }

  pages(): number[] { return Array.from({ length: this.totalPages() }, (_, i) => i + 1); }
}
