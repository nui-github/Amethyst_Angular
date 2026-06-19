import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { LucideAngularModule, User, Lock, Wifi } from 'lucide-angular';
import { ChatService } from '@app/core/services/chat.service';

@Component({
  selector: 'app-connect-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, NzInputModule, NzFormModule, LucideAngularModule],
  template: `
    <div class="connect-panel">
      <p class="connect-panel__title">
        <lucide-icon [img]="Wifi" [size]="15" color="#0463EF" />
        เชื่อมต่อ ShippingNet
      </p>
      <p class="connect-panel__sub">กรอกข้อมูลเข้าสู่ระบบ ShippingNet เพื่อดึงข้อมูลใบขนสินค้า</p>

      <div class="connect-panel__form">
        <div class="field">
          <label>ชื่อผู้ใช้</label>
          <nz-input-group [nzPrefix]="userIcon" nzSize="small">
            <input nz-input [(ngModel)]="username" placeholder="username" [disabled]="loading()" />
          </nz-input-group>
          <ng-template #userIcon><lucide-icon [img]="User" [size]="13" color="#999" /></ng-template>
        </div>
        <div class="field">
          <label>รหัสผ่าน</label>
          <nz-input-group [nzPrefix]="lockIcon" nzSize="small">
            <input nz-input type="password" [(ngModel)]="password" placeholder="password" [disabled]="loading()" />
          </nz-input-group>
          <ng-template #lockIcon><lucide-icon [img]="Lock" [size]="13" color="#999" /></ng-template>
        </div>
        <button class="connect-btn" (click)="connect()"
          [disabled]="!username.trim() || !password.trim() || loading()">
          {{ loading() ? 'กำลังเชื่อมต่อ...' : 'เชื่อมต่อ' }}
        </button>
      </div>
    </div>
  `,
  styleUrl: './connect-panel.component.scss',
})
export class ConnectPanelComponent {
  readonly chat = inject(ChatService);
  readonly Wifi = Wifi;
  readonly User = User;
  readonly Lock = Lock;

  username = '';
  password = '';
  loading = signal(false);

  connect(): void {
    if (!this.username.trim() || !this.password.trim()) return;
    this.loading.set(true);
    // Mock auth delay 1200ms
    setTimeout(() => {
      this.loading.set(false);
      this.chat.onConnected(this.chat.pendingRef());
    }, 1200);
  }
}
