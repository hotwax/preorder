import { describe, expect, it } from 'vitest';
import { DateTime } from 'luxon';
import { formatDate } from '@/utils/format';
import {
  daysOverdue, descriptionExplanation, facilityLabels, formatDateRange, futureInventoryStatusLabel, futureInventoryTypeLabel, importProgressLabel, isClosedShipment, isPartlyReceived, overdueLabel, productStoreLabels,
  readableNote, receiveUnitsLabel, shipmentStatusLabel, shortDescription, shownPartyId,
} from '@/utils/labels';

describe('labels', () => {
  it('shows a party id, but not the _NA_ placeholder', () => {
    expect(shownPartyId('CUST_1')).toBe('CUST_1');
    expect(shownPartyId('_NA_')).toBeUndefined();
    expect(shownPartyId(undefined)).toBeUndefined();
  });

  it('names future inventory types, falling back to the id', () => {
    expect(futureInventoryTypeLabel('FIT_PRE_ORDER')).toBe('Pre-order');
    expect(futureInventoryTypeLabel('FIT_BACK_ORDER')).toBe('Back-order');
    expect(futureInventoryTypeLabel('OTHER')).toBe('OTHER');
    expect(futureInventoryTypeLabel('FIT_NEW', 'New supply')).toBe('New supply');
    expect(futureInventoryTypeLabel('FIT_PRE_ORDER', 'Pre-Order Supply (New Style)')).toBe('Pre-order');
  });

  it('shows one date when a range has equal or missing ends', () => {
    const day = Date.UTC(2026, 10, 2, 12);
    expect(formatDateRange(day, day)).toBe(formatDateRange(day, undefined));
    expect(formatDateRange(undefined, day)).toBe(formatDateRange(day));
    expect(formatDateRange(day, day + 86400000 * 30)).toContain(' - ');
  });

  it('counts the calendar days a date has passed by', () => {
    expect(daysOverdue(DateTime.now().minus({ days: 3 }).toMillis())).toBe(3);
    expect(daysOverdue(DateTime.now().toMillis())).toBe(0);
    expect(daysOverdue(DateTime.now().plus({ days: 1 }).toMillis())).toBe(0);
    expect(daysOverdue(undefined)).toBe(0);
  });

  it('says how late a date is, in the plural form of its day count', () => {
    expect(overdueLabel(1)).toBe('Overdue by 1 day');
    expect(overdueLabel(3)).toBe('Overdue by 3 days');
    expect(overdueLabel(1200)).toBe('Overdue by 1,200 days');
  });
});

describe('inbound shipment labels', () => {
  it('reads a shipment as closed once received or cancelled', () => {
    expect(isClosedShipment('PURCH_SHIP_RECEIVED')).toBe(true);
    expect(isClosedShipment('PURCH_SHIP_CANCELLED')).toBe(true);
    expect(isClosedShipment('PURCH_SHIP_CREATED')).toBe(false);
    expect(isClosedShipment(undefined)).toBe(false);
  });

  it('reads an open shipment as partly received when some, not all, of its units were received or rejected', () => {
    expect(isPartlyReceived({ statusId: 'PURCH_SHIP_CREATED', quantityTotal: 10, receivedQuantity: 4 })).toBe(true);
    expect(isPartlyReceived({ statusId: 'PURCH_SHIP_SHIPPED', quantityTotal: '10.000000', receivedQuantity: '0.0', rejectedQuantity: '2.0' })).toBe(true);
    expect(isPartlyReceived({ statusId: 'PURCH_SHIP_CREATED', quantityTotal: 10, receivedQuantity: 0, rejectedQuantity: 0 })).toBe(false);
    expect(isPartlyReceived({ statusId: 'PURCH_SHIP_CREATED', quantityTotal: 10, receivedQuantity: 8, rejectedQuantity: 2 })).toBe(false);
    expect(isPartlyReceived({ statusId: 'PURCH_SHIP_RECEIVED', quantityTotal: 10, receivedQuantity: 4 })).toBe(false);
    expect(isPartlyReceived({ statusId: 'PURCH_SHIP_CANCELLED', quantityTotal: 10, receivedQuantity: 4 })).toBe(false);
  });

  it('labels a partly received shipment as such, and any other by its status', () => {
    expect(shipmentStatusLabel({ statusId: 'PURCH_SHIP_CREATED', quantityTotal: 10, receivedQuantity: 4 }, 'Created')).toBe('Partly received');
    expect(shipmentStatusLabel({ statusId: 'PURCH_SHIP_CREATED', quantityTotal: 10, receivedQuantity: 0 }, 'Created')).toBe('Created');
    expect(shipmentStatusLabel({ statusId: 'PURCH_SHIP_RECEIVED', quantityTotal: 10, receivedQuantity: 10 }, 'Received')).toBe('Received');
  });

  it('says how many units the receive button receives, in their plural form', () => {
    expect(receiveUnitsLabel(1)).toBe('Receive 1 unit');
    expect(receiveUnitsLabel(3)).toBe('Receive 3 units');
    expect(receiveUnitsLabel(1200)).toBe('Receive 1,200 units');
  });
});

