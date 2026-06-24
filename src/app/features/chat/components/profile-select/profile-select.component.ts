import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, NgZone, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { ChatService } from '@app/core/services/chat.service';
import { MOCK_SPN_PROFILES, SpnProfile } from '@mock/spn-companies.mock';

export interface ProfileSelectData {
  /** 'select' = upload path, no prior profile.
   *  'confirm' = SPN path, show current + option to change. */
  mode: 'select' | 'confirm';
  currentProfileCode?: string;
  /** Which flow to continue after profile confirmed */
  afterFlow: 'agency-docs' | 'proceed';
  agency?: string; // needed when afterFlow='agency-docs'
}

@Component({
  selector: 'app-profile-select',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [CommonModule, NzButtonModule],
  template: `
    <div class="ps-wrap" [class.ps-wrap--done]="done">

      <div class="ps-header">
        @if (data.mode === 'confirm' && !showAll) {
          <p class="ps-title">ใช้โปรไฟล์ที่เชื่อมต่ออยู่?</p>
          <p class="ps-sub">เลือกโปรไฟล์ที่ต้องการใช้ในการส่งข้อมูลไปยังกรม</p>
        } @else {
          <p class="ps-title">เลือกโปรไฟล์ ShippingNet</p>
          <p class="ps-sub">เลือกโปรไฟล์ที่ต้องการใช้ในการส่งข้อมูลไปยังกรม</p>
        }
      </div>

      <!-- Confirm mode: show current profile + change option -->
      @if (data.mode === 'confirm' && !showAll) {
        <div class="ps-profiles">
          @if (currentProfile) {
            <button class="ps-profile-btn"
              [class.ps-profile-btn--selected]="selected === currentProfile.code"
              [disabled]="done"
              (click)="select(currentProfile.code)">
              <span class="ps-avatar" [style.background]="currentProfile.color + '22'" [style.color]="currentProfile.color">
                {{ currentProfile.code.slice(0, 2) }}
              </span>
              <span class="ps-info">
                <span class="ps-info__name">{{ currentProfile.displayName }}</span>
                <span class="ps-info__user">{{ currentProfile.username }}</span>
              </span>
              <span class="ps-badge ps-badge--current">ใช้อยู่</span>
              @if (selected === currentProfile.code) {
                <span class="ps-check">✓</span>
              }
            </button>
          }
          <button class="ps-profile-btn ps-profile-btn--change" [disabled]="done" (click)="showAll = true; cdr.detectChanges()">
            <span class="ps-avatar ps-avatar--gray">↻</span>
            <span class="ps-info">
              <span class="ps-info__name">เปลี่ยนโปรไฟล์</span>
              <span class="ps-info__user">เลือกโปรไฟล์อื่น</span>
            </span>
          </button>
        </div>
      } @else {
        <!-- Full profile list -->
        <div class="ps-profiles">
          @for (p of profiles; track p.code) {
            <button class="ps-profile-btn"
              [class.ps-profile-btn--selected]="selected === p.code"
              [disabled]="done"
              (click)="select(p.code)">
              <span class="ps-avatar" [style.background]="p.color + '22'" [style.color]="p.color">
                {{ p.code.slice(0, 2) }}
              </span>
              <span class="ps-info">
                <span class="ps-info__name">{{ p.displayName }}</span>
                <span class="ps-info__user">{{ p.username }}</span>
              </span>
              @if (selected === p.code) {
                <span class="ps-check">✓</span>
              }
            </button>
          }
        </div>
      }

      @if (!done) {
        <button nz-button nzType="primary" nzBlock class="ps-confirm-btn"
          [disabled]="!selected" (click)="confirm()">
          ยืนยันโปรไฟล์และดำเนินการต่อ
        </button>
      }
    </div>
  `,
  styleUrl: './profile-select.component.scss',
})
export class ProfileSelectComponent {
  @Input() data!: ProfileSelectData;

  readonly chat = inject(ChatService);
  readonly cdr  = inject(ChangeDetectorRef);
  readonly zone = inject(NgZone);

  readonly profiles = MOCK_SPN_PROFILES;
  selected: string | null = null;
  showAll = false;
  done = false;

  get currentProfile(): SpnProfile | undefined {
    return MOCK_SPN_PROFILES.find(p => p.code === this.data?.currentProfileCode);
  }

  ngOnInit(): void {
    // Pre-select current profile in confirm mode
    if (this.data?.mode === 'confirm' && this.data.currentProfileCode) {
      this.selected = this.data.currentProfileCode;
    }
  }

  select(code: string): void {
    if (this.done) return;
    this.selected = code;
    this.cdr.detectChanges();
  }

  confirm(): void {
    if (!this.selected || this.done) return;
    this.done = true;
    this.cdr.detectChanges();
    const profile = MOCK_SPN_PROFILES.find(p => p.code === this.selected)!;
    this.chat.onProfileSelected(profile, this.data.afterFlow, this.data.agency);
  }
}
