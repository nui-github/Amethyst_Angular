import { Injectable, computed, signal } from '@angular/core';
import { Shipment, ShipmentStatus } from '@app/core/models/types';
import { MOCK_QUEUE, STATUS_META, AGENCY_LABEL, AGENCY_SHORT } from '@mock/queue.mock';

export { STATUS_META, AGENCY_LABEL, AGENCY_SHORT };

@Injectable({ providedIn: 'root' })
export class QueueService {
  readonly queue        = signal<Shipment[]>(MOCK_QUEUE);
  readonly openId       = signal<string | null>(null);
  readonly needsYouCount = computed(() =>
    this.queue().filter(s => s.isNew === true).length
  );

  update(id: string, patch: Partial<Shipment>): void {
    this.queue.update(q => q.map(s => s.id === id ? { ...s, ...patch } : s));
  }

  add(items: Shipment[]): void {
    this.queue.update(q => [...q, ...items]);
  }

  open(id: string): void {
    if (!id) { this.openId.set(null); return; }
    this.openId.set(id);
    const ship = this.get(id);
    if (ship) {
      const sealed = (ship.messages ?? []).map(m => ({ ...m, isReadOnly: true }));
      this.update(id, { isNew: false, messages: sealed });
    }
  }

  close(): void {
    this.openId.set(null);
  }

  get(id: string): Shipment | undefined {
    return this.queue().find(s => s.id === id);
  }

  getStatusMeta(status: ShipmentStatus) {
    return STATUS_META[status];
  }
}