describe('ledger notes', () => {
  it('shortens a reason defined by its description', () => {
    expect(shortDescription("Reallocated: an order line's reservation moved from this batch to another")).toBe('Reallocated');
    expect(shortDescription('Reserved')).toBe('Reserved');
    expect(shortDescription(undefined)).toBe('');
  });

  it('names future inventory batch statuses briefly, falling back to the description name or id', () => {
    expect(futureInventoryStatusLabel('FUTURE_INV_ACTIVE', 'Active Inbound Supply')).toBe('Active');
    expect(futureInventoryStatusLabel('FUTURE_INV_EXPIRED', 'Expired: the promise date passed; a future date reactivates it')).toBe('Expired');
    expect(futureInventoryStatusLabel('FUTURE_INV_RECEIVED', 'Received: all of the quantity on order issued to receipts')).toBe('Received');
    expect(futureInventoryStatusLabel('FUTURE_INV_CANCELLED', 'Cancelled: the quantity on order cancelled to 0')).toBe('Cancelled');
    expect(futureInventoryStatusLabel('FUTURE_INV_INACTIVE', 'Inactive: set only before this release, by the old ATP rule; the ledger no longer sets it')).toBe('Inactive');
    expect(futureInventoryStatusLabel('FUTURE_INV_NEW', 'Held: waiting on approval')).toBe('Held');
    expect(futureInventoryStatusLabel('FUTURE_INV_NEW')).toBe('FUTURE_INV_NEW');
    expect(futureInventoryStatusLabel(undefined)).toBe('Unknown');
  });

  it('explains a description after its name, from a capital', () => {
    expect(descriptionExplanation('Cancelled: the quantity on order cancelled to 0')).toBe('The quantity on order cancelled to 0');
    expect(descriptionExplanation('Expired: the promise date passed; a future date reactivates it')).toBe('The promise date passed; a future date reactivates it');
    expect(descriptionExplanation('Active Inbound Supply')).toBe('');
    expect(descriptionExplanation('Cancelled:')).toBe('');
    expect(descriptionExplanation(undefined)).toBe('');
  });

  it('reads quantities without trailing zeros and timestamps as dates', () => {
    expect(readableNote('Reallocated 3.0 for order OR1:01 to FI100')).toBe('Reallocated 3 for order OR1:01 to FI100');
    expect(readableNote('Released 2.500000 of 1204.000000 for cancelled order OR1:01')).toBe('Released 2.5 of 1,204 for cancelled order OR1:01');
    expect(readableNote('Expired: promise date 2026-11-30 00:00 passed; 4.0 unsold written off')).toBe(`Expired: promise date ${formatDate('2026-11-30')} passed; 4 unsold written off`);
    expect(readableNote('Batch FI-10.2B stays')).toBe('Batch FI-10.2B stays');
    expect(readableNote(undefined)).toBe('');
  });
});

describe('product store labels', () => {
  it('adds the id to a name two stores share', () => {
    const labels = productStoreLabels([
      { productStoreId: 'STORE', storeName: 'Demo' },
      { productStoreId: 'STORE_2', storeName: 'Demo' },
      { productStoreId: 'OUTLET', storeName: 'Outlet' },
      { productStoreId: 'NONAME' },
    ]);
    expect([...labels.values()]).toEqual(['Demo (STORE)', 'Demo (STORE_2)', 'Outlet', 'NONAME']);
  });
});

describe('facility labels', () => {
  it('adds the id to a name two facilities share', () => {
    const labels = facilityLabels([
      { facilityId: 'WH_1', facilityName: 'Main' },
      { facilityId: 'WH_2', facilityName: 'Main' },
      { facilityId: 'STORE_1', facilityName: 'Outlet' },
      { facilityId: 'NONAME' },
    ]);
    expect([...labels.values()]).toEqual(['Main (WH_1)', 'Main (WH_2)', 'Outlet', 'NONAME']);
  });
});

describe('import progress label', () => {
  it('says a waiting log has not started and a running one is running', () => {
    expect(importProgressLabel('DmlsQueued', undefined, 'Queued')).toBe('Not started');
    expect(importProgressLabel('DmlsRunning', 1, 'Running')).toBe('Running');
  });

  it('shows the status of a log that ended without a finish time', () => {
    expect(importProgressLabel('DmlsFinished', undefined, 'Finished')).toBe('Finished');
    expect(importProgressLabel('DmlsFailed', 1700000000000, 'Failed')).toBe('Failed');
  });
});
