import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrintLicenseData } from '@app/core/models/types';

@Component({
  selector: 'app-license-print',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './license-print.component.html',
  styleUrl: './license-print.component.scss',
})
export class LicensePrintComponent implements OnInit {
  data = signal<PrintLicenseData | null>(null);

  ngOnInit(): void {
    const stored = sessionStorage.getItem('__printLicenseData');
    if (stored) this.data.set(JSON.parse(stored));
    setTimeout(() => window.print(), 600);
  }

  print(): void { window.print(); }
  close(): void { window.close(); }
}
