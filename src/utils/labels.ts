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

/** Each id's name, with the id after it where another id has the same name; an id with no name shows as itself. */
function uniqueLabels(rows: { id: string; name?: string }[]): Map<string, string> {
  const uses = new Map<string, number>();
  rows.forEach((row) => uses.set(row.name || row.id, (uses.get(row.name || row.id) || 0) + 1));
  return new Map(rows.map((row) => [row.id, (uses.get(row.name || row.id) || 0) > 1 && row.name ? `${row.name} (${row.id})` : row.name || row.id]));
}

/** Store pickers' names: each store's name, with its id after it where another store has the same name, by id. */
export const productStoreLabels = (rows: { productStoreId: string; storeName?: string }[]): Map<string, string> =>
  uniqueLabels(rows.map((row) => ({ id: row.productStoreId, name: row.storeName })));

/** Facility pickers' names: each facility's name, with its id after it where another facility has the same name, by id. */
export const facilityLabels = (rows: { facilityId: string; facilityName?: string }[]): Map<string, string> =>
  uniqueLabels(rows.map((row) => ({ id: row.facilityId, name: row.facilityName })));

/** A party id to show, or undefined for `_NA_`, the placeholder party of an order with no customer or supplier. */
export const shownPartyId = (partyId?: string) => (partyId && partyId !== '_NA_' ? partyId : undefined);

/**
 * A future inventory type's name: the app's short name (translated), else the enum's description or id as OMS
 * has it: seed data is not a message key.
 */
export const futureInventoryTypeLabel = (typeId?: string, description?: string) => {
  const name = typeId && FUTURE_INVENTORY_TYPE_NAMES[typeId];
  if (name) return translate(name);
  return description || typeId || translate('Unknown');
};

/** An enum's short name: its description up to the colon, for the reasons whose description defines them ("Reallocated: an order line's ..."). */
export const shortDescription = (description?: string) => (description || '').split(':')[0].trim();

/**
 * What a description says after its name, from a capital: "The quantity on order cancelled to 0" for "Cancelled: the
 * quantity on order cancelled to 0". Empty for a description with no colon ("Active Inbound Supply").
 */
export function descriptionExplanation(description?: string): string {
  const colon = (description || '').indexOf(':');
  if (colon < 0) return '';
  const explanation = (description || '').slice(colon + 1).trim();
  return explanation.charAt(0).toUpperCase() + explanation.slice(1);
}

/**
 * The app's short names for the future inventory batch statuses (FII_STATUS), whose seed descriptions explain them
 * ("Cancelled: the quantity on order cancelled to 0") and are too long for a badge.
 */
const FUTURE_INVENTORY_STATUS_NAMES: Record<string, string> = {
  FUTURE_INV_ACTIVE: 'Active',
  FUTURE_INV_EXPIRED: 'Expired',
  FUTURE_INV_RECEIVED: 'Received',
  FUTURE_INV_CANCELLED: 'Cancelled',
  FUTURE_INV_INACTIVE: 'Inactive',
};

/**
 * A future inventory batch status's badge label: the app's short name (translated), else the description's name
 * before its colon, else the id. Its explanation is descriptionExplanation(description).
 */
export const futureInventoryStatusLabel = (statusId?: string, description?: string) => {
  const name = statusId && FUTURE_INVENTORY_STATUS_NAMES[statusId];
  if (name) return translate(name);
  return shortDescription(description) || statusId || translate('Unknown');
};

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

const IMPORT_NOT_STARTED = ['DmlsPending', 'DmlsQueued'];
const IMPORT_RUNNING = ['DmlsRunning', 'DmlsCancelRequested'];

/**
 * Where a Data Manager log stands when it has no finish time: not started while it waits, running while it runs, and
 * the status's own description for any other (a log that ended without a finish time is not "Not started").
 */
export function importProgressLabel(statusId: string, startDateTime: number | string | undefined, statusDescription: string) {
  if (IMPORT_NOT_STARTED.includes(statusId)) return translate('Not started');
  if (IMPORT_RUNNING.includes(statusId)) return translate('Running');
  return statusDescription || (startDateTime ? translate('Running') : translate('Not started'));
}

/** The shipment statuses an inbound shipment is closed in: received or cancelled, nothing more arrives on it. */
export const CLOSED_SHIPMENT_STATUSES = ['PURCH_SHIP_RECEIVED', 'PURCH_SHIP_CANCELLED'];

/** A received or cancelled inbound shipment: no longer on its way. */
export const isClosedShipment = (statusId?: string) => CLOSED_SHIPMENT_STATUSES.includes(statusId || '');

/**
 * An open inbound shipment some, but not all, of whose units were received (accepted or rejected). OMS keeps such a
 * shipment in its created or shipped status until every unit is received.
 */
export function isPartlyReceived(shipment: { statusId?: string; quantityTotal?: number | string; receivedQuantity?: number | string; rejectedQuantity?: number | string }) {
  if (isClosedShipment(shipment.statusId)) return false;
  const handled = Number(shipment.receivedQuantity || 0) + Number(shipment.rejectedQuantity || 0);
  return handled > 0 && handled < Number(shipment.quantityTotal || 0);
}

/** An inbound shipment's status as the user reads it: "Partly received" while part of it is received, else its status's description. */
export const shipmentStatusLabel = (shipment: Parameters<typeof isPartlyReceived>[0], statusDescription: string) =>
  (isPartlyReceived(shipment) ? translate('Partly received') : statusDescription);

/** The receive button's label, in the plural form of its unit count: "Receive 1 unit", "Receive 3 units". */
export const receiveUnitsLabel = (units: number) => translate('Receive {count} units', countParams(units));
