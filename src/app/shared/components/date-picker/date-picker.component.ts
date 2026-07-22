import { ChangeDetectionStrategy, Component, Input, ViewChild, forwardRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NzDatePickerComponent, NzDatePickerModule } from 'ng-zorro-antd/date-picker';

@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [CommonModule, FormsModule, NzDatePickerModule],
  templateUrl: './date-picker.component.html',
  styleUrls: ['./date-picker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatePickerComponent),
      multi: true,
    },
  ],
})
export class DatePickerComponent implements ControlValueAccessor {
  @Input() placeholder = 'เลือกวันที่';
  @Input() disabled = false;

  @ViewChild(NzDatePickerComponent) private picker?: NzDatePickerComponent;

  readonly value = signal<Date | null>(null);
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  /** Drive the calendar open explicitly instead of relying on nz-date-picker's own
   *  host-level click delegation, which does not reliably fire the panel open in
   *  this app's drawer/backdrop layout. */
  onFieldClick(): void {
    if (this.disabled) return;
    this.picker?.open();
  }

  /** CDK's connected-position strategy computes the dropdown's placement while the
   *  entrance-animation panel is still mid-transition (collapsed height), so the
   *  very first open lands the calendar at (0,0) instead of anchored under the
   *  field. A resize-event nudge once the panel settles forces CDK's reposition
   *  listener to recompute against the now-settled layout. */
  onOpenChange(open: boolean): void {
    if (!open) return;
    setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
  }

  writeValue(value: string | null | undefined): void {
    this.value.set(value ? this.parseIsoDate(value) : null);
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onDateChange(date: Date | null): void {
    this.value.set(date);
    this.onChange(date ? this.formatIsoDate(date) : '');
    this.onTouched();
  }

  private parseIsoDate(value: string): Date | null {
    const parts = value.split('-').map(Number);
    if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
    const [year, month, day] = parts;
    return new Date(year, month - 1, day);
  }

  private formatIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
