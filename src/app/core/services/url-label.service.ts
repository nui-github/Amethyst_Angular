import { Injectable, signal, computed } from '@angular/core';
import { MOCK_SPN_COMPANIES, SpnCompany, SpnUrl } from '@mock/spn-companies.mock';

const STORAGE_KEY = 'spn_url_labels';

export interface UrlLabelEntry {
  urlId: string;
  companyId: string;
  defaultLabel: string;
  url: string;
  env: string;
  customLabel: string;
}

@Injectable({ providedIn: 'root' })
export class UrlLabelService {

  private readonly _labels = signal<Record<string, string>>(this.load());

  /** Get display label for a url id (custom or default) */
  getLabel(urlId: string, defaultLabel: string): string {
    return this._labels()[urlId] ?? defaultLabel;
  }

  /** All entries with resolved labels for the settings UI */
  readonly allEntries = computed<UrlLabelEntry[]>(() => {
    const labels = this._labels();
    const entries: UrlLabelEntry[] = [];
    for (const company of MOCK_SPN_COMPANIES) {
      for (const u of company.urls) {
        entries.push({
          urlId: u.id,
          companyId: company.id,
          defaultLabel: u.label,
          url: u.url,
          env: u.env,
          customLabel: labels[u.id] ?? u.label,
        });
      }
    }
    return entries;
  });

  entriesForCompany(companyId: string): UrlLabelEntry[] {
    return this.allEntries().filter(e => e.companyId === companyId);
  }

  saveLabel(urlId: string, label: string): void {
    const trimmed = label.trim();
    const next = { ...this._labels() };
    if (trimmed) {
      next[urlId] = trimmed;
    } else {
      delete next[urlId];
    }
    this._labels.set(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  resetLabel(urlId: string): void {
    const next = { ...this._labels() };
    delete next[urlId];
    this._labels.set(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  private load(): Record<string, string> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }
}
