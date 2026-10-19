import { translate } from '@common';
import { formatDate, formatRelative, toMillis } from '@/utils/format';

/**
 * The app's short names for the future inventory types (FUTURE_INV_ITEM_TYPE enums), whose seed
 * descriptions are long ("Pre-Order Supply (New Style)"). A type without one shows its description.
 */
const FUTURE_INVENTORY_TYPE_NAMES: Record<string, string> = {
  FIT_PRE_ORDER: 'Pre-order',
  FIT_BACK_ORDER: 'Back-order',
};

/** A future inventory type's name: the app's short name, else the enum's description, else its id. */
export const futureInventoryTypeLabel = (typeId?: string, description?: string) =>
  translate((typeId && FUTURE_INVENTORY_TYPE_NAMES[typeId]) || description || typeId || 'Unknown');

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

/**
 * A quantity without trailing zeros: 12, 12.5. A number, not a string: vue-i18n picks a message's
 * plural form ("{count} unit | {count} units") from a numeric `count` only.
 */
export const formatQuantity = (value: unknown): number => {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? Number(number.toFixed(4)) : 0;
};
