import { translate } from '@common';
import { formatDate, formatRelative, toMillis } from '@/utils/format';

/** Future inventory batch types, as the app names them. */
export const FUTURE_INVENTORY_TYPES = [
  { value: 'FIT_PRE_ORDER', label: 'Pre-order' },
  { value: 'FIT_BACK_ORDER', label: 'Back-order' },
];

export const futureInventoryTypeLabel = (typeId?: string) =>
  translate(FUTURE_INVENTORY_TYPES.find((type) => type.value === typeId)?.label || typeId || 'Unknown');

/** A date range as one value: "Nov 2, 2026", or "Nov 2, 2026 - Dec 1, 2026" when the ends differ. */
export function formatDateRange(start?: number | string, end?: number | string): string {
  const from = formatDate(start);
  const thru = formatDate(end);
  if (!from) return thru;
  if (!thru || from === thru) return from;
  return `${from} - ${thru}`;
}

/** "in 12 days" / "3 days ago" against now, for a promise or arrival date. */
export const relativeToNow = (value?: number | string) => formatRelative(value);

/** Whether a date has passed. */
export const isPast = (value?: number | string) => {
  const millis = toMillis(value);
  return millis !== undefined && millis < Date.now();
};

/** A quantity without trailing zeros: 12, 12.5. */
export const formatQuantity = (value: unknown) => {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? String(Number(number.toFixed(4))) : '0';
};
