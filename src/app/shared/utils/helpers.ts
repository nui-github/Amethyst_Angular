import { CustomsDeclarationData } from '@app/core/models/types';

let _counter = 0;
export const generateId = () => `id_${Date.now()}_${_counter++}`;
export const getTime = () => new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

/**
 * Merges a newer OCR pass into an existing CustomsDeclarationData — used when a later upload
 * step (e.g. agency-upload's own OCR) reads more of the same document set. Non-empty header
 * fields from `next` win; items are merged by itemNumber (matching items are overwritten field
 * by field, new itemNumbers are appended) so nothing already captured is lost.
 */
export function mergeCustomsDeclaration(
  base: CustomsDeclarationData | undefined,
  next: CustomsDeclarationData | undefined,
): CustomsDeclarationData | undefined {
  if (!base) return next;
  if (!next) return base;

  const header: CustomsDeclarationData = { ...base, items: [] };
  for (const [key, value] of Object.entries(next)) {
    if (key === 'items') continue;
    if (value !== undefined && value !== '') (header as unknown as Record<string, unknown>)[key] = value;
  }

  const byItemNumber = new Map(base.items.map(i => [i.itemNumber, i]));
  for (const item of next.items) {
    const existing = byItemNumber.get(item.itemNumber);
    byItemNumber.set(item.itemNumber, existing ? { ...existing, ...item } : item);
  }

  return { ...header, items: Array.from(byItemNumber.values()) };
}
