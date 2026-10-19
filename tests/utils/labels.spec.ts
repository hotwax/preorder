import { describe, expect, it } from 'vitest';
import { DateTime } from 'luxon';
import { formatDate } from '@/utils/format';
import {
  daysOverdue, facilityLabels, formatDateRange, futureInventoryTypeLabel, importProgressLabel, overdueLabel, productStoreLabels, readableNote, shortDescription, shownPartyId,
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

describe('ledger notes', () => {
  it('shortens a reason defined by its description', () => {
    expect(shortDescription("Reallocated: an order line's reservation moved from this batch to another")).toBe('Reallocated');
    expect(shortDescription('Reserved')).toBe('Reserved');
    expect(shortDescription(undefined)).toBe('');
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
