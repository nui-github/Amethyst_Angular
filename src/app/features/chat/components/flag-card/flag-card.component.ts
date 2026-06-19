import {
  ChangeDetectionStrategy, Component, EventEmitter,
  Input, OnInit, Output, signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { LucideAngularModule, AlertTriangle, Check } from 'lucide-angular';
import { FlagCardData, FlagItem } from '@app/core/models/types';

@Component({
  selector: 'app-flag-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, NzButtonModule, NzInputModule, NzTagModule, NzAlertModule, LucideAngularModule],
  templateUrl: './flag-card.component.html',
  styleUrl: './flag-card.component.scss',
})
export class FlagCardComponent implements OnInit {
  @Input({ required: true }) data!: FlagCardData;

  @Output() flagConfirmed = new EventEmitter<{ flagId: string; value: string }>();
  @Output() allConfirmed  = new EventEmitter<void>();

  readonly AlertTriangle = AlertTriangle;
  readonly Check = Check;

  // Local mutable state — mirrors data.flags but tracks pending input
  pendingValues = signal<Record<string, string>>({});
  localFlags    = signal<FlagItem[]>([]);

  readonly allDone = () => this.localFlags().every(f => f.isConfirmed);

  ngOnInit(): void {
    this.localFlags.set(this.data.flags.map(f => ({ ...f })));
  }

  selectQty(flagId: string, option: string): void {
    this.pendingValues.update(v => ({ ...v, [flagId]: option }));
  }

  onTextInput(flagId: string, value: string): void {
    this.pendingValues.update(v => ({ ...v, [flagId]: value }));
  }

  confirmFlag(flag: FlagItem): void {
    const value = this.pendingValues()[flag.id];
    if (!value?.trim()) return;

    this.localFlags.update(fs => fs.map(f =>
      f.id === flag.id ? { ...f, isConfirmed: true, confirmedValue: value } : f
    ));
    this.flagConfirmed.emit({ flagId: flag.id, value });
  }

  unconfirmFlag(flag: FlagItem): void {
    this.localFlags.update(fs => fs.map(f =>
      f.id === flag.id ? { ...f, isConfirmed: false, confirmedValue: null } : f
    ));
    this.pendingValues.update(v => ({ ...v, [flag.id]: '' }));
  }

  proceed(): void {
    if (this.allDone()) this.allConfirmed.emit();
  }

  getPending(flagId: string): string {
    return this.pendingValues()[flagId] ?? '';
  }

  confColor(conf: number): string {
    return conf >= 85 ? '#10B981' : conf >= 70 ? '#F59E0B' : '#EF4444';
  }
}
