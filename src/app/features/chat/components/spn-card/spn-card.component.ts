import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { ChatService } from '@app/core/services/chat.service';

const PAGE_SIZE = 5;

@Component({
  selector: 'app-spn-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [CommonModule, NzButtonModule],
  templateUrl: './spn-card.component.html',
  styleUrl: './spn-card.component.scss',
})
export class SpnCardComponent {
  readonly chat = inject(ChatService);
  readonly cdr  = inject(ChangeDetectorRef);

  page     = signal(1);
  selected = signal<string | null>(null);
  done     = signal(false);

  readonly entries    = computed(() => this.chat.spnEntries());
  readonly total      = computed(() => this.entries().length);
  readonly totalPages = computed(() => Math.ceil(this.total() / PAGE_SIZE));

  readonly pageEntries = computed(() => {
    const start = (this.page() - 1) * PAGE_SIZE;
    return this.entries().slice(start, start + PAGE_SIZE);
  });

  select(ref: string, queued: boolean): void {
    if (queued || this.done()) return;
    this.selected.set(this.selected() === ref ? null : ref);
    this.cdr.detectChanges();
  }

  confirm(): void {
    const ref = this.selected();
    if (!ref || this.done()) return;
    this.done.set(true);
    this.cdr.detectChanges();
    this.chat.selectSpnEntry(ref);
  }

  prevPage(): void { if (this.page() > 1) this.page.update(p => p - 1); }
  nextPage(): void { if (this.page() < this.totalPages()) this.page.update(p => p + 1); }
  pages(): number[] { return Array.from({ length: this.totalPages() }, (_, i) => i + 1); }
}
