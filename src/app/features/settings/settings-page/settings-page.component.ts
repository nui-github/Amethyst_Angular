import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule, ArrowLeft, Globe, Pencil, Check, X, RotateCcw, Settings, ChevronRight, Building2 } from 'lucide-angular';
import { UrlLabelService } from '@app/core/services/url-label.service';
import { MOCK_SPN_COMPANIES, SpnCompany, SpnUrl } from '@mock/spn-companies.mock';

type SettingsSection = 'spn-url';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './settings-page.component.html',
  styleUrl: './settings-page.component.scss',
})
export class SettingsPageComponent {
  readonly urlLabels = inject(UrlLabelService);
  readonly router    = inject(Router);

  readonly ArrowLeft   = ArrowLeft;
  readonly Globe       = Globe;
  readonly Pencil      = Pencil;
  readonly Check       = Check;
  readonly IconX       = X;
  readonly RotateCcw   = RotateCcw;
  readonly Settings    = Settings;
  readonly ChevronRight = ChevronRight;
  readonly Building2   = Building2;

  readonly companies = MOCK_SPN_COMPANIES;

  // Settings sidebar nav
  activeSection = signal<SettingsSection>('spn-url');

  readonly navItems = [
    { id: 'spn-url' as SettingsSection, label: 'ตั้งชื่อ SPN URL', icon: Globe },
  ];

  // Company drill-down (null = list view, string = detail view)
  selectedCompanyId = signal<string | null>(null);

  readonly selectedCompany = computed<SpnCompany | null>(() =>
    this.companies.find(c => c.id === this.selectedCompanyId()) ?? null
  );

  // Inline edit
  editingId    = signal<string>('');
  editingValue = signal<string>('');

  envColor(env: string): string {
    return env === 'production' ? '#0D8F61' : env === 'uat' ? '#B45309' : '#6B7280';
  }
  envLabel(env: string): string {
    return env === 'production' ? 'PROD' : env === 'uat' ? 'UAT' : 'DEV';
  }

  customizedCount(company: SpnCompany): number {
    return company.urls.filter(u => this.urlLabels.getLabel(u.id, u.label) !== u.label).length;
  }

  displayLabel(u: SpnUrl): string {
    return this.urlLabels.getLabel(u.id, u.label);
  }

  isCustom(u: SpnUrl): boolean {
    return this.urlLabels.getLabel(u.id, u.label) !== u.label;
  }

  selectCompany(id: string): void {
    this.selectedCompanyId.set(id);
    this.cancelEdit();
  }

  backToList(): void {
    this.selectedCompanyId.set(null);
    this.cancelEdit();
  }

  startEdit(u: SpnUrl): void {
    this.editingId.set(u.id);
    this.editingValue.set(this.displayLabel(u));
  }

  saveEdit(urlId: string): void {
    this.urlLabels.saveLabel(urlId, this.editingValue());
    this.cancelEdit();
  }

  cancelEdit(): void {
    this.editingId.set('');
    this.editingValue.set('');
  }

  resetUrl(u: SpnUrl): void {
    this.urlLabels.resetLabel(u.id);
    if (this.editingId() === u.id) this.cancelEdit();
  }

  goBack(): void { this.router.navigate(['/']); }
}
