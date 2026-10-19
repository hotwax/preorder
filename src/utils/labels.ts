import { translate } from '@common';
import { countParams, daysFromToday, formatDate, formatQuantity } from '@/utils/format';

/**
 * The app's short names for the future inventory types (FUTURE_INV_ITEM_TYPE enums), whose seed
 * descriptions are long ("Pre-Order Supply (New Style)"). A type without one shows its description.
 */
const FUTURE_INVENTORY_TYPE_NAMES: Record<string, string> = {
  FIT_PRE_ORDER: 'Pre-order',
  FIT_BACK_ORDER: 'Back-order',
};

/** A party id to show, or undefined for `_NA_`, the placeholder party of an order with no customer or supplier. */
export const shownPartyId = (partyId?: string) => (partyId && partyId !== '_NA_' ? partyId : undefined);

/** A future inventory type's name: the app's short name, else the enum's description, else its id. */
export const futureInventoryTypeLabel = (typeId?: string, description?: string) =>
  translate((typeId && FUTURE_INVENTORY_TYPE_NAMES[typeId]) || description || typeId || 'Unknown');

/** An enum's short name: its description up to the colon, for the reasons whose description defines them ("Reallocated: an order line's ..."). */
export const shortDescription = (description?: string) => (description || '').split(':')[0].trim();

const NOTE_DATE = /\b\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?(?![\d-])/g;
const NOTE_DECIMAL = /(?<![\w.])\d+\.\d+(?![\w.])/g;

/**
 * A note OMS wrote on a ledger row, as the rest of the page reads: its dates as dates ("2026-11-30 00:00" reads
 * "Nov 30, 2026") and its quantities without trailing zeros ("Reallocated 3.0 for" reads "Reallocated 3 for").
 */
export function readableNote(note?: string): string {
  if (!note) return '';
  return note
    .replace(NOTE_DATE, (value) => formatDate(value.slice(0, 10)) || value)
    .replace(NOTE_DECIMAL, (value) => formatQuantity(value));
}

/** A date range as one value: "Nov 2, 2026", or "Nov 2, 2026 - Dec 1, 2026" when the ends differ. */
export function formatDateRange(start?: number | string, end?: number | string): string {
  const from = formatDate(start);
  const thru = formatDate(end);
  if (!from) return thru;
  if (!thru || from === thru) return from;
  return `${from} - ${thru}`;
}

/**
 * Whole days a date-only value (a promise or arrival date) has passed by, counted in calendar days in the user's
 * time zone; 0 when it is today, later or empty.
 */
export const daysOverdue = (value?: number | string) => {
  const days = daysFromToday(value);
  return days !== undefined && days < 0 ? -days : 0;
};

/** "Overdue by 3 days": a promise or arrival date that has passed while its stock is still awaited. */
export const overdueLabel = (days: number) => translate('Overdue by {count} days', countParams(days));
